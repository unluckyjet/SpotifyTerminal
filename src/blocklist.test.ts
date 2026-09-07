import {test,expect} from 'bun:test';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Blocklist} from './blocklist';
test('blocklist persists ids, shouldSkip matches has, empty id never skipped',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-blocklist-'));
  try{
    const b=new Blocklist(directory);await b.load();
    expect(b.has('track-1')).toBe(false);expect(b.shouldSkip('track-1')).toBe(false);
    await b.add('track-1');await b.add('track-2');await b.add('track-1');await b.add('');
    expect([...b.ids].sort()).toEqual(['track-1','track-2']);
    for(const id of ['track-1','track-2','track-3',''])expect(b.shouldSkip(id)).toBe(b.has(id));
    expect(b.has('')).toBe(false);expect(b.shouldSkip('')).toBe(false);expect(b.ids.has('')).toBe(false);
    b.ids.add('');expect(b.has('')).toBe(false);expect(b.shouldSkip('')).toBe(false);
    const restored=new Blocklist(directory);await restored.load();
    expect(restored.has('track-1')).toBe(true);expect(restored.shouldSkip('track-1')).toBe(true);
    expect(restored.shouldSkip('track-2')).toBe(restored.has('track-2'));
    expect(restored.has('')).toBe(false);expect(restored.shouldSkip('')).toBe(false);
    await restored.remove('track-1');await restored.remove('missing');
    expect(restored.has('track-1')).toBe(false);expect(restored.shouldSkip('track-1')).toBe(false);
    expect(restored.has('track-2')).toBe(true);
    const again=new Blocklist(directory);await again.load();
    expect(again.has('track-1')).toBe(false);expect(again.shouldSkip('track-2')).toBe(true);
    expect(JSON.parse(await readFile(join(directory,'blocklist.json'),'utf8'))).toEqual(['track-2']);
    await writeFile(join(directory,'blocklist.json'),'{"not":"an array"}');
    const ignored=new Blocklist(directory);await ignored.load();expect([...ignored.ids]).toEqual([]);
    await writeFile(join(directory,'blocklist.json'),'["ok","","1",2,null]');
    const filtered=new Blocklist(directory);await filtered.load();
    expect([...filtered.ids]).toEqual(['ok','1']);expect(filtered.shouldSkip('')).toBe(false);
  }finally{await rm(directory,{recursive:true,force:true});}
});
