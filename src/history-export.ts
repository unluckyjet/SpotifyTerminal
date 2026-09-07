export type HistoryRow={id:string;name:string;artist:string;album:string;playedAt:string};
const columns=['id','name','artist','album','playedAt'] as const;
function csvField(value:string){
  return /["\r\n,]/.test(value)?`"${value.replaceAll('"','""')}"`:value;
}
function trackId(id:string){
  return id.startsWith('spotify:track:')?id.slice('spotify:track:'.length):id;
}
export function exportHistory(entries:HistoryRow[],format:'csv'|'json'|'m3u'):string{
  if(format==='json')return JSON.stringify(entries);
  if(format==='csv')return [columns.join(','),...entries.map(e=>columns.map(k=>csvField(e[k])).join(','))].join('\r\n');
  if(format==='m3u')return ['#EXTM3U',...entries.flatMap(e=>[`#EXTINF:-1,${e.artist} - ${e.name}`,`spotify:track:${trackId(e.id)}`])].join('\n');
  throw new Error('Unknown format');
}
