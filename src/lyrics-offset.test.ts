import {test,expect} from 'bun:test';
import {shiftLyrics,clampOffset,nudgeLyrics} from './lyrics-offset';
const bound=(seconds:number)=>Math.min(10,Math.max(-10,seconds));
test('clampOffset stays in ±10s and shiftLyrics remaps times without mutating',()=>{
  for(const seconds of [-100,-10.1,-10,-0.1,0,0.1,10,10.1,20,100]){
    expect(clampOffset(seconds)).toBe(bound(seconds));
    expect(clampOffset(seconds)).toBeGreaterThanOrEqual(-10);
    expect(clampOffset(seconds)).toBeLessThanOrEqual(10);
  }
  const lines=[{time:0,text:'a'},{time:1.5,text:'b'},{time:12,text:'c'}];
  const snapshot=lines.map(line=>({...line}));
  for(const seconds of [-12,-0.1,0,0.1,2,10,-10]){
    const shifted=shiftLyrics(lines,seconds);
    expect(lines).toEqual(snapshot);
    expect(shifted).not.toBe(lines);
    expect(shifted.map(line=>line.time)).toEqual(lines.map(line=>Math.max(0,line.time+seconds)));
    expect(shifted.map(line=>line.text)).toEqual(lines.map(line=>line.text));
  }
  const extra=[{time:3,text:'x',id:'z'}];
  const out=shiftLyrics(extra,clampOffset(100));
  expect(extra[0].time).toBe(3);
  expect(out[0].id).toBe('z');
  expect(out[0].time).toBe(Math.max(0,extra[0].time+clampOffset(100)));
  expect(shiftLyrics([],5)).toEqual([]);
  const atCap=nudgeLyrics([{time:1,text:'a'}],10,0.1);
  expect(atCap.changed).toBe(false);
  expect(atCap.nudge).toBe(10);
  expect(atCap.lines[0].time).toBe(1);
  const moved=nudgeLyrics([{time:1,text:'a'}],0,0.1);
  expect(moved.changed).toBe(true);
  expect(moved.nudge).toBe(0.1);
  expect(moved.lines[0].time).toBe(1.1);
});
