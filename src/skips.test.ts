import {test,expect} from 'bun:test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {isSkip,SkipLog} from './skips';
test('isSkip is true only before the listen threshold of a finite track',()=>{
  expect(isSkip(0,100)).toBe(true);expect(isSkip(49,100)).toBe(true);expect(isSkip(50,100)).toBe(false);
  expect(isSkip(0,0)).toBe(false);expect(isSkip(10,-4)).toBe(false);expect(isSkip(1,Number.NaN)).toBe(false);
  expect(isSkip(20,100,0.3)).toBe(true);expect(isSkip(30,100,0.3)).toBe(false);
});
test('SkipLog persists skips.json and ignores completed listens',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-skips-'));
  try{
    const log=new SkipLog(directory);await log.load();
    expect(await log.record('a',80,100)).toBe(false);expect(log.events).toHaveLength(0);expect(log.count('a')).toBe(0);
    const at=new Date('2026-01-02T03:04:05.000Z');
    expect(await log.record('a',10,100,at)).toBe(true);
    expect(await log.record('b',1,80)).toBe(true);
    expect(await log.record('a',40,100)).toBe(true);
    expect(await log.record('a',50,100)).toBe(false);
    expect(log.count('a')).toBe(2);expect(log.count('b')).toBe(1);expect(log.count('z')).toBe(0);
    const restored=new SkipLog(directory);await restored.load();
    expect(restored.events[0]).toEqual({id:'a',at:at.toISOString()});
    expect(restored.count('a')).toBe(2);expect(restored.events).toHaveLength(3);
    const raw=JSON.parse(await readFile(join(directory,'skips.json'),'utf8'));
    expect(raw).toEqual(restored.events);
  }finally{await rm(directory,{recursive:true,force:true});}
});
