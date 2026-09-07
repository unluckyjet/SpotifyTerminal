import {test,expect} from 'bun:test';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {shouldScrobble,ScrobbleLog} from './scrobble';
const song=(over:Partial<{id:string;name:string;artist:string;album:string;duration:number;position:number;playing:boolean}>={})=>({
  id:'a',name:'Go To Town',artist:'Doja Cat',album:'Amala',duration:100,position:50,playing:true,...over,
});
test('shouldScrobble is true at half the track or four minutes of a finite duration',()=>{
  expect(shouldScrobble(0,100)).toBe(false);expect(shouldScrobble(49,100)).toBe(false);expect(shouldScrobble(50,100)).toBe(true);
  expect(shouldScrobble(15,30)).toBe(true);expect(shouldScrobble(14,30)).toBe(false);
  expect(shouldScrobble(239,600)).toBe(false);expect(shouldScrobble(240,600)).toBe(true);expect(shouldScrobble(240,1000)).toBe(true);
  expect(shouldScrobble(0,0)).toBe(false);expect(shouldScrobble(240,0)).toBe(false);expect(shouldScrobble(240,-4)).toBe(false);
  expect(shouldScrobble(50,Number.NaN)).toBe(false);expect(shouldScrobble(Number.NaN,100)).toBe(false);
});
test('ScrobbleLog records once per id this session and persists scrobbles.json',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-scrobble-'));
  try{
    const log=new ScrobbleLog(directory);await log.load();
    expect(log.entries).toHaveLength(0);
    expect(await log.maybeRecord(song({playing:false}))).toBe(false);
    expect(await log.maybeRecord(song({position:49}))).toBe(false);
    expect(await log.maybeRecord(song({id:'',position:50}))).toBe(false);
    expect(log.entries).toHaveLength(0);
    expect(await log.maybeRecord(song({position:50}))).toBe(true);
    expect(await log.maybeRecord(song({position:80}))).toBe(false);
    expect(await log.maybeRecord(song({id:'long',duration:600,position:239}))).toBe(false);
    expect(await log.maybeRecord(song({id:'long',duration:600,position:240,playing:false}))).toBe(false);
    expect(await log.maybeRecord(song({id:'long',name:'Long',artist:'X',duration:600,position:240}))).toBe(true);
    expect(log.entries).toHaveLength(2);
    expect(log.entries[0]).toMatchObject({id:'a',name:'Go To Town',artist:'Doja Cat'});
    expect(log.entries[1]).toMatchObject({id:'long',name:'Long',artist:'X'});
    expect(log.entries[0]).not.toHaveProperty('album');
    const at=Date.parse(log.entries[0].playedAt);expect(Number.isFinite(at)).toBe(true);
    const raw=JSON.parse(await readFile(join(directory,'scrobbles.json'),'utf8'));
    expect(raw).toEqual(log.entries);expect(raw[0].album).toBeUndefined();
    const restored=new ScrobbleLog(directory);await restored.load();
    expect(restored.entries).toEqual(log.entries);
    expect(await restored.maybeRecord(song({position:50}))).toBe(true);
    expect(restored.entries).toHaveLength(3);expect(restored.entries[2].id).toBe('a');
    expect(await restored.maybeRecord(song({position:99}))).toBe(false);
    await writeFile(join(directory,'scrobbles.json'),'not json');
    const broken=new ScrobbleLog(directory);await broken.load();expect(broken.entries).toEqual([]);
    await writeFile(join(directory,'scrobbles.json'),JSON.stringify([
      {id:'ok',name:'n',artist:'ar',playedAt:'2026-01-02T03:04:05.000Z',album:'ignored'},
      {id:1,name:'n',artist:'ar',playedAt:'t'},null,'x',{id:'no',name:'n',artist:'ar'},
    ]));
    const filtered=new ScrobbleLog(directory);await filtered.load();
    expect(filtered.entries).toEqual([{id:'ok',name:'n',artist:'ar',playedAt:'2026-01-02T03:04:05.000Z'}]);
    const missing=new ScrobbleLog(join(directory,'missing'));await missing.load();
    expect(missing.entries).toEqual([]);expect(await missing.maybeRecord(song({id:'z'}))).toBe(true);
    expect(JSON.parse(await readFile(join(directory,'missing','scrobbles.json'),'utf8'))[0].id).toBe('z');
  }finally{await rm(directory,{recursive:true,force:true});}
});
