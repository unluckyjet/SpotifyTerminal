import {test,expect} from 'bun:test';
import {shareText,shareUrl} from './share';
import {wrapText} from './wrap';

const columns=(width:number)=>Math.floor(width);
const packed=(text:string)=>text.replace(/\s+/g,'');
const greedy=(text:string,width:number)=>{
  const w=columns(width);
  if(!Number.isFinite(w)||w<1)return [] as string[];
  const out:string[]=[];
  let cur='';
  const flush=()=>{if(cur){out.push(cur);cur='';}};
  for(const word of text.trim().split(/\s+/).filter(Boolean)){
    const parts=word.length<=w?[word]:Array.from({length:Math.ceil(word.length/w)},(_,i)=>word.slice(i*w,i*w+w));
    for(const part of parts){
      if(!cur)cur=part;
      else if(cur.length+1+part.length<=w)cur=`${cur} ${part}`;
      else{flush();cur=part;}
    }
  }
  flush();
  return out;
};

test('wrapText word-wraps, splits long tokens, and returns [] when width<1',()=>{
  for(const width of [0,-1,-10,0.9,Number.NaN,Infinity,-Infinity,Number.NEGATIVE_INFINITY]){
    expect(wrapText('hello world',width)).toEqual([]);
    expect(wrapText('https://open.spotify.com/track/x',width)).toEqual([]);
    expect(wrapText('',width)).toEqual([]);
  }
  expect(wrapText('hello',0)).toEqual([]);
  expect(wrapText('hello',1).every(line=>line.length<=1)).toBe(true);

  const samples=[
    '',
    ' ',
    '   ',
    '\t\n',
    'hello',
    'hello world',
    'one two three four',
    'a  bb   ccc',
    'Go To Town — Doja Cat (Amala)',
    shareText({name:'Go To Town',artist:'Doja Cat',album:'Amala'}),
    shareUrl('4iV5W9uYEdYUVa79Axb7Rh'),
    shareUrl('0VjIjW4KwUKR2eNjSRtU0D'),
    'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI',
    'x'.repeat(50),
    'short '+'x'.repeat(17)+' end',
    'a b c d e f g',
    'word',
  ];
  const widths=[1,2,3,4,5,6,7,8,10,11,12,16,20,24,32,40,70,80,1.5,3.9,10.2];
  for(const text of samples)for(const width of widths){
    const got=wrapText(text,width);
    const w=columns(width);
    expect(got).toEqual(greedy(text,width));
    expect(got.every(line=>line.length<=w)).toBe(true);
    expect(got.every(line=>line.length>0)).toBe(true);
    expect(got.every(line=>line===line.trim())).toBe(true);
    expect(packed(got.join(' '))).toBe(packed(text));
    if(!text.trim())expect(got).toEqual([]);
  }

  const url=shareUrl('4iV5W9uYEdYUVa79Axb7Rh');
  expect(url.startsWith('https://')).toBe(true);
  expect(url.includes(' ')).toBe(false);
  for(const width of [1,8,10,12,20,url.length,url.length-1,url.length+1]){
    const got=wrapText(url,width);
    expect(got.join('')).toBe(url);
    expect(got.every(line=>line.length<=width)).toBe(true);
    expect(got.some(line=>line.length===Math.min(width,url.length)||width>=url.length)).toBe(true);
  }
  const broken=wrapText(url,10);
  expect(broken.length).toBeGreaterThan(1);
  expect(broken.every(line=>line.length<=10)).toBe(true);
  expect(broken[0]).toBe(url.slice(0,10));
  expect(wrapText(url,url.length)).toEqual([url]);
  expect(wrapText(url,url.length+5)).toEqual([url]);

  expect(wrapText('hello world',11)).toEqual(['hello world']);
  expect(wrapText('hello world',10)).toEqual(['hello','world']);
  expect(wrapText('hello world',5)).toEqual(['hello','world']);
  expect(wrapText('hello',3).every(line=>line.length<=3)).toBe(true);
  expect(wrapText('hello',3).join('')).toBe('hello');
  expect(wrapText('hello',3).length).toBeGreaterThan(1);
  expect(wrapText('one two three',7)).toEqual(greedy('one two three',7));
  expect(wrapText('  hello   world  ',20)).toEqual(['hello world']);
  expect(wrapText('hello\nworld',20)).toEqual(greedy('hello\nworld',20));
  expect(wrapText('a bb c',4)).toEqual(greedy('a bb c',4));
  const phrase='Share '+url;
  const wrapped=wrapText(phrase,16);
  expect(wrapped.every(line=>line.length<=16)).toBe(true);
  expect(packed(wrapped.join(' '))).toBe(packed(phrase));
  expect(wrapText(phrase,16)).toEqual(greedy(phrase,16));
});
