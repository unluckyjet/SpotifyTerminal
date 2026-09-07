import {test,expect} from 'bun:test';
import {volumeLabel} from './volume-label';
const clamp=(volume:number)=>Math.min(100,Math.max(0,Math.round(Number.isFinite(volume)?volume:0)));
test('volumeLabel clamps 0-100 rounded integer with percent suffix',()=>{
  for(const volume of [0,1,5,50,64.4,64.5,65,99,100,-5,-0.4,100.4,150,NaN,Infinity,-Infinity,50.2,49.8,0.4,0.5,99.5,100.5,Number.MAX_VALUE,-Number.MAX_VALUE]){
    const n=clamp(volume);
    expect(n).toBeGreaterThanOrEqual(0);expect(n).toBeLessThanOrEqual(100);expect(Number.isInteger(n)).toBe(true);
    expect(volumeLabel(volume)).toBe(`${n}%`);
  }
  expect(volumeLabel(65)).toBe(`${clamp(65)}%`);
  expect(volumeLabel(-20)).toBe(volumeLabel(0));
  expect(volumeLabel(200)).toBe(volumeLabel(100));
  expect(volumeLabel(Number.NaN)).toBe(volumeLabel(0));
});
