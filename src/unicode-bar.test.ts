import {test,expect} from 'bun:test';
import {unicodeBar} from './unicode-bar';
const draw=(ratio:number,width:number)=>{
  const w=Math.floor(width);
  if(!Number.isFinite(w)||w<1)return '';
  const t=Number.isFinite(ratio)?Math.min(1,Math.max(0,ratio)):0;
  const cells=t*w;
  const full=Math.min(w,Math.floor(cells));
  const half=full<w&&cells-full>=0.5;
  return '█'.repeat(full)+(half?'▌':'')+' '.repeat(w-full-(half?1:0));
};
const units=(s:string)=>[...s].reduce((n,c)=>n+(c==='█'?2:c==='▌'?1:0),0);
test('unicodeBar uses █ and ▌ for partial, length===width, clamps ratio 0-1, empty when width<1',()=>{
  for(const width of [0,-1,-0.5,0.5,0.99,Number.NaN,-Infinity,Infinity])expect(unicodeBar(0.8,width)).toBe('');
  expect(unicodeBar(1,0)).toBe('');
  expect(unicodeBar(1,0.9)).toBe(unicodeBar(0,0.9));
  const widths=[1,2,3,4,5,8,10,16,24,40];
  const ratios=[0,-1,-0.3,0.01,0.1,0.125,0.2,0.25,0.33,0.49,0.5,0.51,0.66,0.75,0.9,0.99,1,1.2,2,100,Number.NaN,Infinity,-Infinity];
  for(const width of widths)for(const ratio of ratios){
    const got=unicodeBar(ratio,width);
    expect(got).toBe(draw(ratio,width));
    expect(got.length).toBe(width);
    expect([...got].every(c=>'█▌ '.includes(c))).toBe(true);
    expect((got.match(/▌/g)||[]).length).toBeLessThanOrEqual(1);
    expect(got).toMatch(/^█*▌? *$/);
  }
  expect(unicodeBar(0,8)).toBe(' '.repeat(8));
  expect(unicodeBar(1,8)).toBe('█'.repeat(8));
  expect(unicodeBar(2,8)).toBe(unicodeBar(1,8));
  expect(unicodeBar(-2,8)).toBe(unicodeBar(0,8));
  expect(unicodeBar(Number.NaN,8)).toBe(unicodeBar(0,8));
  expect(unicodeBar(0.5,1)).toBe('▌');
  expect(unicodeBar(0.49,1)).toBe(' ');
  expect(unicodeBar(1,1)).toBe('█');
  expect(unicodeBar(0,1)).toBe(' ');
  expect(unicodeBar(0.5,4)).toContain('█');
  expect(unicodeBar(0.125,4)).toBe('▌'+' '.repeat(3));
  expect(unicodeBar(0.875,4)).toContain('▌');
  expect(unicodeBar(0.75,4)).toBe('█'.repeat(3)+' ');
  let prev=-1;
  for(let i=0;i<=40;i++){
    const s=unicodeBar(i/40,10);
    const n=units(s);
    expect(n).toBeGreaterThanOrEqual(prev);
    prev=n;
    expect(s.length).toBe(10);
  }
  expect(units(unicodeBar(1,10))).toBeGreaterThan(units(unicodeBar(0.5,10)));
  expect(units(unicodeBar(0.5,10))).toBeGreaterThan(units(unicodeBar(0,10)));
  expect(unicodeBar(0.5,10).length).toBe(10);
});
