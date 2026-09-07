export function unicodeBar(ratio:number,width:number):string{
  const w=Math.floor(width);
  if(!Number.isFinite(w)||w<1)return '';
  const t=Number.isFinite(ratio)?Math.min(1,Math.max(0,ratio)):0;
  const cells=t*w;
  const full=Math.min(w,Math.floor(cells));
  const half=full<w&&cells-full>=0.5;
  return '█'.repeat(full)+(half?'▌':'')+' '.repeat(w-full-(half?1:0));
}
