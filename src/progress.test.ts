import {test,expect} from 'bun:test';
import {progressPercent,progressLabel} from './progress';
test('progressPercent is 0 when duration<=0 else rounded clamped ratio, label is n%',()=>{
  expect(progressPercent(50,0)).toBe(0);
  expect(progressPercent(50,-10)).toBe(0);
  expect(progressPercent(0,0)).toBe(0);
  expect(progressPercent(37,100)).toBe(37);
  expect(progressPercent(0,240)).toBe(0);
  expect(progressPercent(240,240)).toBe(100);
  expect(progressPercent(-20,200)).toBe(0);
  expect(progressPercent(300,200)).toBe(100);
  const duration=180;
  for(const position of [0,1,45,67.4,90,179.9,180,200,-5]){
    const n=progressPercent(position,duration);
    expect(n).toBe(duration<=0?0:Math.round(100*Math.min(1,Math.max(0,position/duration))));
    expect(progressLabel(position,duration)).toBe(`${n}%`);
  }
  expect(progressLabel(1,3)).toBe(`${progressPercent(1,3)}%`);
  expect(progressLabel(50,0)).toBe('0%');
});
