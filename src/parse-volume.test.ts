import {test,expect} from 'bun:test';
import {parseVolume} from './parse-volume';
const clamp=(volume:number)=>Math.min(100,Math.max(0,Math.round(volume)));
test('parseVolume throws unknown, clamps 0-100 integer',()=>{
  for(const value of ['0','1','5','50','64.4','64.5','65','99','100','-5','-0.4','100.4','150','50.2','49.8','0.4','0.5','99.5','100.5',' 65 ','+50',' 0 ',' 100 ']){
    const n=clamp(Number(value.trim()));
    expect(n).toBeGreaterThanOrEqual(0);expect(n).toBeLessThanOrEqual(100);expect(Number.isInteger(n)).toBe(true);
    expect(parseVolume(value)).toBe(n);
    expect(Number.isInteger(parseVolume(value))).toBe(true);
  }
  expect(parseVolume('65')).toBe(clamp(65));
  expect(parseVolume('-20')).toBe(parseVolume('0'));
  expect(parseVolume('200')).toBe(parseVolume('100'));
  expect(parseVolume('0')).toBe(parseVolume('-1'));
  expect(parseVolume('100')).toBe(parseVolume('101'));
  for(const value of [undefined,'','   ','loud','mute','on','off','volume','NaN','Infinity','-Infinity','50%','--','abc','1 2','repeat']){
    expect(()=>parseVolume(value)).toThrow(/unknown/i);
  }
});
