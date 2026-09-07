import {test,expect} from 'bun:test';
import {seededShuffle} from './shuffle-seed';

function sameMultiset<T>(a:T[],b:T[]){
  expect(a.length).toBe(b.length);
  const counts=new Map<T,number>();
  for(const x of a)counts.set(x,(counts.get(x)??0)+1);
  for(const x of b)counts.set(x,(counts.get(x)??0)-1);
  expect([...counts.values()].every(n=>n===0)).toBe(true);
}

test('seededShuffle is Fisher-Yates from an LCG, copies input, and is deterministic per seed',()=>{
  const items=[0,1,2,3,4,5,6,7,8,9];
  const frozen=items.slice();
  const a=seededShuffle(items,42);
  expect(items).toEqual(frozen);
  expect(a).not.toBe(items);
  sameMultiset(a,items);
  expect(seededShuffle(items,42)).toEqual(a);
  expect(seededShuffle(items,42)).toEqual(seededShuffle(items.slice(),42));
  expect(seededShuffle(items,43)).not.toEqual(a);
  expect(seededShuffle(items,1)).not.toEqual(seededShuffle(items,2));
  expect(seededShuffle(items,0)).not.toEqual(seededShuffle(items,1));
  expect(a).not.toEqual(items);

  expect(seededShuffle([],7)).toEqual([]);
  expect(seededShuffle(['solo'],99)).toEqual(['solo']);
  const one=['x'];expect(seededShuffle(one,3)).not.toBe(one);expect(one).toEqual(['x']);

  const objs=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
  const shuffled=seededShuffle(objs,11);
  expect(shuffled).not.toBe(objs);
  expect(objs.map(o=>o.id)).toEqual(['a','b','c','d']);
  expect(new Set(shuffled).size).toBe(objs.length);
  expect(shuffled.every(o=>objs.includes(o))).toBe(true);
  expect(seededShuffle(objs,11)).toEqual(shuffled);
  expect(seededShuffle(objs,12)).not.toEqual(shuffled);

  expect(seededShuffle(items,-1)).toEqual(seededShuffle(items,4294967295));
  expect(seededShuffle(items,42.9)).toEqual(seededShuffle(items,42));
  expect(seededShuffle(items,NaN)).toEqual(seededShuffle(items,0));

  const dups=['a','a','b','b','c'];
  sameMultiset(seededShuffle(dups,5),dups);
  expect(seededShuffle(dups,5)).toEqual(seededShuffle(dups,5));
});
