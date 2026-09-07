import {test,expect} from 'bun:test';
import {idleOpacity,isIdle} from './idle';
const faded=(dt:number,afterMs:number)=>Math.max(0.35,1-(dt-afterMs)/10_000);
test('isIdle after afterMs (default 8000); idleOpacity stays 1 until then then fades to 0.35',()=>{
  const after=8000;
  for(const last of [0,1000,50_000]){
    for(const extra of [-after,-1,0,1,4000,10_000,20_000,1e6]){
      const now=last+after+extra;
      const idle=now-last>=after;
      expect(isIdle(last,now)).toBe(idle);
      expect(isIdle(last,now,after)).toBe(idle);
      expect(idleOpacity(last,now)).toBe(idle?faded(now-last,after):1);
      expect(idleOpacity(last,now,after)).toBe(idle?faded(now-last,after):1);
    }
  }
  expect(isIdle(0,7999)).toBe(false);
  expect(isIdle(0,8000)).toBe(true);
  expect(idleOpacity(0,7999)).toBe(1);
  expect(idleOpacity(0,8000)).toBe(1);
  expect(idleOpacity(0,13_000)).toBe(faded(13_000,8000));
  expect(idleOpacity(0,18_000)).toBe(0.35);
  expect(idleOpacity(0,1e9)).toBe(0.35);
  expect(isIdle(0,500,500)).toBe(true);
  expect(isIdle(0,499,500)).toBe(false);
  expect(idleOpacity(0,5500,500)).toBe(faded(5500,500));
  expect(idleOpacity(0,10_500,500)).toBe(0.35);
  expect(isIdle(Date.now())).toBe(false);
  expect(idleOpacity(Date.now())).toBe(1);
  expect(isIdle(0)).toBe(true);
  expect(idleOpacity(0)).toBe(0.35);
});
