const parse=(color:string)=>{
  const h=color.startsWith('#')?color.slice(1):color;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16));
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);
};

export function deuteranopiaTheme<T extends {accent:string;text:string;bg:string;muted:string}>(theme:T):T{
  const [r,g,b]=parse(theme.accent);
  return {...theme,accent:g>r&&g>b?'#f0c400':theme.accent};
}
