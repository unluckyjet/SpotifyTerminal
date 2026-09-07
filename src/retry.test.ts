import {test,expect} from 'bun:test';
import {backoffDelay,RetryBudget} from './retry';
test('backoffDelay is min(cap, base*2**attempt) and RetryBudget exhausts then resets',()=>{
  const delay=(attempt:number,base=200,cap=5000)=>Math.min(cap,base*2**Math.max(0,attempt));
  expect(backoffDelay(0)).toBe(delay(0));
  expect(backoffDelay(1)).toBe(delay(1));
  expect(backoffDelay(2)).toBe(delay(2));
  expect(backoffDelay(4)).toBe(delay(4));
  expect(backoffDelay(5)).toBe(delay(5));
  expect(backoffDelay(8)).toBe(delay(8));
  expect(backoffDelay(5)).toBe(backoffDelay(20));
  expect(backoffDelay(-3)).toBe(backoffDelay(0));
  expect(backoffDelay(3,100,10_000)).toBe(delay(3,100,10_000));
  expect(backoffDelay(0,50,40)).toBe(40);
  expect(backoffDelay(1,300)).toBe(delay(1,300));
  expect(backoffDelay(10,200,5000)).toBe(5000);
  for(let attempt=0;attempt<12;attempt++){
    expect(backoffDelay(attempt)).toBe(delay(attempt));
    expect(backoffDelay(attempt,80,1000)).toBe(delay(attempt,80,1000));
  }
  const budget=new RetryBudget();
  expect(budget.attempts).toBe(0);
  for(let i=1;i<=4;i++){expect(budget.fail()).toBe(false);expect(budget.attempts).toBe(i);}
  expect(budget.fail()).toBe(true);expect(budget.attempts).toBe(5);
  expect(budget.fail()).toBe(true);expect(budget.attempts).toBe(6);
  budget.ok();expect(budget.attempts).toBe(0);expect(budget.fail()).toBe(false);expect(budget.attempts).toBe(1);
  budget.ok();expect(budget.attempts).toBe(0);
  const tiny=new RetryBudget(2);
  expect(tiny.fail()).toBe(false);expect(tiny.attempts).toBe(1);
  expect(tiny.fail()).toBe(true);expect(tiny.attempts).toBe(2);
  tiny.ok();expect(tiny.attempts).toBe(0);expect(tiny.fail()).toBe(false);
  const once=new RetryBudget(1);
  expect(once.fail()).toBe(true);expect(once.attempts).toBe(1);
  once.ok();expect(once.attempts).toBe(0);
});
test('readWithRetry retries with backoffDelay then returns the real read',async()=>{
  const {readWithRetry,backoffDelay,RetryBudget}=await import('./retry');
  let n=0;
  const waits:number[]=[];
  const value=await readWithRetry(async()=>{n++;if(n<3)throw new Error('transient');return 'ok';},new RetryBudget(5),async ms=>{waits.push(ms);});
  expect(value).toBe('ok');
  expect(n).toBe(3);
  expect(waits).toEqual([backoffDelay(0),backoffDelay(1)]);
  let fails=0;
  await expect(readWithRetry(async()=>{fails++;throw new Error('dead');},new RetryBudget(2),async()=>{})).rejects.toThrow('dead');
  expect(fails).toBe(2);
});
