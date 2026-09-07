export function luma(hex:string){
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  return 0.2126*r+0.7152*g+0.0722*b;
}

export function monoTheme<T extends {bg:string;text:string;accent:string;muted:string;surface?:string}>(theme:T):T{
  return Object.fromEntries(Object.keys(theme).map(key=>{
    const y=Math.round(luma(theme[key as keyof T] as string)).toString(16).padStart(2,'0');
    return [key,`#${y}${y}${y}`];
  })) as T;
}
