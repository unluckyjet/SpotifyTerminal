import {test,expect} from 'bun:test';
import {etaClock} from './eta';
const leftover=(position:number,duration:number)=>Math.max(0,duration-Math.max(0,position));
const stamp=(d:Date)=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
test('etaClock is 24h HH:MM local of now+remaining',()=>{
  const nows=[new Date(2024,0,1,0,0),new Date(2024,5,15,9,5),new Date(2024,11,31,23,59,50),new Date(1999,6,4,13,7,30)];
  const pairs=[[0,121],[20,121],[121,121],[200,121],[-5,90],[0,0],[10,-3],[59.9,180],[61.2,200],[0,59],[0,60],[15,217],[0,90*60]] as [number,number][];
  for(const now of nows){
    for(const [position,duration] of pairs){
      const eta=new Date(now.getTime()+leftover(position,duration)*1000);
      expect(etaClock(position,duration,now)).toBe(stamp(eta));
      expect(etaClock(position,duration,now)).toMatch(/^\d{2}:\d{2}$/);
    }
  }
  expect(etaClock(-10,90,nows[0])).toBe(etaClock(0,90,nows[0]));
  expect(etaClock(200,121,nows[0])).toBe(etaClock(121,121,nows[0]));
  const before=stamp(new Date(Date.now()+leftover(15,217)*1000));
  const got=etaClock(15,217);
  const after=stamp(new Date(Date.now()+leftover(15,217)*1000));
  expect([before,after]).toContain(got);
});
