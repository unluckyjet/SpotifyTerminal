import {test,expect} from 'bun:test';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {RatingStore} from './ratings';
test('ratings persist integer 1-5 stars and format filled/empty glyphs',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-ratings-'));
  try{
    const store=new RatingStore(directory);await store.load();
    expect(store.get('t')).toBeUndefined();expect(store.stars('t')).toBe('');
    await store.rate('t',3);expect(store.get('t')).toBe(3);expect(store.stars('t')).toBe('★★★☆☆');
    await store.rate('low',1);expect(store.stars('low')).toBe('★☆☆☆☆');
    await store.rate('high',5);expect(store.stars('high')).toBe('★★★★★');
    await store.rate('t',4);expect(store.stars('t')).toBe('★★★★☆');
    for(const n of [0,6,-1,1.5,NaN,Infinity,3.1])await expect(store.rate('t',n)).rejects.toThrow();
    expect(store.get('t')).toBe(4);expect(JSON.parse(await readFile(join(directory,'ratings.json'),'utf8'))).toEqual({t:4,low:1,high:5});
    const restored=new RatingStore(directory);await restored.load();
    expect(restored.get('t')).toBe(4);expect(restored.stars('low')).toBe('★☆☆☆☆');expect(restored.stars('gone')).toBe('');
    await writeFile(join(directory,'ratings.json'),JSON.stringify({ok:2,bad:0,frac:2.5,s:'5',six:6}));
    await restored.load();expect(restored.get('ok')).toBe(2);expect(restored.get('bad')).toBeUndefined();expect(restored.get('s')).toBeUndefined();
    await writeFile(join(directory,'ratings.json'),'{not json');await restored.load();expect(restored.scores).toEqual({});
    const missing=new RatingStore(join(directory,'nope'));await missing.load();expect(missing.scores).toEqual({});
  }finally{await rm(directory,{recursive:true,force:true});}
});
