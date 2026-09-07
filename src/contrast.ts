type RGB=[number,number,number];
const hex=(rgb:RGB)=>'#'+rgb.map(v=>Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,'0')).join('');
const parse=(color:string):RGB=>{
  const h=color.startsWith('#')?color.slice(1):color;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16)) as RGB;
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0) as RGB;
};
const linear=(c:number)=>{const v=c/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
const luminance=(color:string)=>{const [r,g,b]=parse(color);return 0.2126*linear(r)+0.7152*linear(g)+0.0722*linear(b);};
export function contrastRatio(a:string,b:string){
  const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (hi+0.05)/(lo+0.05);
}
const mix=(from:RGB,to:RGB,amount:number)=>from.map((v,i)=>v*(1-amount)+to[i]*amount) as RGB;
export function highContrast<T extends {bg:string;text:string;accent:string;muted:string}>(theme:T):T{
  if(contrastRatio(theme.text,theme.bg)>=7&&contrastRatio(theme.accent,theme.bg)>=4.5&&contrastRatio(theme.muted,theme.bg)>=4.5)return {...theme};
  const bg=contrastRatio(theme.text,'#000000')>=contrastRatio(theme.text,'#ffffff')?'#000000':'#ffffff';
  const text=bg==='#000000'?'#ffffff':'#000000';
  const accent=bg==='#000000'?'#ffcc00':'#0052cc';
  const muted=hex(mix(parse(text),parse(bg),0.2));
  return {...theme,bg,text,accent,muted};
}
