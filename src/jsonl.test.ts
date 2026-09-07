import {test,expect} from 'bun:test';
import {encodeJsonl,parseJsonl} from './jsonl';

test('encodeJsonl is one compact JSON line; parseJsonl skips blank and invalid',()=>{
  const row={id:'a',name:'Go To Town',artist:'Doja Cat',note:'line\nbreak\ttab',playedAt:'2026-01-02T03:04:05.000Z'};
  const encoded=encodeJsonl(row);
  expect(encoded.endsWith('\n')).toBe(true);
  expect(encoded.slice(0,-1).includes('\n')).toBe(false);
  expect(encoded.trimEnd()).toBe(JSON.stringify(row));
  expect(JSON.parse(encoded)).toEqual(row);
  expect(parseJsonl<typeof row>(encoded)).toEqual([row]);
  expect(parseJsonl(encoded+encoded)).toEqual([row,row]);

  const nested={track:row,tags:['amala','doja'],ok:true,n:0,miss:null as string|null};
  expect(encodeJsonl(nested).trimEnd()).toBe(JSON.stringify(nested));
  expect(encodeJsonl(nested).split('\n').filter(Boolean)).toHaveLength(1);
  expect(parseJsonl(encodeJsonl(nested))).toEqual([nested]);

  const values=[row,null,true,false,0,'hi',['x',1],{empty:''}] as const;
  const stream=values.map(encodeJsonl).join('');
  expect(stream.split('\n').filter(Boolean)).toHaveLength(values.length);
  expect(parseJsonl(stream)).toEqual([...values]);
  expect(parseJsonl(values.map(v=>encodeJsonl(v).trimEnd()).join('\r\n')+'\r\n')).toEqual([...values]);

  expect(parseJsonl('')).toEqual([]);
  expect(parseJsonl('\n\n  \n\t\n')).toEqual([]);
  expect(parseJsonl('\r\n\r\n')).toEqual([]);
  expect(parseJsonl('not json\n{\n}\n[1,2,]\nundefined\n// comment\n{"a":}')).toEqual([]);
  expect(parseJsonl(`{"ok":1}\n\nnot json\n  \n\t{"ok":2}\r\n{\rnull\ntrue\n[]\n${encodeJsonl(row)}`)).toEqual([{ok:1},{ok:2},null,true,[],row]);
  expect(parseJsonl('  {"a":1}  \n\t[2]\t')).toEqual([{a:1},[2]]);
  expect(parseJsonl('"   "\n0\nfalse')).toEqual(['   ',0,false]);

  expect(encodeJsonl(undefined)).toBe('');
  expect(parseJsonl(encodeJsonl(undefined))).toEqual([]);
  expect(encodeJsonl(()=>1)).toBe('');
  const cyclic:{self?:unknown}={};cyclic.self=cyclic;
  expect(encodeJsonl(cyclic)).toBe('');
  expect(encodeJsonl(1n)).toBe('');
  expect(parseJsonl(encodeJsonl(undefined)+encodeJsonl(row)+'nope\n'+encodeJsonl(null))).toEqual([row,null]);
});
