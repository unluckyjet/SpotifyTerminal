import {test,expect} from 'bun:test';
import {skipBy} from './podcast-skip';
const clamp=(position:number,duration:number,delta:number)=>{
  const end=Number.isFinite(duration)?Math.max(0,duration):0;
  const from=Number.isFinite(position)?position:0;
  const step=Number.isFinite(delta)?delta:0;
  return Math.min(end,Math.max(0,from+step));
};
test('skipBy clamps position+delta into [0,duration] for 15s/30s podcast skips',()=>{
  const duration=240;
  expect(skipBy(90,duration,15)).toBe(90+15);
  expect(skipBy(90,duration,-15)).toBe(90-15);
  expect(skipBy(90,duration,30)).toBe(90+30);
  expect(skipBy(90,duration,-30)).toBe(90-30);
  expect(skipBy(90,duration,15)).not.toBe(skipBy(90,duration,10));
  const cases:[number,number,number][]=[
    [0,duration,15],[0,duration,-15],[10,duration,-15],[duration-10,duration,15],[duration,duration,15],
    [duration,duration,-15],[0,0,15],[50,-10,15],[-5,duration,0],[50,duration,0],[12.5,100,15.5],
    [-20,100,5],[-20,100,25],[250,200,15],[5,200,-30],[190,200,30],
    [NaN,duration,15],[50,NaN,15],[50,duration,NaN],[Infinity,duration,15],[50,-Infinity,-30],
  ];
  for(const [position,length,delta] of cases){
    const got=skipBy(position,length,delta);
    const end=Number.isFinite(length)?Math.max(0,length):0;
    expect(got).toBe(clamp(position,length,delta));
    expect(got).toBeGreaterThanOrEqual(0);
    expect(got).toBeLessThanOrEqual(end);
  }
  expect(skipBy(5,200,-30)).toBe(0);
  expect(skipBy(190,200,30)).toBe(200);
  expect(skipBy(250,200,15)).toBe(200);
});
