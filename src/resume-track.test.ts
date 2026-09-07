import {test,expect} from 'bun:test';
import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LastTrack,applyResume} from './resume-track';
import {Demo} from './spotify';
test('LastTrack roundtrips last.json, clamps position>=0, and ignores corrupt files',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-last-'));
  try{
    const store=new LastTrack(directory);
    expect(await store.load()).toBeUndefined();
    await store.save('track-a',91.5);
    expect(JSON.parse(await readFile(join(directory,'last.json'),'utf8'))).toEqual({id:'track-a',position:91.5});
    expect(await store.load()).toEqual({id:'track-a',position:91.5});
    expect((await readdir(directory)).filter(n=>n.startsWith('last'))).toEqual(['last.json']);
    const restored=new LastTrack(directory);
    expect(await restored.load()).toEqual({id:'track-a',position:91.5});
    await restored.save('track-b',-8);
    expect(await restored.load()).toEqual({id:'track-b',position:0});
    expect(JSON.parse(await readFile(join(directory,'last.json'),'utf8')).position).toBe(0);
    await restored.save('track-c',NaN);
    expect(await restored.load()).toEqual({id:'track-c',position:0});
    await restored.save('track-d',Infinity);
    expect(await restored.load()).toEqual({id:'track-d',position:0});
    await restored.save('track-e',0);
    expect(await restored.load()).toEqual({id:'track-e',position:0});
    const nested=new LastTrack(join(directory,'nested'));
    expect(await nested.load()).toBeUndefined();
    await nested.save('nested-id',12);
    expect(await nested.load()).toEqual({id:'nested-id',position:12});
    expect(JSON.parse(await readFile(join(directory,'nested','last.json'),'utf8'))).toEqual({id:'nested-id',position:12});
    await writeFile(join(directory,'last.json'),JSON.stringify({id:'keep',position:-3,extra:true}));
    expect(await store.load()).toEqual({id:'keep',position:0});
    for(const raw of ['{not json','[]','null','"x"','{}','{"id":1,"position":0}','{"id":"x"}','{"position":1}','{"id":"x","position":"0"}','{"id":"x","position":null}']){
      await writeFile(join(directory,'last.json'),raw);
      expect(await store.load()).toBeUndefined();
    }
    await store.save('ok',3);
    expect(await store.load()).toEqual({id:'ok',position:3});
    const demo=new Demo();
    await store.save('demo-2',40);
    const last=await store.load();
    expect(await applyResume(undefined,id=>demo.playUri(id),pos=>demo.seek(pos))).toBe(false);
    expect(await applyResume(last,id=>demo.playUri(id),pos=>demo.seek(pos))).toBe(true);
    const resumed=await demo.read();
    expect(resumed.id).toBe('demo-2');
    expect(resumed.name).toBe('Roll With Us');
    expect(resumed.position).toBe(40);
  }finally{await rm(directory,{recursive:true,force:true});}
});
