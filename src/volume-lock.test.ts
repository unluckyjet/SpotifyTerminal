import {test,expect} from 'bun:test';
import {VolumeLock} from './volume-lock';
test('volume lock starts unlocked, toggle flips, and blocks louder/quieter only while locked',()=>{
  const lock=new VolumeLock();
  expect(lock.locked).toBe(false);
  const volume=['louder','quieter'];
  const other=['play','pause','next','previous','toggle','shuffle','mute','volume','forward','back'];
  const check=(blocked:boolean)=>{
    expect(lock.locked).toBe(blocked);
    for(const cmd of volume)expect(lock.allow(cmd)).toBe(!blocked);
    for(const cmd of other)expect(lock.allow(cmd)).toBe(true);
  };
  check(false);
  expect(lock.toggle()).toBe(true);check(true);
  expect(lock.allow('LOUDER')).toBe(true);expect(lock.allow('quieter ')).toBe(true);
  expect(lock.toggle()).toBe(false);check(false);
  expect(lock.toggle()).toBe(true);expect(lock.toggle()).toBe(false);expect(lock.locked).toBe(false);
});
