import {test,expect} from 'bun:test';
import {playBadge} from './play-badge';
const times='\u00d7';
const badge=(count:number)=>{
  const n=Math.floor(Number.isFinite(count)?count:0);
  return n>0?`${times}${n}`:'';
};
test('playBadge is empty at 0 and ×n for positive play counts',()=>{
  expect(playBadge(0)).toBe('');
  expect(playBadge(1)).toBe(`${times}1`);
  expect(playBadge(12)).toBe(`${times}12`);
  for(const count of [0,1,2,3,12,13,99,100,1000,1e6,-1,-12,-0.4,0.4,0.9,1.1,1.9,12.2,12.9,NaN,Infinity,-Infinity,Number.MAX_VALUE,-Number.MAX_VALUE]){
    const got=playBadge(count);
    expect(got).toBe(badge(count));
    if(Number.isFinite(count)&&Math.floor(count)>0){
      expect(got.startsWith(times)).toBe(true);
      expect(got.slice(1)).toBe(String(Math.floor(count)));
    }else expect(got).toBe('');
  }
  expect(playBadge(0)).toBe(playBadge(-5));
  expect(playBadge(1)).not.toBe(playBadge(0));
  expect(playBadge(12)).toBe(`${times}${Math.floor(12)}`);
});
