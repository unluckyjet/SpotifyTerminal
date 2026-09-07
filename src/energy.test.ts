import {test,expect} from 'bun:test';
import {coverEnergy} from './energy';
import {luma} from './mono';

const hex=(r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
const sat=(r:number,g:number,b:number)=>(Math.max(r,g,b)-Math.min(r,g,b))/255;
const expected=(px:number[])=>{
  let y=0,s=0,n=0;
  for(let i=0;i+2<px.length;i+=3){
    y+=luma(hex(px[i]!,px[i+1]!,px[i+2]!));
    s+=sat(px[i]!,px[i+1]!,px[i+2]!);
    n++;
  }
  return n?Math.min(1,Math.max(0,(y/n/255)*(0.5+s/n/2))):0;
};

test('coverEnergy is 0-1 from mean luma/255 * (0.5+mean saturation/2); empty 0; black ~0; white high',()=>{
  expect(coverEnergy(Buffer.alloc(0))).toBe(0);
  expect(coverEnergy(Buffer.from([12,34]))).toBe(0);
  const black=coverEnergy(Buffer.from([0,0,0]));
  const white=coverEnergy(Buffer.from([255,255,255]));
  const gray=coverEnergy(Buffer.from([128,128,128]));
  expect(black).toBe(0);
  expect(black).toBeCloseTo(0);
  expect(white).toBeGreaterThan(0.4);
  expect(white).toBeGreaterThan(black);
  expect(white).toBeGreaterThan(gray);
  expect(gray).toBeGreaterThan(black);
  const samples=[
    [0,0,0],[1,1,1],[255,255,255],[128,128,128],[255,0,0],[0,255,0],[0,0,255],
    [255,255,0],[40,80,120],[200,10,30,8,16,32],[255,255,255,0,0,0],[20,40,60,80],
  ];
  for(const px of samples){
    const e=coverEnergy(Buffer.from(px));
    expect(e).toBeGreaterThanOrEqual(0);
    expect(e).toBeLessThanOrEqual(1);
    expect(e).toBeCloseTo(expected(px));
  }
  expect(coverEnergy(Buffer.from([255,255,0]))).toBeGreaterThan(white);
});
