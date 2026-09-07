function top(counts:Map<string,number>){
  let winner='';let best=0;
  for(const [name,count] of counts)if(count>best||count===best&&name<winner){winner=name;best=count;}
  return winner;
}

export function wrappedStats(entries:{id:string;artist:string;album:string;name:string;playedAt:string}[],year:number):{tracks:number;artists:number;albums:number;topArtist:string;topTrack:string;days:number}{
  const ids=new Set<string>();
  const artists=new Set<string>();
  const albums=new Set<string>();
  const days=new Set<string>();
  const artistN=new Map<string,number>();
  const trackN=new Map<string,number>();
  for(const e of entries){
    const t=Date.parse(e.playedAt);
    if(!Number.isFinite(t))continue;
    const day=new Date(t).toISOString().slice(0,10);
    if(+day.slice(0,4)!==year)continue;
    ids.add(e.id);artists.add(e.artist);albums.add(e.album);days.add(day);
    artistN.set(e.artist,(artistN.get(e.artist)??0)+1);
    trackN.set(e.name,(trackN.get(e.name)??0)+1);
  }
  return {tracks:ids.size,artists:artists.size,albums:albums.size,topArtist:top(artistN),topTrack:top(trackN),days:days.size};
}
