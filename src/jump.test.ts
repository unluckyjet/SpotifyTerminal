import {test,expect} from 'bun:test';
import {jumpPosition,jumpKey} from './jump';
test('jumpPosition clamps percent and duration, jumpKey maps 0-9',()=>{
  expect(jumpPosition(200,50)).toBe(100);
  expect(jumpPosition(200,0)).toBe(0);
  expect(jumpPosition(200,100)).toBe(200);
  expect(jumpPosition(200,150)).toBe(jumpPosition(200,100));
  expect(jumpPosition(200,-20)).toBe(jumpPosition(200,0));
  expect(jumpPosition(-80,40)).toBe(0);
  expect(jumpPosition(0,75)).toBe(0);
  expect(jumpPosition(180,25)).toBe(45);
  expect(jumpKey('0',240)).toBe(0);
  for(const n of [1,2,3,4,5,6,7,8,9])expect(jumpKey(String(n),1000)).toBe(n*100);
  expect(jumpKey('5',-10)).toBe(0);
  expect(jumpKey('a',200)).toBeUndefined();
  expect(jumpKey('10',200)).toBeUndefined();
  expect(jumpKey('',200)).toBeUndefined();
  expect(jumpKey(' ',200)).toBeUndefined();
});
