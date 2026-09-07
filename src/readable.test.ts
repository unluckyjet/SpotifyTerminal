import {test,expect} from 'bun:test';
import {readableText} from './readable';

const parse=(color:string)=>{
  const h=color.startsWith('#')?color.slice(1):color;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16));
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);
};
const linear=(c:number)=>{const v=c/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
const luminance=(color:string)=>{const [r,g,b]=parse(color);return 0.2126*linear(r)+0.7152*linear(g)+0.0722*linear(b);};
const contrast=(a:string,b:string)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+0.05)/(lo+0.05);};
const pick=(bg:string):'#000000'|'#ffffff'=>contrast(bg,'#000000')>=contrast(bg,'#ffffff')?'#000000':'#ffffff';
const hex=(r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');

test('readableText picks #000000 or #ffffff by WCAG contrast against the background',()=>{
  expect(contrast('#ffffff','#000000')).toBe(21);
  expect(contrast('#000000','#ffffff')).toBe(21);
  const samples=['#000000','#ffffff','#000','#fff','000000','ffffff','#FFF','#ABC','#abc','#123','#aaa','#555','#111111','#eeeeee','#777777','#808080','#757575','#767676','#787878','#888888','#c4281c','#3a7bd5','#ffcc00','#0052cc','#101010','#f4f4ff','#22cc33','#3366ff','#00FF00','#ff0000','#0000ff','#ffff00','#ff00ff','#00ffff','#1a1a1a','#fafafa','#ffcc00','#0052cc'];
  for(let i=0;i<256;i+=15)samples.push(hex(i,i,i),hex(i,0,0),hex(0,i,0),hex(0,0,i),hex(i,i,0),hex(i,0,i),hex(0,i,i));
  for(const bg of samples){
    const text=readableText(bg);
    expect(text==='#000000'||text==='#ffffff').toBe(true);
    expect(text).toBe(pick(bg));
    const other=text==='#000000'?'#ffffff':'#000000';
    expect(contrast(text,bg)).toBeGreaterThanOrEqual(contrast(other,bg));
  }
  expect(readableText('#000000')).toBe('#ffffff');
  expect(readableText('#ffffff')).toBe('#000000');
  expect(readableText('#fff')).toBe(readableText('#ffffff'));
  expect(readableText('#000')).toBe(readableText('#000000'));
  expect(readableText('fff')).toBe(readableText('#ffffff'));
  expect(readableText('000')).toBe(readableText('#000000'));
  expect(luminance('#ffffff')).toBeGreaterThan(luminance('#000000'));
  expect(contrast(readableText('#000000'),'#000000')).toBeGreaterThan(contrast('#000000','#000000'));
  expect(contrast(readableText('#ffffff'),'#ffffff')).toBeGreaterThan(contrast('#ffffff','#ffffff'));
});
