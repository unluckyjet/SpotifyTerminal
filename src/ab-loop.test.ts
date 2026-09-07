import {test,expect} from 'bun:test';
import {ABLoop} from './ab-loop';
test('ABLoop swaps inverted markers, wraps at B, labels clocks, and clears',()=>{
  const loop=new ABLoop();
  expect(loop.active()).toBe(false);expect(loop.wrap(15)).toBe(15);expect(loop.label()).toBe('A —');
  loop.setA(10);expect(loop.a).toBe(10);expect(loop.active()).toBe(false);expect(loop.wrap(20)).toBe(20);expect(loop.label()).toBe('A 0:10–');
  loop.setB(20);expect(loop.a).toBe(10);expect(loop.b).toBe(20);expect(loop.active()).toBe(true);
  expect(loop.wrap(19.9)).toBe(19.9);expect(loop.wrap(20)).toBe(loop.a!);expect(loop.wrap(25)).toBe(loop.a!);expect(loop.wrap(0)).toBe(0);
  expect(loop.label()).toBe('A 0:10–0:20');
  loop.setA(30);expect(loop.a).toBe(20);expect(loop.b).toBe(30);expect(loop.active()).toBe(true);expect(loop.wrap(30)).toBe(20);expect(loop.label()).toBe('A 0:20–0:30');
  const reversed=new ABLoop();reversed.setB(5);reversed.setA(25);expect(reversed.a).toBe(5);expect(reversed.b).toBe(25);expect(reversed.wrap(25)).toBe(5);
  const equal=new ABLoop();equal.setA(10);equal.setB(10);expect(equal.a).toBe(10);expect(equal.b).toBe(10);expect(equal.active()).toBe(false);expect(equal.wrap(10)).toBe(10);expect(equal.wrap(11)).toBe(11);
  loop.clear();expect(loop.a).toBeUndefined();expect(loop.b).toBeUndefined();expect(loop.active()).toBe(false);expect(loop.wrap(40)).toBe(40);expect(loop.label()).toBe('A —');
  loop.setB(20);expect(loop.active()).toBe(false);expect(loop.label()).toBe('A –0:20');expect(loop.wrap(20)).toBe(20);
  const inf=new ABLoop();inf.setA(10);inf.setB(Infinity);expect(inf.active()).toBe(false);expect(inf.wrap(1e9)).toBe(1e9);
  inf.setB(NaN);expect(inf.active()).toBe(false);expect(inf.wrap(10)).toBe(10);
  const long=new ABLoop();long.setA(195);long.setB(200);expect(long.label()).toBe('A 3:15–3:20');expect(long.wrap(200)).toBe(195);
});
