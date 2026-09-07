import {test,expect} from 'bun:test';
import {seekFromClick} from './seek-click';
test('seekFromClick maps bar clicks to duration and ignores misses',()=>{
  const bar={x:10,width:20};const duration=100;
  expect(seekFromClick(9,bar,duration)).toBeUndefined();
  expect(seekFromClick(30,bar,duration)).toBeUndefined();
  expect(seekFromClick(10,{x:10,width:0},duration)).toBeUndefined();
  expect(seekFromClick(10,{x:10,width:-3},duration)).toBeUndefined();
  expect(seekFromClick(15,bar,-1)).toBeUndefined();
  expect(seekFromClick(10,bar,duration)).toBe(0);
  expect(seekFromClick(10,bar,0)).toBe(0);
  for(const x of [10,15.5,20,29]){
    const got=seekFromClick(x,bar,duration)!;
    const mapped=duration*(x-bar.x)/bar.width;
    expect(got).toBe(Math.min(duration,Math.max(0,mapped)));
  }
  const last=seekFromClick(29,bar,duration)!;
  expect(last).toBeGreaterThanOrEqual(0);expect(last).toBeLessThanOrEqual(duration);
});
