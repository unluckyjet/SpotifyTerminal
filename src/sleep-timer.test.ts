import {test,expect} from 'bun:test';
import {SleepTimer} from './sleep-timer';
import {FocusTimer} from './focus';
test('sleep timer expires once, labels remaining, and can be cancelled',()=>{
  expect(SleepTimer).not.toBe(FocusTimer);
  const timer=new SleepTimer();expect(timer).not.toBeInstanceOf(FocusTimer);
  expect(timer.label()).toBe('');expect(timer.remaining()).toBeUndefined();expect(timer.expired()).toBe(false);
  timer.start(12,1000);expect(timer.remaining(1000)).toBe(720);expect(timer.label(1000)).toBe('Sleep 12:00');
  expect(timer.remaining(2000)).toBe(719);expect(timer.label(2000)).toBe('Sleep 11:59');
  expect(timer.expired(60_000)).toBe(false);expect(timer.label(721_000)).toBe('Sleep 00:00');
  expect(timer.expired(721_000)).toBe(true);expect(timer.expired(721_001)).toBe(false);expect(timer.remaining()).toBeUndefined();expect(timer.label()).toBe('');
  timer.start(1,0);expect(timer.remaining(0)).toBe(60);expect(timer.label(0)).toBe('Sleep 01:00');
  timer.start(180,0);expect(timer.remaining(0)).toBe(10_800);expect(timer.label(0)).toBe('Sleep 180:00');
  timer.cancel();expect(timer.expired(9e9)).toBe(false);expect(timer.label()).toBe('');
  for(const minutes of [NaN,Infinity,-1,0,0.9,181])expect(()=>timer.start(minutes)).toThrow();
});
