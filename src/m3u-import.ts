import {parseSpotifyUri} from './uri';

function extInf(line:string){
  const comma=line.indexOf(',');
  if(comma<0)return;
  const title=line.slice(comma+1).trim();
  const sep=title.indexOf(' - ');
  if(sep<0)return;
  const artist=title.slice(0,sep).trim();
  const name=title.slice(sep+3).trim();
  if(!artist||!name)return;
  return {artist,name};
}

export function parseM3U(text:string):{id:string;name:string;artist:string}[]{
  const items:{id:string;name:string;artist:string}[]=[];
  let pending:{name:string;artist:string}|undefined;
  for(const raw of text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/)){
    const line=raw.trim();
    if(!line)continue;
    if(/^#EXTINF:/i.test(line)){pending=extInf(line);continue;}
    if(line.startsWith('#'))continue;
    const ref=parseSpotifyUri(line);
    if(pending&&ref?.kind==='track')items.push({id:ref.id,...pending});
    pending=undefined;
  }
  return items;
}
