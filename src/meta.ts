export type TrackMeta={albumArtist?:string;discNumber?:number;trackNumber?:number;popularity?:number;starred?:boolean;spotifyUrl?:string};

export function parseTrackMeta(raw:unknown):TrackMeta{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const o=raw as Record<string,unknown>;
  const meta:TrackMeta={};
  if(typeof o.albumArtist==='string')meta.albumArtist=o.albumArtist;
  if(typeof o.discNumber==='number'&&Number.isFinite(o.discNumber))meta.discNumber=o.discNumber;
  if(typeof o.trackNumber==='number'&&Number.isFinite(o.trackNumber))meta.trackNumber=o.trackNumber;
  if(typeof o.popularity==='number'&&Number.isFinite(o.popularity))meta.popularity=o.popularity;
  if(typeof o.starred==='boolean')meta.starred=o.starred;
  if(typeof o.spotifyUrl==='string')meta.spotifyUrl=o.spotifyUrl;
  return meta;
}

export function formatTrackMeta(meta:TrackMeta){
  const parts:string[]=[];
  if(meta.albumArtist)parts.push(meta.albumArtist);
  const nums:number[]=[];
  if(meta.trackNumber!==undefined)nums.push(meta.trackNumber);
  if(meta.discNumber!==undefined)nums.push(meta.discNumber);
  if(nums.length)parts.push(nums.join('/'));
  if(meta.popularity!==undefined)parts.push(`pop ${meta.popularity}`);
  if(meta.starred)parts.push('★');
  if(meta.spotifyUrl)parts.push(meta.spotifyUrl);
  return parts.join(' · ');
}
