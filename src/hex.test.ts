import {test,expect} from 'bun:test';
import {parseHex,formatHex} from './hex';

const clamp=(n:number)=>Math.min(255,Math.max(0,Math.round(Number.isFinite(n)?n:0)));
const hex6=(rgb:[number,number,number])=>'#'+rgb.map(v=>clamp(v).toString(16).padStart(2,'0')).join('');
const expand=(color:string):[number,number,number]|undefined=>{
  const raw=color.trim();
  const h=raw.startsWith('#')?raw.slice(1):raw;
  if(!/^[0-9a-f]{3}$/i.test(h)&&!/^[0-9a-f]{6}$/i.test(h))return;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16)) as [number,number,number];
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)) as [number,number,number];
};

test('parseHex reads #rgb and #rrggbb; formatHex is lowercase #rrggbb',()=>{
  const samples:[number,number,number][]=[[0,0,0],[255,255,255],[1,2,3],[18,52,86],[170,187,204],[255,0,128],[10,11,12],[9,10,11],[240,196,0]];
  for(const rgb of samples){
    const hex=hex6(rgb);
    expect(parseHex(hex)).toEqual(rgb.map(clamp) as [number,number,number]);
    expect(parseHex(hex.toUpperCase())).toEqual(parseHex(hex));
    expect(parseHex(` ${hex} `)).toEqual(parseHex(hex));
    expect(parseHex(hex.slice(1))).toEqual(parseHex(hex));
    expect(formatHex(rgb)).toBe(hex);
    expect(formatHex(rgb)).toBe(hex.toLowerCase());
    expect(formatHex(rgb)).toMatch(/^#[0-9a-f]{6}$/);
    expect(parseHex(formatHex(rgb))).toEqual(rgb.map(clamp) as [number,number,number]);
  }
  for(const nibble of [0,1,7,10,15]){
    const digits=[nibble,(nibble+5)&15,15-nibble];
    const short='#'+digits.map(v=>v.toString(16)).join('');
    const rgb=expand(short)!;
    expect(rgb).toEqual(digits.map(v=>v*17) as [number,number,number]);
    expect(parseHex(short)).toEqual(rgb);
    expect(parseHex(short.toUpperCase())).toEqual(rgb);
    expect(parseHex(short.slice(1))).toEqual(rgb);
    expect(formatHex(rgb)).toBe(hex6(rgb));
    expect(formatHex(parseHex(short)!)).toBe(hex6(rgb));
  }
  const abc=parseHex('#abc');
  expect(abc).toEqual(expand('#aabbcc'));
  expect(abc).toEqual(parseHex('#AABBCC'));
  expect(formatHex(abc!)).toBe(hex6(abc!));
  expect(formatHex(abc!)).toBe(formatHex(abc!).toLowerCase());
  expect(formatHex([10,11,12])).not.toBe(formatHex([10,11,12]).toUpperCase());
  expect(formatHex([-1,300,1.4])).toBe(hex6([0,255,1.4]));
  expect(formatHex([NaN,Infinity,-Infinity])).toBe(hex6([0,0,0]));
  for(const bad of ['','#','#gg0000','#ffff','#fffffff','red','#12345','#1234567','#xyz','#12','  ','#ggg','#rgba','#ff00ff00','#fffffg']){
    expect(parseHex(bad)).toBeUndefined();
    expect(expand(bad)).toBeUndefined();
  }
});
