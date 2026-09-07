export function topTracks(counts:Record<string,number>,names:Record<string,string>,limit=10){
  return Object.entries(counts).filter(([,count])=>count!==0).map(([id,count])=>({id,name:names[id]??id,count}))
    .sort((a,b)=>b.count-a.count||(a.name<b.name?-1:a.name>b.name?1:0)).slice(0,Math.max(0,limit));
}
export function topArtists(entries:{artist:string;id:string}[],counts:Record<string,number>,limit=10){
  const totals:Record<string,number>={};
  for(const {artist,id} of entries)totals[artist]=(totals[artist]??0)+(counts[id]??1);
  return Object.entries(totals).map(([artist,count])=>({artist,count}))
    .sort((a,b)=>b.count-a.count||(a.artist<b.artist?-1:a.artist>b.artist?1:0)).slice(0,Math.max(0,limit));
}
