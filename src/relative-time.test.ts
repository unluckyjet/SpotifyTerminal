import {test,expect} from 'bun:test';
import {relativeTime} from './relative-time';
const day=86_400_000;
function expected(iso:string,now:number){
  const t=Date.parse(iso);
  if(!Number.isFinite(t))return '';
  const s=(now-t)/1000;
  if(s<60)return 'just now';
  if(s<3600)return `${Math.floor(s/60)}m ago`;
  if(s<86400)return `${Math.floor(s/3600)}h ago`;
  if(s<604800)return `${Math.floor(s/86400)}d ago`;
  return new Date(t).toISOString().slice(0,10);
}
test('relativeTime is just now / Nm ago / Nh ago / Nd ago or UTC YYYY-MM-DD; invalid is empty',()=>{
  const now=Date.parse('2024-06-15T12:00:00.000Z');
  const iso=(ms:number)=>new Date(now-ms).toISOString();
  for(const invalid of ['','nope','   ','2024-99-99','not-a-date',':'])expect(relativeTime(invalid,now)).toBe('');
  const offsets=[0,1,1000,59_999,60_000,60_001,119_999,120_000,3_599_999,3_600_000,3_600_001,7_200_000,86_399_999,86_400_000,86_400_001,2*day,6*day,6*day+86_399_999,7*day,7*day+1,30*day,365*day,-1,-59_999,1e12];
  for(const ms of offsets){
    const stamp=iso(ms);
    expect(relativeTime(stamp,now)).toBe(expected(stamp,now));
  }
  expect(relativeTime(iso(0),now)).toBe('just now');
  expect(relativeTime(iso(59_999),now)).toBe('just now');
  expect(relativeTime(iso(60_000),now)).toBe('1m ago');
  expect(relativeTime(iso(3_599_999),now)).toBe('59m ago');
  expect(relativeTime(iso(3_600_000),now)).toBe('1h ago');
  expect(relativeTime(iso(86_399_999),now)).toBe('23h ago');
  expect(relativeTime(iso(86_400_000),now)).toBe('1d ago');
  expect(relativeTime(iso(6*day),now)).toBe('6d ago');
  expect(relativeTime(iso(7*day-1),now)).toBe('6d ago');
  expect(relativeTime(iso(7*day),now)).toBe('2024-06-08');
  expect(relativeTime('2024-01-01T23:30:00-05:00',Date.parse('2024-02-01T00:00:00.000Z'))).toBe('2024-01-02');
  expect(relativeTime(iso(-5000),now)).toBe('just now');
  const live=Date.now();
  expect(relativeTime(new Date(live).toISOString())).toBe('just now');
  expect(relativeTime(new Date(live-120_000).toISOString())).toBe('2m ago');
  expect(relativeTime(new Date(live-3*3_600_000).toISOString())).toBe('3h ago');
});
