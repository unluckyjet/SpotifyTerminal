import {test,expect} from 'bun:test';
import {clampedDt} from './dt';
const clamp=(prev:number,now:number,cap=5)=>{
  const limit=Number.isFinite(cap)?Math.max(0,cap):5;
  const dt=(now-prev)/1000;
  return Number.isFinite(dt)?Math.min(limit,Math.max(0,dt)):0;
};
test('clampedDt is seconds between stamps, cap default 5, negative 0',()=>{
  expect(clampedDt(1000,3000)).toBe(2);
  expect(clampedDt(0,2000)).toBe(2);
  expect(clampedDt(0,5000)).toBe(5);
  expect(clampedDt(0,20_000)).toBe(5);
  expect(clampedDt(13_000,20_000)).toBe(5);
  expect(clampedDt(5000,1000)).toBe(0);
  expect(clampedDt(10,9)).toBe(0);
  expect(clampedDt(1000,1000)).toBe(0);
  expect(clampedDt(0,2500)).toBe(2.5);
  expect(clampedDt(0,100_000)).toBe(clampedDt(0,100_000,5));
  expect(clampedDt(0,10_000,1)).toBe(1);
  expect(clampedDt(0,500,1)).toBe(0.5);
  expect(clampedDt(0,10_000,0)).toBe(0);
  const cases:[number,number,number?][]=[
    [0,0],[0,1000],[0,2000],[0,4999],[0,5000],[0,5001],[0,7000],[0,16_000],[0,1e9],
    [1000,3000],[10_000,10_000],[10_000,12_000],[10_000,9000],[5000,1000],
    [1250,3750],[100_000,100_250],[8000,13_000],[8000,13_010],
    [0,10_000,2],[0,500,1],[0,10_000,0],[0,10_000,-1],[0,3000,NaN],[0,10_000,Infinity],
    [NaN,1000],[1000,NaN],[Infinity,0],[0,Infinity],[-Infinity,0],[0,-Infinity],
  ];
  for(const [prev,now,cap] of cases){
    const got=cap===undefined?clampedDt(prev,now):clampedDt(prev,now,cap);
    const want=cap===undefined?clamp(prev,now):clamp(prev,now,cap);
    expect(got).toBe(want);
    expect(got).toBeGreaterThanOrEqual(0);
    const limit=cap===undefined||!Number.isFinite(cap)?5:Math.max(0,cap);
    expect(got).toBeLessThanOrEqual(limit);
  }
  const t=Date.now();
  expect(clampedDt(t,t)).toBe(0);
  expect(clampedDt(t,t+1000)).toBe(1);
  expect(clampedDt(t,t+9000)).toBe(5);
  expect(clampedDt(t+1000,t)).toBe(0);
});
