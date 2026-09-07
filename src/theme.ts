type RGB = [number, number, number];
const hex=(rgb:RGB)=>'#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mix=(rgb:RGB,target:number,amount:number):RGB=>rgb.map(v=>v*(1-amount)+target*amount) as RGB;
export function albumTheme(pixels?:Buffer) {
  let dominant:RGB=[125,130,140];
  if(pixels?.length){
    const buckets=new Map<number,{sum:RGB;count:number}>();
    for(let i=0;i+2<pixels.length;i+=3){
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
      const key=(r>>5)*64+(g>>5)*8+(b>>5);
      const bucket=buckets.get(key)??{sum:[0,0,0] as RGB,count:0};
      bucket.sum[0]+=r;bucket.sum[1]+=g;bucket.sum[2]+=b;bucket.count++;buckets.set(key,bucket);
    }
    // Prefer prominent chromatic colors, but support monochrome covers too.
    let score=-1;
    for(const {sum,count} of buckets.values()){
      const rgb=sum.map(v=>v/count) as RGB;
      const saturation=(Math.max(...rgb)-Math.min(...rgb))/255;
      const value=Math.max(...rgb)/255;
      const rank=count*(1+saturation*2)*(value<0.12?0.2:1);
      if(rank>score){score=rank;dominant=rgb;}
    }
  }
  return {bg:hex(mix(dominant,0,0.91)),accent:hex(mix(dominant,255,0.48)),text:hex(mix(dominant,255,0.92)),muted:hex(mix(dominant,255,0.60)),surface:hex(mix(dominant,0,0.68))};
}

export type AlbumTheme=ReturnType<typeof albumTheme>;
export function blendTheme(from:AlbumTheme,to:AlbumTheme,progress:number):AlbumTheme{
  const t=Math.max(0,Math.min(1,progress));
  return Object.fromEntries(Object.keys(to).map(key=>{
    const k=key as keyof AlbumTheme;
    const rgb=[1,3,5].map(i=>Math.round(parseInt(from[k].slice(i,i+2),16)*(1-t)+parseInt(to[k].slice(i,i+2),16)*t));
    return [k,hex(rgb as RGB)];
  })) as AlbumTheme;
}
