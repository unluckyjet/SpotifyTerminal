import {test,expect} from 'bun:test';
import {isoWeek,weekStats} from './week-stats';
test('isoWeek is YYYY-Www and weekStats counts plays and unique UTC days',()=>{
  expect(isoWeek('2026-01-01T00:00:00.000Z')).toBe('2026-W01');
  expect(isoWeek('2025-12-29T00:00:00.000Z')).toBe('2026-W01');
  expect(isoWeek('2025-12-28T23:59:59.999Z')).toBe('2025-W52');
  expect(isoWeek('2026-01-04T23:59:59.999Z')).toBe('2026-W01');
  expect(isoWeek('2026-01-05T00:00:00.000Z')).toBe('2026-W02');
  expect(isoWeek('2020-12-31T12:00:00.000Z')).toBe('2020-W53');
  expect(isoWeek('2021-01-01T12:00:00.000Z')).toBe('2020-W53');
  expect(isoWeek('2021-01-04T00:00:00.000Z')).toBe('2021-W01');
  expect(isoWeek('2016-01-01T00:00:00.000Z')).toBe('2015-W53');
  expect(isoWeek('2026-06-15T12:00:00.000Z')).toBe('2026-W25');
  expect(isoWeek('not-a-date')).toBe('');
  expect(isoWeek('')).toBe('');
  expect(isoWeek('2026-01-01T00:00:00.000Z')).toMatch(/^\d{4}-W\d{2}$/);
  expect(weekStats([],'2026-W01')).toEqual({plays:0,days:0});
  const stamps=[
    '2025-12-29T00:00:00.000Z','2025-12-29T18:00:00.000Z','2026-01-01T08:00:00.000Z','2026-01-04T23:00:00.000Z',
    '2025-12-28T23:00:00.000Z','2026-01-05T00:00:00.000Z','not-a-date','','2026-13-40',
  ];
  expect(weekStats(stamps,'2026-W01')).toEqual({plays:4,days:3});
  expect(weekStats(stamps,'2025-W52')).toEqual({plays:1,days:1});
  expect(weekStats(stamps,'2026-W02')).toEqual({plays:1,days:1});
  expect(weekStats(stamps,'2024-W01')).toEqual({plays:0,days:0});
  expect(isoWeek('2026-01-05T00:30:00+05:30')).toBe('2026-W01');
  expect(weekStats(['2026-01-05T00:30:00+05:30','2026-01-04T12:00:00.000Z'],'2026-W01')).toEqual({plays:2,days:1});
  const week2=['2026-01-05','2026-01-06','2026-01-07','2026-01-08','2026-01-09','2026-01-10','2026-01-11'].map(d=>`${d}T12:00:00.000Z`);
  expect(week2.every(s=>isoWeek(s)==='2026-W02')).toBe(true);
  expect(weekStats([...week2,week2[0]],'2026-W02')).toEqual({plays:8,days:7});
  const now=new Date().toISOString();
  expect(isoWeek(now)).toMatch(/^\d{4}-W\d{2}$/);
  expect(weekStats([now])).toEqual({plays:1,days:1});
  expect(weekStats([now],isoWeek(now))).toEqual({plays:1,days:1});
  const other=isoWeek(now)==='2020-W01'?'2020-W02':'2020-W01';
  expect(weekStats([now],other)).toEqual({plays:0,days:0});
});
