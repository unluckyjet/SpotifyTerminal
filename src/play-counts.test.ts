import {test,expect} from 'bun:test';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PlayCounts} from './play-counts';
test('play counts increment persist atomically and restore after reopening',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-counts-'));
  try{
    const p=new PlayCounts(directory);await p.load();
    expect(p.count('a')).toBe(0);expect(Object.keys(p.counts)).toHaveLength(0);
    expect(await p.record('a')).toBe(1);expect(await p.record('a')).toBe(2);expect(await p.record('b')).toBe(1);
    expect(p.count('a')).toBe(2);expect(p.count('b')).toBe(1);expect(p.count('c')).toBe(0);
    expect(await p.record('')).toBe(0);expect(p.count('')).toBe(0);
    const onDisk=JSON.parse(await readFile(join(directory,'counts.json'),'utf8'));
    expect(onDisk.a).toBe(2);expect(onDisk.b).toBe(1);
    const restored=new PlayCounts(directory);await restored.load();
    expect(restored.count('a')).toBe(2);expect(restored.count('b')).toBe(1);expect(await restored.record('a')).toBe(3);
    const again=new PlayCounts(directory);await again.load();expect(again.count('a')).toBe(3);
    await writeFile(join(directory,'counts.json'),'not json');
    const bad=new PlayCounts(directory);await bad.load();expect(bad.counts).toEqual({});
    await writeFile(join(directory,'counts.json'),JSON.stringify({a:4,b:'no',c:-1,d:1.5,e:0}));
    const filtered=new PlayCounts(directory);await filtered.load();
    expect(filtered.count('a')).toBe(4);expect(filtered.count('b')).toBe(0);expect(filtered.count('c')).toBe(0);expect(filtered.count('d')).toBe(0);expect(filtered.count('e')).toBe(0);
    const missing=new PlayCounts(join(directory,'missing'));await missing.load();
    expect(missing.counts).toEqual({});expect(await missing.record('z')).toBe(1);
    const concurrent=await Promise.all([p.record('x'),p.record('x')]);
    expect(concurrent.sort((l,r)=>l-r)).toEqual([1,2]);expect(p.count('x')).toBe(2);
  }finally{await rm(directory,{recursive:true,force:true});}
});
