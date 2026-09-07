import {test,expect} from 'bun:test';
import {wallClock} from './clock-overlay';
const stamp=(d:Date)=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
test('wallClock is 24h HH:MM local, zero-padded',()=>{
  for(const d of [new Date(2024,0,1,0,0),new Date(2024,5,15,9,5),new Date(2024,11,31,23,59),new Date(1999,6,4,13,7)]){
    expect(wallClock(d)).toBe(stamp(d));
    expect(wallClock(d)).toMatch(/^\d{2}:\d{2}$/);
  }
  const before=stamp(new Date());
  const got=wallClock();
  const after=stamp(new Date());
  expect([before,after]).toContain(got);
});
