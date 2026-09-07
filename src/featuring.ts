export function splitArtists(artist:string):string[]{
  return artist.replace(/[()[\]{}]/g,' ')
    .split(/\s*(?:,|&|\b(?:featuring|feat|ft|and)\b\.?)\s*/i)
    .map(part=>part.trim())
    .filter(Boolean);
}
