import {test,expect} from 'bun:test';
import {trackIdenticon} from './identicon';

function grid(id:string,size?:number){
  const icon=trackIdenticon(id,size);
  const rows=icon.split('\n');
  return {icon,rows,n:rows.length,w:rows[0]?.length??0};
}

test('trackIdenticon is a symmetric odd ASCII grid from a stable djb2 of the id',()=>{
  const a=grid('4iV5W9uYEdYUVa79Axb7Rh');
  expect(a.icon).toBe(trackIdenticon('4iV5W9uYEdYUVa79Axb7Rh'));
  expect(a.icon).toBe(trackIdenticon('4iV5W9uYEdYUVa79Axb7Rh',5));
  expect(a.n).toBe(5);expect(a.w).toBe(5);
  expect(a.rows.every(row=>row.length===a.w)).toBe(true);
  expect(a.rows.every(row=>row=== [...row].reverse().join(''))).toBe(true);
  expect(a.rows.every(row=>[...row].every(ch=>ch==='█'||ch===' '))).toBe(true);
  expect(a.icon.includes('\n')).toBe(true);

  expect(grid('x').icon).not.toBe(grid('y').icon);
  expect(grid('').icon).not.toBe(grid('x').icon);
  const seen=new Set(['a','b','c','d','e','f','g','h','i','j','ab','ba','track','Track','1','2'].map(id=>trackIdenticon(id)));
  expect(seen.size).toBeGreaterThan(12);

  expect(grid('x',3).n).toBe(5);
  expect(grid('x',4).n).toBe(5);
  expect(grid('x',NaN).n).toBe(5);
  expect(grid('x',Infinity).n).toBe(5);
  expect(grid('x',-2).n).toBe(5);
  expect(grid('x',16).n).toBe(15);
  expect(grid('x',99).n).toBe(15);
  expect(grid('x',6).n%2).toBe(1);
  expect(grid('x',6).n).toBeGreaterThanOrEqual(5);
  expect(grid('x',6).n).toBeLessThanOrEqual(15);
  expect(grid('x',14).n%2).toBe(1);

  for(const size of [5,7,9,11,13,15]){
    const g=grid('spotify-id',size);
    expect(g.n).toBe(size);expect(g.w).toBe(size);
    expect(g.icon).toBe(trackIdenticon('spotify-id',size));
    expect(new Set(g.rows.map(row=>row.length)).size).toBe(1);
    for(const row of g.rows){
      expect(row).toBe([...row].reverse().join(''));
      expect([...row].every(ch=>ch==='█'||ch===' ')).toBe(true);
    }
    expect(g.rows.join('\n')).toBe(g.icon);
  }

  const big=grid('wide',15);
  expect(big.rows.some(row=>row.includes('█'))).toBe(true);
  expect(big.rows.some(row=>row.includes(' '))).toBe(true);
  expect(grid('alpha',7).icon).not.toBe(grid('beta',7).icon);
  expect(grid('same',5).n).not.toBe(grid('same',9).n);
});
