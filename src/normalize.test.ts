import {test,expect} from 'bun:test';
import {normalizeText} from './normalize';

const leftover=/(?:^\s|\s$|\s{2,})/;
const collapse=(text:string)=>text.split(/\s+/).filter(Boolean).join(' ');
const ws=[' ','\t','\n','\r','\f','\v','\u00a0','\u2002','\u2003','\u2028','\u2029','\u3000'];

test('normalizeText collapses whitespace and trims',()=>{
  const samples=[
    '',
    ' ',
    '   ',
    '\n',
    '\t\t',
    '\r\n',
    'already clean',
    '  Hello    World  ',
    'Go\nTo  Town',
    'Doja\tCat\n\nAmala',
    '  a\u00a0\u00a0b   c  ',
    'line1\r\nline2',
    'a\u000b\u000cb',
    'keep-this_name.mp3',
    'feat.  Doja   Cat',
    '\u2003em  space\u2002',
    '  \n  Track\t\tName \r\n ',
    'x',
    ' x ',
    'x  y  z',
    '\n\nfoo\n\n',
    'Café\t#1',
    '  "quoted"   title  ',
    'A&B   C&C',
    `${ws.join('')}${ws.join('')}mid${ws.join('')}`,
  ];
  for(const text of samples){
    const got=normalizeText(text);
    expect(got).toBe(collapse(text));
    expect(leftover.test(got)).toBe(false);
    expect(got).toBe(got.trim());
    expect(got).toBe(normalizeText(got));
    expect(got.includes('\n')).toBe(false);
    expect(got.includes('\t')).toBe(false);
    expect(got.includes('\r')).toBe(false);
    for(const token of text.split(/\s+/).filter(Boolean))expect(got.includes(token)).toBe(true);
  }

  expect(normalizeText('  Hello    World  ')).toBe('Hello World');
  expect(normalizeText('Go\nTo  Town')).toBe('Go To Town');
  expect(normalizeText('a\u00a0\u00a0b   c')).toBe('a b c');
  expect(normalizeText('keep-this_name.mp3')).toBe('keep-this_name.mp3');
  expect(normalizeText('  \n\t  ')).toBe('');
  expect(normalizeText('')).toBe('');

  for(const ch of ws){
    expect(normalizeText(`ok${ch}${ch}name`)).toBe('ok name');
    expect(normalizeText(`${ch}lead`)).toBe('lead');
    expect(normalizeText(`trail${ch}`)).toBe('trail');
    expect(normalizeText(ch.repeat(4))).toBe('');
  }
});
