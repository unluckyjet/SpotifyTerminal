import {test,expect} from 'bun:test';
import {join} from 'node:path';
import {formatStatusFile,statusFilePath} from './status-file';
import {Demo} from './spotify';

const mmss=(s:number)=>{
  const t=Math.floor(Math.max(0,Number.isFinite(s)?s:0));
  return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
};

test('status file is two lines with play glyph, clocks, and now-playing.txt path',async()=>{
  const t=await new Demo().read();
  const playing=formatStatusFile(t);
  const [title,meta,...rest]=playing.split('\n');
  expect(rest).toEqual([]);
  expect(title).toBe(`▶ ${t.name} — ${t.artist}`);
  expect(title.startsWith('▶ ')).toBe(true);
  expect(title).toContain(' — ');
  expect(meta).toBe(`${t.album} | ${mmss(t.position)}/${mmss(t.duration)}`);
  const paused=formatStatusFile({...t,playing:false});
  expect(paused.split('\n')[0]).toBe(`Ⅱ ${t.name} — ${t.artist}`);
  expect(paused.split('\n')[1]).toBe(meta);
  const fixed={name:'Go To Town',artist:'Doja Cat',album:'Amala',playing:true,position:15,duration:217};
  expect(formatStatusFile(fixed)).toBe(`▶ ${fixed.name} — ${fixed.artist}\n${fixed.album} | ${mmss(fixed.position)}/${mmss(fixed.duration)}`);
  expect(formatStatusFile(fixed).split('\n')[1].endsWith('00:15/03:37')).toBe(true);
  expect(formatStatusFile({...fixed,playing:false,position:65,duration:130})).toBe(`Ⅱ ${fixed.name} — ${fixed.artist}\n${fixed.album} | ${mmss(65)}/${mmss(130)}`);
  expect(formatStatusFile({...fixed,playing:false,position:65,duration:130}).split('\n')[1].endsWith('01:05/02:10')).toBe(true);
  expect(formatStatusFile({...t,position:0,duration:0}).split('\n')[1]).toBe(`${t.album} | ${mmss(0)}/${mmss(0)}`);
  expect(formatStatusFile({...t,position:-4,duration:9.9}).split('\n')[1]).toBe(`${t.album} | ${mmss(-4)}/${mmss(9.9)}`);
  expect(formatStatusFile({...t,position:NaN,duration:Infinity}).split('\n')[1]).toBe(`${t.album} | ${mmss(NaN)}/${mmss(Infinity)}`);
  const directory=join('tmp','spotterminal-status');
  expect(statusFilePath(directory)).toBe(join(directory,'now-playing.txt'));
  expect(statusFilePath('/tmp/spot')).toBe(join('/tmp/spot','now-playing.txt'));
  expect(statusFilePath(directory).endsWith('now-playing.txt')).toBe(true);
});
