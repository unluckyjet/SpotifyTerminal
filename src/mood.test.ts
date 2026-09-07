import {test,expect} from 'bun:test';
import {coverMood} from './mood';

const rgb=(...px:number[][])=>Buffer.from(px.flat());
const luma=(r:number,g:number,b:number)=>(2126*r+7152*g+722*b)/10000;
const fromAvg=(r:number,g:number,b:number)=>{
  const y=luma(r,g,b);
  if(y<40)return 'dark';
  if(y>200)return 'bright';
  if(r>g+10&&r>b)return 'warm';
  if(b>r+10)return 'cool';
  return 'muted';
};

test('coverMood averages RGB luma/chroma into dark, bright, warm, cool, or muted',()=>{
  expect(coverMood(Buffer.alloc(0))).toBe('muted');
  expect(coverMood(Buffer.from([12]))).toBe('muted');
  expect(coverMood(Buffer.from([12,34]))).toBe('muted');
  expect(coverMood(rgb([0,0,0]))).toBe('dark');
  expect(coverMood(rgb([39,39,39]))).toBe('dark');
  expect(luma(40,40,40)).toBe(40);
  expect(coverMood(rgb([40,40,40]))).toBe('muted');
  expect(coverMood(rgb([128,128,128]))).toBe('muted');
  expect(coverMood(rgb([200,200,200]))).toBe('muted');
  expect(coverMood(rgb([201,201,201]))).toBe('bright');
  expect(coverMood(rgb([255,255,255]))).toBe('bright');
  expect(coverMood(rgb([180,20,20]))).toBe('warm');
  expect(coverMood(rgb([50,0,0]))).toBe('dark');
  expect(coverMood(rgb([255,220,200]))).toBe('bright');
  expect(coverMood(rgb([40,90,180]))).toBe('cool');
  expect(coverMood(rgb([0,0,255]))).toBe('dark');
  expect(luma(0,0,255)).toBeLessThan(40);
  expect(coverMood(rgb([100,95,50]))).toBe('muted');
  expect(coverMood(rgb([100,50,100]))).toBe('muted');
  expect(coverMood(rgb([0,180,0]))).toBe('muted');
  const samples=[0,10,39,40,50,80,128,160,180,200,201,220,255];
  for(const r of samples)for(const g of samples)for(const b of samples){
    expect(coverMood(rgb([r,g,b]))).toBe(fromAvg(r,g,b));
  }
  const pairs=[[[0,0,0],[255,255,255]],[[180,20,20],[20,20,180]],[[255,0,0],[0,255,0]],[[10,10,10],[30,30,250]],[[200,40,40],[160,20,20]]] as [number,number,number][][];
  for(const [a,b] of pairs){
    const r=(a[0]+b[0])/2,g=(a[1]+b[1])/2,bl=(a[2]+b[2])/2;
    expect(coverMood(rgb(a,b))).toBe(fromAvg(r,g,bl));
    expect(coverMood(Buffer.from([...a,...b,99]))).toBe(fromAvg(r,g,bl));
    expect(coverMood(Buffer.from([...a,...b,99,100]))).toBe(fromAvg(r,g,bl));
  }
  expect(coverMood(rgb([180,20,20],[180,20,20],[180,20,20]))).toBe('warm');
  expect(coverMood(rgb([40,90,180],[40,90,180]))).toBe('cool');
});
