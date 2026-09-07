import {test,expect} from 'bun:test';
import {shouldAutoPause} from './auto-pause';
const idle=(last:number,now:number,after:number)=>now-last>=after;
test('shouldAutoPause only when playing and idle for afterMs (default 30m)',()=>{
  const after=30*60_000;
  for(const last of [0,1000,50_000,Date.now()-after]){
    for(const extra of [-after,-1,0,1,60_000,after,1e6]){
      const now=last+after+extra;
      for(const playing of [true,false]){
        expect(shouldAutoPause(last,playing,now)).toBe(playing&&idle(last,now,after));
        expect(shouldAutoPause(last,playing,now,after)).toBe(playing&&idle(last,now,after));
      }
    }
  }
  expect(shouldAutoPause(0,true,after-1)).toBe(false);
  expect(shouldAutoPause(0,true,after)).toBe(true);
  expect(shouldAutoPause(0,false,after)).toBe(false);
  expect(shouldAutoPause(0,true,after-1,after)).toBe(false);
  expect(shouldAutoPause(0,true,after,after)).toBe(true);
  expect(shouldAutoPause(0,false,after,after)).toBe(false);
  expect(shouldAutoPause(0,true,500,500)).toBe(true);
  expect(shouldAutoPause(0,true,499,500)).toBe(false);
  expect(shouldAutoPause(0,false,500,500)).toBe(false);
  expect(shouldAutoPause(Date.now(),true)).toBe(false);
  expect(shouldAutoPause(Date.now(),false)).toBe(false);
  expect(shouldAutoPause(0,true)).toBe(true);
  expect(shouldAutoPause(0,false)).toBe(false);
  expect(shouldAutoPause(Date.now()-after,true)).toBe(true);
  expect(shouldAutoPause(Date.now()-after+10_000,true)).toBe(false);
});
