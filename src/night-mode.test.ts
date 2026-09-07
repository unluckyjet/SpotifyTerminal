import {test,expect} from 'bun:test';
import {isNight,dimTheme} from './night-mode';
const mixHex=(hex:string,amount:number)=>{
  const t=Math.max(0,Math.min(1,amount));
  return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-t)).toString(16).padStart(2,'0')).join('');
};
test('isNight wraps overnight hours; dimTheme mixes every hex toward black',()=>{
  expect(isNight(22)).toBe(true);expect(isNight(23)).toBe(true);expect(isNight(0)).toBe(true);expect(isNight(6)).toBe(true);
  expect(isNight(7)).toBe(false);expect(isNight(12)).toBe(false);expect(isNight(21)).toBe(false);
  expect(isNight(22,22,7)).toBe(true);expect(isNight(6,22,7)).toBe(true);expect(isNight(7,22,7)).toBe(false);expect(isNight(21,22,7)).toBe(false);
  expect(isNight(8,8,18)).toBe(true);expect(isNight(17,8,18)).toBe(true);expect(isNight(18,8,18)).toBe(false);expect(isNight(7,8,18)).toBe(false);
  expect(isNight(10,10,10)).toBe(false);expect(isNight(9,10,10)).toBe(false);
  const theme={bg:'#7a8490',text:'#e8eef4',accent:'#c4ccd4',muted:'#9aa2aa',surface:'#243038'};
  const dim=dimTheme(theme);
  expect(Object.keys(dim)).toEqual(Object.keys(theme));
  expect(dim).toEqual(dimTheme(theme,0.35));
  for(const key of Object.keys(theme) as (keyof typeof theme)[]){
    expect(dim[key]).toBe(mixHex(theme[key],0.35));
    expect(dimTheme(theme,0)[key]).toBe(theme[key]);
    expect(dimTheme(theme,1)[key]).toBe('#000000');
  }
  expect(dimTheme(theme,0.5).bg).toBe(mixHex(theme.bg,0.5));
  expect(dimTheme(theme,2).accent).toBe('#000000');
  expect(dimTheme(theme,-1).muted).toBe(theme.muted);
});
