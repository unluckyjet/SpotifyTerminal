export function shareText(track:{name:string;artist:string;album:string}):string{
  const line=`${track.name} — ${track.artist}`;
  return track.album?`${line} (${track.album})`:line;
}
export function shareUrl(id:string):string{
  if(id.startsWith('spotify:')||id.startsWith('https://'))return id;
  if(id.includes('track:'))return `https://open.spotify.com/track/${id.slice(id.indexOf('track:')+6)}`;
  return `https://open.spotify.com/track/${id.replace(/^spotify:track:/,'')}`;
}
