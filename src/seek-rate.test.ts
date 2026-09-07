import {test,expect} from 'bun:test';
import {seekRate} from './seek-rate';
const rate=(holdMs:number)=>holdMs<400?10:holdMs<1200?20:30;
test('seekRate steps 10 then 20 then 30 as hold lengthens',()=>{
  const holds=[0,1,200,399,400,401,800,1199,1200,1201,2400,1e6,-1,Number.NaN,Infinity,-Infinity];
  for(const holdMs of holds)expect(seekRate(holdMs)).toBe(rate(holdMs));
  for(let holdMs=0;holdMs<=2000;holdMs++)expect(seekRate(holdMs)).toBe(rate(holdMs));
  expect(seekRate(399)).toBeLessThan(seekRate(400));
  expect(seekRate(1199)).toBeLessThan(seekRate(1200));
  expect(seekRate(0)).toBe(seekRate(399));
  expect(seekRate(400)).toBe(seekRate(1199));
  expect(seekRate(1200)).toBe(seekRate(9e9));
  expect(new Set([seekRate(0),seekRate(400),seekRate(1200)])).toEqual(new Set([10,20,30]));
});
