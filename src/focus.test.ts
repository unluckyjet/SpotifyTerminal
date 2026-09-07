import {test,expect} from 'bun:test';
import {FocusTimer} from './focus';
test('focus timer expires once, handles sleep, and can be cancelled',()=>{
  const timer=new FocusTimer();timer.start(1,1000);expect(timer.remaining(2000)).toBe(59);expect(timer.expired(60_000)).toBe(false);
  expect(timer.expired(500_000)).toBe(true);expect(timer.expired(500_001)).toBe(false);expect(timer.remaining()).toBeUndefined();
  timer.start(25,1000);timer.cancel();expect(timer.expired(9e9)).toBe(false);
  for(const minutes of [NaN,Infinity,-1,0,1441])expect(()=>timer.start(minutes)).toThrow();
});
