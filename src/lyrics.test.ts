import {test,expect} from 'bun:test';
import {parseLRC,lyricIndex} from './lyrics';
test('lyrics handle offsets, repeated timestamps, precision, and seeking backwards',()=>{
  const lines=parseLRC('[ti:Sample]\n[offset:500]\n[00:02.00][00:10.250]First line\n[00:05.5]Second line');
  expect(lines.map(l=>l.time)).toEqual([1.5,5,9.75]);expect(lines.map(l=>l.text)).toEqual(['First line','Second line','First line']);
  expect(lyricIndex(lines,0)).toBe(-1);expect(lyricIndex(lines,10)).toBe(2);expect(lyricIndex(lines,3)).toBe(0);
  expect(parseLRC('[ar:Artist]\nNo timed lyrics')).toEqual([]);
});
