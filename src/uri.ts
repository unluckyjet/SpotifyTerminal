export type SpotifyRef={kind:'track'|'album'|'playlist'|'artist'|'episode'|'show';id:string};
const KINDS=new Set<SpotifyRef['kind']>(['track','album','playlist','artist','episode','show']);
const ID=/^[0-9A-Za-z]+$/;

function toRef(kind:string,id:string):SpotifyRef|null{
  const k=kind.toLowerCase();
  if(!KINDS.has(k as SpotifyRef['kind'])||!ID.test(id))return null;
  return {kind:k as SpotifyRef['kind'],id};
}

export function parseSpotifyUri(value:string):SpotifyRef|null{
  const raw=value.trim();
  const uri=/^spotify:([A-Za-z]+):([0-9A-Za-z]+)$/.exec(raw);
  if(uri)return toRef(uri[1],uri[2]);
  try{
    const url=new URL(raw);
    if((url.protocol!=='https:'&&url.protocol!=='http:')||url.hostname!=='open.spotify.com')return null;
    const parts=url.pathname.replace(/^\/+|\/+$/g,'').split('/');
    if(parts.length!==2)return null;
    return toRef(parts[0],parts[1]);
  }catch{return null;}
}

export function formatSpotifyUri(ref:SpotifyRef){return `spotify:${ref.kind}:${ref.id}`;}
export function openSpotifyUrl(ref:SpotifyRef){return `https://open.spotify.com/${ref.kind}/${ref.id}`;}
