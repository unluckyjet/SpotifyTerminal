import {test,expect} from 'bun:test';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FavoriteStore} from './favorites';
test('favorites persist ids and toggle returns the new has() state',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-favorites-'));
  try{
    const f=new FavoriteStore(directory);await f.load();
    expect(f.ids.size).toBe(0);expect(f.has('a')).toBe(false);expect(f.list()).toEqual([]);
    expect(await f.toggle('a')).toBe(true);expect(f.has('a')).toBe(true);
    expect(await f.toggle('b')).toBe(true);expect(f.list()).toEqual(['a','b']);
    expect(await f.toggle('a')).toBe(false);expect(f.has('a')).toBe(false);expect(f.has('b')).toBe(true);
    const saved=JSON.parse(await readFile(join(directory,'favorites.json'),'utf8'));
    expect(saved).toEqual(f.list());expect(saved).toEqual(['b']);
    const restored=new FavoriteStore(directory);await restored.load();
    expect(restored.list()).toEqual(['b']);expect(restored.has('b')).toBe(true);expect(restored.has('a')).toBe(false);
    expect(await restored.toggle('b')).toBe(false);expect(restored.has('b')).toBe(false);
    expect(JSON.parse(await readFile(join(directory,'favorites.json'),'utf8'))).toEqual([]);
    await writeFile(join(directory,'favorites.json'),'{not json');
    const broken=new FavoriteStore(directory);await broken.load();
    expect(broken.list()).toEqual([]);
    await writeFile(join(directory,'favorites.json'),JSON.stringify(['ok',1,null,'ok',{id:'x'}]));
    const mixed=new FavoriteStore(directory);await mixed.load();
    expect(mixed.list()).toEqual(['ok']);expect(mixed.has('ok')).toBe(true);
  }finally{await rm(directory,{recursive:true,force:true});}
});
