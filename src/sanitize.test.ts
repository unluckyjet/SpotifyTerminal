import {test,expect} from 'bun:test';
import {basename,join} from 'node:path';
import {sanitizeFilename} from './sanitize';

const illegal='/\\:*?"<>|';
const controls='\u0000\u0007\u0008\u000b\u000c\u000e\u001f\u007f\u0080\u009f';
const leftover=/(?:[/\\:*?"<>|\u0000-\u001f\u007f-\u009f]|\s{2,}|^\s|\s$)/;

test('sanitizeFilename replaces path and control chars, collapses space, trims, caps length, untitled if empty',()=>{
  const dirty=`  album${illegal}${controls}  title \t  `;
  const got=sanitizeFilename(dirty);
  expect(leftover.test(got)).toBe(false);
  expect(got.includes('/')).toBe(false);
  expect(got.includes('\\')).toBe(false);
  expect(got).toBe(basename(got));
  expect(basename(join('/tmp/postcards',got))).toBe(got);
  expect(got).toBe(sanitizeFilename(dirty,80));
  expect(Array.from(got).length).toBeLessThanOrEqual(80);
  expect(got.startsWith('album')).toBe(true);
  expect(got.includes('album')).toBe(true);
  expect(got.includes('title')).toBe(true);

  for(const ch of [...illegal,...controls]){
    const out=sanitizeFilename(`ok${ch}name`);
    expect(out).toBe('ok-name');
    expect(out.includes(ch)).toBe(false);
    expect(/[/\\]/.test(out)).toBe(false);
  }

  expect(sanitizeFilename('  Hello    World  ')).toBe('Hello World');
  expect(sanitizeFilename('a\u00a0\u00a0b   c')).toBe('a b c');
  expect(sanitizeFilename('keep-this_name.mp3')).toBe('keep-this_name.mp3');
  expect(sanitizeFilename('Doja Cat / Go To Town: "Amala"')).toBe('Doja Cat - Go To Town- -Amala-');
  const file=sanitizeFilename('vs/win\\track:live*?');
  expect(basename(join('exports',`${file}.png`))).toBe(`${file}.png`);
  expect(/[/\\]/.test(file)).toBe(false);

  const long='x'.repeat(200);
  expect(sanitizeFilename(long)).toBe(long.slice(0,80));
  expect(sanitizeFilename(long).length).toBe(80);
  expect(sanitizeFilename(long,12)).toBe(long.slice(0,12));
  expect(sanitizeFilename('🎵'.repeat(100),2)).toBe('🎵🎵');
  expect(Array.from(sanitizeFilename('🎵'.repeat(100))).length).toBe(80);
  expect(sanitizeFilename('hello',0)).toBe('untitled');
  expect(sanitizeFilename('hello',NaN).length).toBe(5);
  expect(sanitizeFilename(long,NaN)).toBe(sanitizeFilename(long,80));

  for(const empty of ['',' ','   ','\u00a0','  \u00a0  '])expect(sanitizeFilename(empty)).toBe('untitled');
});
