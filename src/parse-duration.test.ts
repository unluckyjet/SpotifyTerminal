import {test,expect} from 'bun:test';
import {parseDuration} from './parse-duration';
const pad=(n:number)=>String(n).padStart(2,'0');
const seconds=(h:number,m:number,s:number)=>h*3600+m*60+s;
const mmss=(m:number,s:number)=>`${m}:${pad(s)}`;
const hms=(h:number,m:number,s:number)=>`${h}:${pad(m)}:${pad(s)}`;
test('parseDuration accepts m:ss, mm:ss, h:mm:ss, or plain seconds; invalid is undefined',()=>{
  for(const n of [0,1,9,10,59,60,90,3599,3600,10_000]){
    expect(parseDuration(String(n))).toBe(n);
    expect(parseDuration(` ${n} `)).toBe(parseDuration(String(n)));
  }
  for(const m of [0,1,9,10,12,59,90])for(const s of [0,1,9,10,59]){
    const text=mmss(m,s),want=seconds(0,m,s);
    expect(parseDuration(text)).toBe(want);
    expect(parseDuration(m<10?`0${text}`:text)).toBe(want);
    expect(parseDuration(`\t${text}\n`)).toBe(want);
    expect(parseDuration(String(want))).toBe(want);
  }
  for(const h of [0,1,9,10,12])for(const m of [0,1,9,10,59])for(const s of [0,5,59]){
    const text=hms(h,m,s),want=seconds(h,m,s);
    expect(parseDuration(text)).toBe(want);
    expect(parseDuration(` ${text} `)).toBe(want);
    expect(parseDuration(String(want))).toBe(want);
  }
  expect(parseDuration('1:23')).toBe(parseDuration(String(seconds(0,1,23))));
  expect(parseDuration('01:23')).toBe(parseDuration('1:23'));
  expect(parseDuration('1:02:03')).toBe(parseDuration(hms(1,2,3)));
  expect(parseDuration('1:00:00')).toBe(parseDuration(mmss(60,0)));
  expect(parseDuration('1:00:00')).toBe(parseDuration(String(seconds(1,0,0))));
  expect(parseDuration(mmss(90,0))).toBe(parseDuration(hms(1,30,0)));
  for(const bad of ['','  ',':',':00','1:','1:2','1:60','1:2:3','1:60:00','1:00:60','-1','-1:23','1.5','1e2','+12',
    '1:23:45:00','abc','1:023','1::23',':1:23','1:23a','a1:23','1:99','12:60','1:2:30','1:023:00','1:00:0','0:0',
    '99:99','--1','1: 23','1 :23','.5','12.0','1:2:03','1:02:3','::','1::02:03','spotify:1:23']){
    expect(parseDuration(bad)).toBeUndefined();
  }
});
