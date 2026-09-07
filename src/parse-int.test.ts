import {test,expect} from 'bun:test';
import {parseIntStrict} from './parse-int';

const parse=(text:string,min?:number,max?:number)=>{
  const raw=text.trim();
  if(!/^-?\d+$/.test(raw))return;
  const n=Number(raw);
  if(!Number.isSafeInteger(n))return;
  if(min!==undefined&&n<min)return;
  if(max!==undefined&&n>max)return;
  return n===0?0:n;
};

test('parseIntStrict accepts optional-minus digits only and enforces min/max',()=>{
  const values=[0,1,2,7,9,10,12,25,30,59,60,100,180,1440,-1,-2,-7,-12,-180,1_000_000,Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER];
  for(const n of values){
    const text=String(n);
    expect(parseIntStrict(text)).toBe(n);
    expect(parseIntStrict(text)).toBe(parse(text));
    expect(parseIntStrict(text)).toBe(Number(text));
    expect(parseIntStrict(` ${text} `)).toBe(n);
    expect(parseIntStrict(`\t${text}\n`)).toBe(parse(text));
    expect(Number.isSafeInteger(parseIntStrict(text)!)).toBe(true);
  }
  expect(parseIntStrict('007')).toBe(7);
  expect(parseIntStrict('-007')).toBe(-7);
  expect(parseIntStrict('00')).toBe(0);
  expect(parseIntStrict('-0')).toBe(0);
  expect(parseIntStrict('007')).toBe(parse('007'));

  expect(Number('1e2')).toBe(100);
  expect(Number(' 12')).toBe(12);
  expect(Number('')).toBe(0);
  expect(Number('+8')).toBe(8);
  expect(Number('0x10')).toBe(16);
  expect(Number('1.5')).toBe(1.5);
  for(const text of [
    '',' ','+1','+0','+12','-','--1','1.0','1.5','.5','1.',
    '1e2','1E2','1e+2','1e-2','2e1','0x10','0X10','0b10','0o10','10px',
    '1_000','1,000','NaN','Infinity','-Infinity','1-2','--','++1',
    '12abc','abc12','--0','- 1','1e','e2','+1e2',
    '9007199254740993','-9007199254740993',String(Number.MAX_SAFE_INTEGER)+'0',
  ]){
    expect(parseIntStrict(text)).toBeUndefined();
    expect(parseIntStrict(text)).toBe(parse(text));
  }

  expect(parseIntStrict('25',1,180)).toBe(25);
  expect(parseIntStrict('1',1,180)).toBe(1);
  expect(parseIntStrict('180',1,180)).toBe(180);
  expect(parseIntStrict('0',1,180)).toBeUndefined();
  expect(parseIntStrict('181',1,180)).toBeUndefined();
  expect(parseIntStrict('-5')).toBe(-5);
  expect(parseIntStrict('-5',0)).toBeUndefined();
  expect(parseIntStrict('50',undefined,40)).toBeUndefined();
  expect(parseIntStrict('50',50)).toBe(50);
  expect(parseIntStrict('49',50)).toBeUndefined();
  expect(parseIntStrict('5',undefined,5)).toBe(5);
  expect(parseIntStrict('6',undefined,5)).toBeUndefined();
  expect(parseIntStrict('50',50,50)).toBe(50);
  expect(parseIntStrict('49',50,50)).toBeUndefined();
  expect(parseIntStrict('51',50,50)).toBeUndefined();
  expect(parseIntStrict('12',12,undefined)).toBe(12);
  expect(parseIntStrict('5',5.1,10)).toBeUndefined();
  expect(parseIntStrict('6',5.1,10)).toBe(6);
  expect(parseIntStrict(' 25 ',1,180)).toBe(25);

  for(let n=1;n<=180;n++){
    expect(parseIntStrict(String(n),1,180)).toBe(n);
    expect(parseIntStrict(String(n),1,180)).toBe(parse(String(n),1,180));
  }
  expect(parseIntStrict('0',1,1440)).toBeUndefined();
  expect(parseIntStrict('1440',1,1440)).toBe(1440);
  expect(parseIntStrict('1441',1,1440)).toBeUndefined();
  expect(parseIntStrict('100',1,180)).toBe(100);
  expect(parseIntStrict('1e2',1,180)).toBeUndefined();
  expect(parseIntStrict('1e2')).not.toBe(Number('1e2'));
});
