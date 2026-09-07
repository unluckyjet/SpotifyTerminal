import {test,expect} from 'bun:test';
import {hourHeatmap,formatHeatmap} from './heatmap';
const bars=' ▂▃▄▅▆▇█';
test('hourHeatmap counts UTC hours and formatHeatmap scales 24 bars to max',()=>{
  const empty=hourHeatmap([]);
  expect(empty).toHaveLength(24);expect(empty.every(n=>n===0)).toBe(true);
  expect(formatHeatmap(empty)).toBe(' '.repeat(24));expect(formatHeatmap([])).toBe(' '.repeat(24));
  expect(formatHeatmap(Array.from({length:24},()=>0))).toBe(' '.repeat(24));
  const counted=hourHeatmap([
    '2026-06-15T00:00:00.000Z','2026-06-15T00:59:59.999Z','2026-06-15T12:34:56.000Z','2026-06-15T23:00:00Z',
    '2026-06-15T05:30:00+05:30','2026-06-15T12:00:00-08:00','not-a-date','','2026-13-40','2026-02-30T99:99:99Z',
  ]);
  expect(counted).toHaveLength(24);
  expect(counted[0]).toBe(3);expect(counted[12]).toBe(1);expect(counted[20]).toBe(1);expect(counted[23]).toBe(1);
  expect(counted.reduce((a,b)=>a+b,0)).toBe(6);
  for(const n of counted)expect(n).toBeGreaterThanOrEqual(0);
  const peak=formatHeatmap(counted);
  expect(peak).toHaveLength(24);expect([...peak].every(c=>bars.includes(c))).toBe(true);
  expect(peak[0]).toBe('█');expect(peak[12]).not.toBe(' ');expect(peak[1]).toBe(' ');
  const even=formatHeatmap(Array.from({length:24},()=>3));
  expect(even).toBe('█'.repeat(24));
  const spark=Array.from({length:24},(_,i)=>i===3?4:i===7?2:i===11?1:0);
  const drawn=formatHeatmap(spark);
  expect(drawn).toHaveLength(24);expect(drawn[3]).toBe('█');expect(drawn[7]).toBe(bars[Math.round(2/4*7)]);
  expect(drawn[11]).toBe(bars[Math.round(1/4*7)]);expect(drawn[0]).toBe(' ');
  expect(bars.indexOf(drawn[7])).toBeGreaterThan(bars.indexOf(drawn[11]));
  expect(formatHeatmap([7])).toBe('█'+' '.repeat(23));
  expect(formatHeatmap([NaN,Infinity,-3,1])).toBe(' '.repeat(3)+'█'+' '.repeat(20));
});
