import {test,expect} from 'bun:test';
import {hashColor} from './hash-color';

function djb2(id:string){
  let h=5381;
  for(let i=0;i<id.length;i++)h=((h<<5)+h+id.charCodeAt(i))>>>0;
  return h;
}
function hex(id:string){
  return '#'+(djb2(id)&0xffffff).toString(16).padStart(6,'0');
}

test('hashColor is a stable djb2 #rrggbb of the id',()=>{
  const hexColor=/^#[0-9a-f]{6}$/;
  const ids=['','a','A','aa','hello','4iV5W9uYEdYUVa79Axb7Rh','track','Track','x','y','ab','ba','spotify:track:abc','🎵','\0','1','2','id'];
  for(const id of ids){
    const color=hashColor(id);
    const n=djb2(id)&0xffffff;
    expect(color).toBe(hex(id));
    expect(color).toBe(hashColor(id));
    expect(hexColor.test(color)).toBe(true);
    expect(color.length).toBe(7);
    expect(color.startsWith('#')).toBe(true);
    expect(color.slice(1)).toBe(color.slice(1).toLowerCase());
    expect(parseInt(color.slice(1),16)).toBe(n);
    expect(parseInt(color.slice(1,3),16)).toBe((n>>16)&0xff);
    expect(parseInt(color.slice(3,5),16)).toBe((n>>8)&0xff);
    expect(parseInt(color.slice(5,7),16)).toBe(n&0xff);
  }
  expect(hashColor('x')).not.toBe(hashColor('y'));
  expect(hashColor('track')).not.toBe(hashColor('Track'));
  expect(hashColor('ab')).not.toBe(hashColor('ba'));
  expect(hashColor('')).not.toBe(hashColor('a'));
  expect(hashColor('aa')).not.toBe(hashColor('a'));
  const seen=new Set(['a','b','c','d','e','f','g','h','i','j','ab','ba','track','Track','1','2'].map(id=>hashColor(id)));
  expect(seen.size).toBeGreaterThan(12);
  expect(seen.size).toBe(16);
  expect(hashColor('').length).toBe(7);
  expect(hashColor('').slice(1).length).toBe(6);
});
