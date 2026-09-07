const parse=(color:string)=>{
  const h=color.startsWith('#')?color.slice(1):color;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16));
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);
};
const linear=(c:number)=>{const v=c/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;};
const luminance=(color:string)=>{const [r,g,b]=parse(color);return 0.2126*linear(r)+0.7152*linear(g)+0.0722*linear(b);};
const contrast=(a:string,b:string)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+0.05)/(lo+0.05);};
export function readableText(bg:string):'#000000'|'#ffffff'{
  return contrast(bg,'#000000')>=contrast(bg,'#ffffff')?'#000000':'#ffffff';
}
