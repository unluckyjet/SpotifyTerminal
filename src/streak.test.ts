import {test,expect} from 'bun:test';
import {listeningStreak} from './streak';
const day=86_400_000;
function utc(ymd:string,h=12){return `${ymd}T${String(h).padStart(2,'0')}:00:00.000Z`;}
function shift(ymd:string,days:number){return new Date(Date.parse(ymd+'T00:00:00.000Z')+days*day).toISOString().slice(0,10);}
test('listening streak uses unique UTC days with github current and longest run',()=>{
  const today='2026-09-07';
  expect(listeningStreak([],today)).toEqual({current:0,longest:0});
  expect(listeningStreak(['nope','',utc(today)],today)).toEqual({current:1,longest:1});
  expect(listeningStreak([utc(today),utc(today),utc(today,23)],today)).toEqual({current:1,longest:1});
  expect(listeningStreak([utc(shift(today,-1))],today)).toEqual({current:1,longest:1});
  expect(listeningStreak([utc(shift(today,-2))],today)).toEqual({current:0,longest:1});
  expect(listeningStreak([utc(today),utc(shift(today,-2)),utc(shift(today,-1))],today)).toEqual({current:3,longest:3});
  expect(listeningStreak([utc(shift(today,-1)),utc(shift(today,-2))],today)).toEqual({current:2,longest:2});
  expect(listeningStreak([utc('2026-09-01'),utc('2026-09-02'),utc('2026-09-03'),utc(today)],today)).toEqual({current:1,longest:3});
  expect(listeningStreak([utc('2026-09-01'),utc('2026-09-05'),utc('2026-09-06')],today)).toEqual({current:2,longest:2});
  expect(listeningStreak([utc('2024-02-28'),utc('2024-02-29'),utc('2024-03-01')],'2024-03-01')).toEqual({current:3,longest:3});
  expect(listeningStreak([utc('2025-12-31'),utc('2026-01-01')],'2026-01-01')).toEqual({current:2,longest:2});
  expect(listeningStreak(['2026-09-07T00:30:00+05:00'],'2026-09-06')).toEqual({current:1,longest:1});
  expect(listeningStreak([utc(shift(today,1))],today)).toEqual({current:0,longest:1});
  const now=new Date().toISOString();
  expect(listeningStreak([now])).toEqual(listeningStreak([now],now.slice(0,10)));
  expect(listeningStreak([now]).current).toBeGreaterThan(0);
  expect(listeningStreak([now]).longest).toBe(1);
});
