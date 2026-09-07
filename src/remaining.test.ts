import {test,expect} from 'bun:test';
import {timeRemaining,formatRemaining} from './remaining';
const leftover=(position:number,duration:number)=>Math.max(0,duration-Math.max(0,position));
const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
test('timeRemaining clamps at zero and formatRemaining is -m:ss',()=>{
  for(const [position,duration] of [[0,121],[20,121],[121,121],[200,121],[-5,90],[0,0],[10,-3],[59.9,180],[61.2,200],[0,59],[0,60]] as [number,number][]){
    const s=leftover(position,duration);
    expect(timeRemaining(position,duration)).toBe(s);
    expect(formatRemaining(position,duration)).toBe(`-${clock(s)}`);
  }
  expect(timeRemaining(-10,90)).toBe(timeRemaining(0,90));
  expect(formatRemaining(-10,90)).toBe(formatRemaining(0,90));
  expect(formatRemaining(0,121)).toBe(`-${clock(timeRemaining(0,121))}`);
});
