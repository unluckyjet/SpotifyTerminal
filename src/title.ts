function clean(value:string){
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g,'');
}

export function windowTitle(track:{name:string;artist:string},token:string):string{
  const suffix=` · ${clean(token)}`;
  const prefix=`${clean(track.name)} — ${clean(track.artist)}`;
  // Clip the track prefix so the overlay token still fits in 80.
  const room=Math.max(0,80-Array.from(suffix).length);
  return Array.from(prefix).slice(0,room).join('')+Array.from(suffix).slice(0,80).join('');
}
