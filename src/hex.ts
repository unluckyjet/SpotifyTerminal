export function parseHex(color:string):[number,number,number]|undefined{
  const raw=color.trim();
  const h=raw.startsWith('#')?raw.slice(1):raw;
  if(!/^[0-9a-f]{3}$/i.test(h)&&!/^[0-9a-f]{6}$/i.test(h))return;
  if(h.length===3)return [0,1,2].map(i=>parseInt(h[i]+h[i],16)) as [number,number,number];
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)) as [number,number,number];
}

export function formatHex(rgb:[number,number,number]):string{
  return '#'+rgb.map(v=>Math.min(255,Math.max(0,Math.round(Number.isFinite(v)?v:0))).toString(16).padStart(2,'0')).join('');
}
