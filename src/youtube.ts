export function youtubeSearchUrl(track:{name:string;artist:string}):string{
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.name}`)}`;
}
