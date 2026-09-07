import {test,expect} from 'bun:test';
import {linearToLogVolume,logToLinearVolume} from './volume-curve';
const clamp=(n:number)=>Math.min(100,Math.max(0,Number.isFinite(n)?n:0));
const toLog=(linear:number)=>{const x=clamp(linear);return x*x/100;};
const toLinear=(log:number)=>Math.sqrt(clamp(log)*100);
test('linearToLogVolume maps 0-100 with x²/100; logToLinearVolume inverts',()=>{
  const samples=[0,1,5,10,25,32,50,64.4,70,99,100,-5,-0.4,100.4,150,NaN,Infinity,-Infinity,50.2,0.5,99.5,Number.MAX_VALUE,-Number.MAX_VALUE];
  for(const n of samples){
    expect(linearToLogVolume(n)).toBe(toLog(n));
    expect(logToLinearVolume(n)).toBe(toLinear(n));
    expect(linearToLogVolume(n)).toBeGreaterThanOrEqual(0);
    expect(linearToLogVolume(n)).toBeLessThanOrEqual(100);
    expect(logToLinearVolume(n)).toBeGreaterThanOrEqual(0);
    expect(logToLinearVolume(n)).toBeLessThanOrEqual(100);
  }
  expect(linearToLogVolume(0)).toBe(0);
  expect(linearToLogVolume(100)).toBe(100);
  expect(logToLinearVolume(0)).toBe(0);
  expect(logToLinearVolume(100)).toBe(100);
  expect(linearToLogVolume(50)).toBe(toLog(50));
  expect(linearToLogVolume(50)).toBeLessThan(50);
  expect(linearToLogVolume(-20)).toBe(linearToLogVolume(0));
  expect(linearToLogVolume(200)).toBe(linearToLogVolume(100));
  expect(linearToLogVolume(Number.NaN)).toBe(linearToLogVolume(0));
  expect(logToLinearVolume(-20)).toBe(logToLinearVolume(0));
  expect(logToLinearVolume(200)).toBe(logToLinearVolume(100));
  expect(logToLinearVolume(Number.NaN)).toBe(logToLinearVolume(0));
  for(let x=0;x<=100;x++){
    expect(linearToLogVolume(x)).toBe(toLog(x));
    expect(logToLinearVolume(x)).toBe(toLinear(x));
    expect(logToLinearVolume(linearToLogVolume(x))).toBeCloseTo(x,10);
    expect(linearToLogVolume(logToLinearVolume(x))).toBeCloseTo(x,10);
  }
  for(let x=1;x<=100;x++){
    expect(linearToLogVolume(x)).toBeGreaterThan(linearToLogVolume(x-1));
    expect(logToLinearVolume(x)).toBeGreaterThan(logToLinearVolume(x-1));
  }
});
