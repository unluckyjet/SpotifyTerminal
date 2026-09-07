const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
export function formatOnce(track:{name:string;artist:string;album:string;playing:boolean;position:number;duration:number},style:'text'|'json'='text'):string{
  if(style==='json')return JSON.stringify({name:track.name,artist:track.artist,album:track.album,playing:track.playing,position:track.position,duration:track.duration});
  return `${track.playing?'▶':'Ⅱ'} ${track.name} — ${track.artist} — ${track.album} (${clock(track.position)}/${clock(track.duration)})`;
}
