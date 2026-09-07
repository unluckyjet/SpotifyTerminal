import {test,expect} from 'bun:test';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SessionRestore,defaultSession} from './restore';
test('session restore defaults, validates volume/repeat, and roundtrips session.json atomically',async()=>{
  expect(defaultSession).toEqual({fullscreen:false,transitions:false,vim:false,repeat:'off',volume:50,lyricsOpen:false});
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-restore-'));
  try{
    const store=new SessionRestore(directory);
    expect(await store.load()).toEqual(defaultSession);
    const state={fullscreen:true,transitions:true,vim:true,repeat:'track' as const,volume:80,lyricsOpen:true};
    await store.save(state);
    expect(JSON.parse(await readFile(join(directory,'session.json'),'utf8'))).toEqual(state);
    const restored=new SessionRestore(directory);
    expect(await restored.load()).toEqual(state);
    const loaded=await restored.load();loaded.volume=1;expect(defaultSession.volume).toBe(50);
    await restored.save({...defaultSession,repeat:'context',volume:0});
    expect(await restored.load()).toEqual({...defaultSession,repeat:'context',volume:0});
    await restored.save({...defaultSession,volume:100,lyricsOpen:true});
    expect((await restored.load()).volume).toBe(100);expect((await restored.load()).lyricsOpen).toBe(true);
    await writeFile(join(directory,'session.json'),'{"fullscreen":true,"volume":200,"repeat":"album","vim":"yes","lyricsOpen":true,"nope":1}');
    expect(await restored.load()).toEqual({...defaultSession,fullscreen:true,lyricsOpen:true});
    await writeFile(join(directory,'session.json'),'{"volume":-1,"repeat":"OFF","transitions":1,"vim":true}');
    expect(await restored.load()).toEqual({...defaultSession,vim:true});
    for(const raw of ['{not json','[]','null','"x"','{"volume":50.5}','{"volume":101}','{"repeat":"album"}']){
      await writeFile(join(directory,'session.json'),raw);
      expect(await restored.load()).toEqual(defaultSession);
    }
    await restored.save({...defaultSession,volume:200 as never,repeat:'album' as never,fullscreen:true});
    expect(await restored.load()).toEqual({...defaultSession,fullscreen:true});
    const missing=new SessionRestore(join(directory,'missing'));
    expect(await missing.load()).toEqual(defaultSession);
    await missing.save({...defaultSession,vim:true});
    expect(await missing.load()).toEqual({...defaultSession,vim:true});
    expect(JSON.parse(await readFile(join(directory,'missing','session.json'),'utf8')).vim).toBe(true);
  }finally{await rm(directory,{recursive:true,force:true});}
});
