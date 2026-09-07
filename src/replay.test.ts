import {test,expect} from 'bun:test';
import {replayPosition,shouldReplay} from './replay';
test('replay seeks to start and matches replay keys',()=>{
  expect(replayPosition()).toBe(0);
  expect(shouldReplay('.')).toBe(true);
  expect(shouldReplay('home')).toBe(true);
  expect(shouldReplay('replay')).toBe(true);
  for(const key of ['','r','Home','REPLAY','next',' ','.home'])expect(shouldReplay(key)).toBe(false);
});
