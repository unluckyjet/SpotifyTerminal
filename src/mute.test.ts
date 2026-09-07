import {test,expect} from 'bun:test';
import {MuteState} from './mute';
test('mute stores volume and restores it, apply zeros while muted',()=>{
  const m=new MuteState();
  expect(m.muted).toBe(false);expect(m.previous).toBe(0);expect(m.apply(65)).toBe(65);
  expect(m.toggle(65)).toEqual({muted:true,volume:0});expect(m.muted).toBe(true);expect(m.previous).toBe(65);
  expect(m.apply(65)).toBe(0);expect(m.apply(40)).toBe(0);
  expect(m.toggle(0)).toEqual({muted:false,volume:65});expect(m.muted).toBe(false);expect(m.apply(70)).toBe(70);
  expect(m.toggle(0)).toEqual({muted:true,volume:0});expect(m.previous).toBe(65);
  expect(m.toggle(99)).toEqual({muted:false,volume:65});
  const z=new MuteState();expect(z.toggle(0)).toEqual({muted:true,volume:0});expect(z.toggle(50)).toEqual({muted:false,volume:0});
  const seeded=new MuteState(80);expect(seeded.previous).toBe(80);
  expect(seeded.toggle(80)).toEqual({muted:true,volume:0});expect(seeded.toggle(0)).toEqual({muted:false,volume:80});
  const fromZero=new MuteState(0);expect(fromZero.toggle(0)).toEqual({muted:true,volume:0});expect(fromZero.toggle(1)).toEqual({muted:false,volume:0});
});
