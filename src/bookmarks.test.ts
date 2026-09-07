import {test,expect} from 'bun:test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BookmarkStore} from './bookmarks';
test('bookmarks persist, clamp, default to mm:ss, and pick the nearest mark',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-bookmarks-'));
  try{
    const store=new BookmarkStore(directory);await store.load();
    expect(store.items).toEqual([]);expect(store.nearest('song',10)).toBeUndefined();
    const intro=await store.add('song',-12);expect(intro.position).toBe(0);expect(intro.label).toBe('0:00');
    const chorus=await store.add('song',125.4,'chorus');expect(chorus.position).toBe(125.4);
    const drop=await store.add('song',195);expect(drop.label).toBe('3:15');
    await store.add('other',30,'bridge');
    expect(store.forTrack('song').map(b=>b.position)).toEqual([0,125.4,195]);
    expect(store.nearest('song',130)?.label).toBe('chorus');
    expect(store.nearest('song',10)?.position).toBe(0);
    expect(store.nearest('song',200)?.label).toBe('3:15');
    expect(store.nearest('song',160.2)?.position).toBe(125.4);
    expect(await store.remove('song',125.4)).toBe(true);expect(await store.remove('song',125.4)).toBe(false);
    expect(store.forTrack('song').map(b=>b.label)).toEqual(['0:00','3:15']);
    const restored=new BookmarkStore(directory);await restored.load();
    expect(restored.forTrack('song').map(b=>b.label)).toEqual(['0:00','3:15']);
    expect(restored.nearest('other',0)?.label).toBe('bridge');
    expect(JSON.parse(await readFile(join(directory,'bookmarks.json'),'utf8'))).toHaveLength(3);
    const relabel=await store.add('song',0,'intro');expect(relabel.label).toBe('intro');
    await restored.load();expect(restored.forTrack('song')[0].label).toBe('intro');
  }finally{await rm(directory,{recursive:true,force:true});}
});
