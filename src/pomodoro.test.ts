import {test,expect} from 'bun:test';
import {Pomodoro,type PomodoroPhase} from './pomodoro';
const clock=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const WORK=25*60_000,BRK=5*60_000,LONG=15*60_000;
test('pomodoro starts at work, ticks through breaks and long-breaks, and cancels to idle',()=>{
  const p=new Pomodoro();
  expect(p.phase).toBe('idle');expect(p.completed).toBe(0);expect(p.remaining()).toBeUndefined();expect(p.label()).toBe('');
  expect(p.tick(0)).toBe('idle');expect(p.remaining(0)).toBeUndefined();
  const t0=1000;p.start(t0);
  expect(p.phase).toBe('work');expect(p.completed).toBe(0);
  expect(p.remaining(t0)).toBe(WORK/1000);expect(p.label(t0)).toBe(`work ${clock(WORK/1000)}`);
  expect(p.label(t0)).toMatch(/work \d+:\d{2}/);
  expect(p.remaining(t0+1000)).toBe(WORK/1000-1);expect(p.label(t0+1000)).toBe(`work ${clock(p.remaining(t0+1000)!)}`);
  expect(p.tick(t0+WORK-1)).toBe('work');expect(p.completed).toBe(0);expect(p.remaining(t0+WORK)).toBe(0);
  let now=t0;
  for(let n=1;n<=8;n++){
    expect(p.phase).toBe('work');expect(p.tick(now+WORK-1)).toBe('work');
    now+=WORK;
    const next:PomodoroPhase=n%4===0?'long-break':'break';
    expect(p.tick(now)).toBe(next);expect(p.completed).toBe(n);expect(p.phase).toBe(next);
    const span=next==='long-break'?LONG:BRK;
    expect(p.remaining(now)).toBe(span/1000);expect(p.label(now)).toBe(`${next} ${clock(span/1000)}`);
    expect(p.label(now)).toContain(next);expect(p.label(now)).toContain(clock(p.remaining(now)!));
    expect(p.tick(now+span-1)).toBe(next);expect(p.completed).toBe(n);
    now+=span;expect(p.tick(now)).toBe('work');expect(p.completed).toBe(n);
    expect(p.remaining(now)).toBe(WORK/1000);expect(p.label(now)).toBe(`work ${clock(p.remaining(now)!)}`);
  }
  expect(p.completed).toBe(8);
  p.cancel();expect(p.phase).toBe('idle');expect(p.remaining()).toBeUndefined();expect(p.remaining(9e15)).toBeUndefined();
  expect(p.label()).toBe('');expect(p.tick(9e15)).toBe('idle');
  p.start(0);expect(p.phase).toBe('work');expect(p.completed).toBe(0);expect(p.remaining(0)).toBe(25*60);expect(p.label(0)).toBe(`work ${clock(25*60)}`);
  p.start(50_000);expect(p.phase).toBe('work');expect(p.remaining(50_000)).toBe(25*60);expect(p.completed).toBe(0);
  p.cancel();expect(p.phase).toBe('idle');expect(p.remaining()).toBeUndefined();
});
