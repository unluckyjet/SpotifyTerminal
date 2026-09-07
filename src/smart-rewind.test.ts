import {test,expect} from 'bun:test';
import {unpausePosition} from './smart-rewind';
const expected=(position:number,pausedForMs:number,rewind=3)=>pausedForMs>=2000?Math.max(0,position-rewind):position;
test('unpausePosition rewinds after >=2000ms pause, else keeps position, never below 0',()=>{
  expect(unpausePosition(40,1999)).toBe(40);
  expect(unpausePosition(40,2000)).toBe(37);
  expect(unpausePosition(40,2000)).toBe(unpausePosition(40,2000,3));
  expect(unpausePosition(2,5000)).toBe(0);
  expect(unpausePosition(0,8000)).toBe(0);
  expect(unpausePosition(1.5,2000,3)).toBe(0);
  expect(unpausePosition(90,1999.999)).toBe(90);
  expect(unpausePosition(90,0)).toBe(90);
  expect(unpausePosition(12,1999,15)).toBe(12);
  expect(unpausePosition(12,2000,15)).toBe(0);
  expect(unpausePosition(30,2500,5)).toBe(25);
  expect(unpausePosition(10,2000,0)).toBe(10);
  for(const position of [0,0.4,1,3,8,42,180,-2]){
    for(const pausedForMs of [-1,0,1,1999,2000,2001,3500,60_000]){
      for(const rewind of [undefined,0,1,3,5,15,30]){
        const got=rewind===undefined?unpausePosition(position,pausedForMs):unpausePosition(position,pausedForMs,rewind);
        expect(got).toBe(expected(position,pausedForMs,rewind??3));
        if(pausedForMs>=2000)expect(got).toBeGreaterThanOrEqual(0);
        else expect(got).toBe(position);
      }
    }
  }
});
