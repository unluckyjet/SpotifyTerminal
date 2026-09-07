import {test,expect} from 'bun:test';
import {formatBytes} from './bytes';

const KiB=1024;
const MiB=1024**2;
const GiB=1024**3;
const TiB=1024**4;
function expected(n:number){
  const bytes=Number.isFinite(n)&&n>0?n:0;
  if(bytes<KiB)return `${Math.round(bytes)} B`;
  if(bytes<MiB)return `${(bytes/KiB).toFixed(1)} KB`;
  if(bytes<GiB)return `${(bytes/MiB).toFixed(1)} MB`;
  if(bytes<TiB)return `${(bytes/GiB).toFixed(1)} GB`;
  return `${(bytes/TiB).toFixed(1)} TB`;
}

test('formatBytes is 0 B, 1.5 KB, 2.0 MB with 1024-based units',()=>{
  expect(formatBytes(0)).toBe('0 B');
  expect(formatBytes(1.5*KiB)).toBe('1.5 KB');
  expect(formatBytes(2*MiB)).toBe('2.0 MB');
  expect(formatBytes(Buffer.alloc(0).byteLength)).toBe('0 B');
  expect(formatBytes(Buffer.alloc(1536).byteLength)).toBe('1.5 KB');
  expect(formatBytes(Buffer.alloc(2*MiB).byteLength)).toBe('2.0 MB');

  const sizes=[0,1,512,1023,1024,1536,2048,10_000,45_000,200_000,MiB-1,MiB,1.5*MiB,2*MiB,5*MiB,GiB,1.5*GiB,TiB,2*TiB,-1,-0.4,0.4,0.5,NaN,Infinity,-Infinity];
  for(const n of sizes){
    const got=formatBytes(n);
    expect(got).toBe(expected(n));
    expect(got).toMatch(/^\d+(?:\.\d)? (?:B|KB|MB|GB|TB)$/);
  }
  expect(formatBytes(1023)).toBe('1023 B');
  expect(formatBytes(KiB)).toBe('1.0 KB');
  expect(formatBytes(MiB)).toBe('1.0 MB');
  expect(formatBytes(GiB)).toBe('1.0 GB');
  expect(formatBytes(Number.NaN)).toBe(formatBytes(0));
  expect(formatBytes(-20)).toBe(formatBytes(0));
  expect(formatBytes(Infinity)).toBe(formatBytes(0));
});
