import {test,expect} from 'bun:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ListeningHistory} from './history';
import {Demo} from './spotify';
test('history records played tracks once and restores artwork after reopening',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-history-'));
  try{
    const h=new ListeningHistory(directory);await h.load();const t=await new Demo().read();
    await h.record({...t,playing:false});expect(h.entries).toHaveLength(0);
    const art={encoded:Buffer.from('cover bytes'),palette:Buffer.from([1,2,3])};
    await h.record(t,art);await h.record(t,art);expect(h.entries).toHaveLength(1);
    const restored=new ListeningHistory(directory);await restored.load();
    expect(restored.entries[0].name).toBe(t.name);expect(await restored.cover(restored.entries[0])).toEqual(art.encoded);
    expect(await restored.cover({...restored.entries[0],coverKey:'../../private'})).toBeUndefined();
  }finally{await rm(directory,{recursive:true,force:true});}
});
