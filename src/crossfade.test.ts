import {test,expect} from 'bun:test';
import {crossfadeMs,crossfadeProgress} from './crossfade';
const clamp=(value:number)=>Math.min(2000,Math.max(50,Number.isFinite(value)?value:400));
const progress=(startedAt:number,now:number,ms?:number)=>{
  const t=(now-startedAt)/clamp(ms??400);
  return Number.isFinite(t)?Math.min(1,Math.max(0,t)):0;
};
test('crossfadeMs clamps 50–2000 (default 400); crossfadeProgress is (now-startedAt)/ms clamped 0–1',()=>{
  expect(crossfadeMs(400)).toBe(400);
  expect(crossfadeMs(50)).toBe(50);
  expect(crossfadeMs(2000)).toBe(2000);
  for(const value of [NaN,Infinity,-Infinity,-1,0,1,49,49.9,50,50.1,400,1999,2000,2000.1,1e6]){
    expect(crossfadeMs(value)).toBe(clamp(value));
    expect(crossfadeMs(value)).toBeGreaterThanOrEqual(50);
    expect(crossfadeMs(value)).toBeLessThanOrEqual(2000);
  }
  expect(crossfadeMs(Number.NaN)).toBe(crossfadeMs(400));
  expect(crossfadeMs(-20)).toBe(crossfadeMs(50));
  expect(crossfadeMs(3000)).toBe(crossfadeMs(2000));
  const started=10_000;
  for(const ms of [undefined,50,400,2000,0,10,3000,NaN] as const){
    const duration=clamp(ms??400);
    expect(crossfadeProgress(started,started,ms)).toBe(0);
    expect(crossfadeProgress(started,started+duration,ms)).toBe(1);
    expect(crossfadeProgress(started,started+duration/2,ms)).toBe(progress(started,started+duration/2,ms));
    expect(crossfadeProgress(started,started-1,ms)).toBe(0);
    expect(crossfadeProgress(started,started+duration+1,ms)).toBe(1);
    for(const extra of [-duration,-1,0,1,duration/4,duration/2,duration,duration*2]){
      const now=started+extra;
      expect(crossfadeProgress(started,now,ms)).toBe(progress(started,now,ms));
      const got=crossfadeProgress(started,now,ms);
      expect(got).toBeGreaterThanOrEqual(0);
      expect(got).toBeLessThanOrEqual(1);
    }
  }
  expect(crossfadeProgress(0,200)).toBe(crossfadeProgress(0,200,400));
  expect(crossfadeProgress(0,200,400)).toBe(200/crossfadeMs(400));
  expect(crossfadeProgress(0,0)).toBe(0);
  expect(crossfadeProgress(0,400)).toBe(1);
  expect(crossfadeProgress(5,5,50)).toBe(0);
  expect(crossfadeProgress(5,55,50)).toBe(1);
  expect(crossfadeProgress(NaN,100,400)).toBe(0);
  expect(crossfadeProgress(0,NaN,400)).toBe(0);
});
