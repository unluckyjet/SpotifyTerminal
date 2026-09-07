import {test,expect} from 'bun:test';
import {luma,monoTheme} from './mono';

const gray=(hex:string)=>{
  const y=Math.round(luma(hex)).toString(16).padStart(2,'0');
  return `#${y}${y}${y}`;
};

test('luma is Rec.709; monoTheme sets r=g=b to luma for each hex field',()=>{
  expect(luma('#000000')).toBe(0);
  expect(luma('#ffffff')).toBeCloseTo(255);
  expect(luma('#FFFFFF')).toBeCloseTo(255);
  expect(luma('#ff0000')).toBeCloseTo(0.2126*255);
  expect(luma('#00ff00')).toBeCloseTo(0.7152*255);
  expect(luma('#0000ff')).toBeCloseTo(0.0722*255);
  expect(luma('#808080')).toBeCloseTo(128);
  expect(luma('#ff0000')/luma('#ffffff')).toBeCloseTo(0.2126);
  expect(luma('#00ff00')/luma('#ffffff')).toBeCloseTo(0.7152);
  expect(luma('#0000ff')/luma('#ffffff')).toBeCloseTo(0.0722);
  expect(luma('#ff0000')).not.toBeCloseTo(0.299*255);
  const theme={bg:'#c4281c',text:'#e8eef4',accent:'#3a7bd5',muted:'#6b8f71',surface:'#243038'};
  const source={...theme};
  const mono=monoTheme(theme);
  expect(theme).toEqual(source);
  expect(Object.keys(mono)).toEqual(Object.keys(theme));
  for(const key of Object.keys(theme) as (keyof typeof theme)[]){
    const [r,g,b]=[1,3,5].map(i=>parseInt(mono[key].slice(i,i+2),16));
    expect(r).toBe(g);expect(g).toBe(b);expect(r).toBe(Math.round(luma(theme[key])));
    expect(mono[key]).toBe(gray(theme[key]));
  }
  const noSurface={bg:'#ff8800',text:'#112233',accent:'#00ffaa',muted:'#abcdef'};
  const flat=monoTheme(noSurface);
  expect('surface' in flat).toBe(false);
  for(const key of Object.keys(noSurface) as (keyof typeof noSurface)[])expect(flat[key]).toBe(gray(noSurface[key]));
  expect(monoTheme({...noSurface,surface:'#010203'}).surface).toBe(gray('#010203'));
  expect(gray('#111111')).toBe('#111111');
  expect(monoTheme({bg:'#111111',text:'#eeeeee',accent:'#888888',muted:'#444444'})).toEqual({bg:'#111111',text:'#eeeeee',accent:'#888888',muted:'#444444'});
});
