export type Track = { id: string; name: string; artist: string; album: string; artwork: string; duration: number; position: number; playing: boolean; volume: number; shuffle: boolean };
export type Command = 'play'|'pause'|'toggle'|'next'|'previous'|'shuffle'|'forward'|'back'|'louder'|'quieter';
const commands: Record<Command,string> = {
  play: 'play', pause:'pause', toggle: 'playpause', next: 'next track', previous: 'previous track',
  shuffle: 'set shuffling to not shuffling',
  forward: 'set player position to (player position + 10)',
  back: 'set player position to (max of {0, player position - 10})',
  louder: 'set sound volume to (sound volume + 5)', quieter: 'set sound volume to (sound volume - 5)',
};
async function osa(script: string, jxa = false) {
  const proc = Bun.spawn(['osascript', ...(jxa ? ['-l','JavaScript'] : []), '-e',script], {stdout:'pipe',stderr:'pipe'});
  const timeout = setTimeout(() => proc.kill(), 12000);
  try {
    const [out,err,code] = await Promise.all([new Response(proc.stdout).text(),new Response(proc.stderr).text(),proc.exited]);
    if(code !== 0) throw new Error(err.includes('1743') ? 'Allow your terminal to control Spotify in System Settings → Privacy & Security → Automation.' : (err.trim() || 'Spotify did not respond. Open Spotify and try again.'));
    return out.trim();
  } finally { clearTimeout(timeout); }
}
export class Spotify {
  async seek(position:number){
    if(!Number.isFinite(position)||position<0)throw new Error('Invalid playback position');
    const track=await this.read();
    return osa(`tell application "Spotify" to set player position to ${Math.min(position,track.duration).toFixed(3)}`);
  }
  async command(command: Command) {
    if(command === 'back') return osa('tell application "Spotify"\nset player position to my clampPosition(player position - 10)\nend tell\non clampPosition(p)\nif p < 0 then return 0\nreturn p\nend clampPosition');
    return osa(`tell application "Spotify" to ${commands[command]}`);
  }
  async read(): Promise<Track> {
    return JSON.parse(await osa(`const s = Application('com.spotify.client'); const t = s.currentTrack(); JSON.stringify({id:t.id(),name:t.name(),artist:t.artist(),album:t.album(),artwork:t.artworkUrl(),duration:t.duration()/1000,position:s.playerPosition(),playing:s.playerState()==='playing',volume:s.soundVolume(),shuffle:s.shuffling()});`,true));
  }
}
export class Demo {
  track: Track = {id:'demo',name:'Go To Town',artist:'Doja Cat',album:'Amala • Demo tape',artwork:'',duration:217,position:15,playing:true,volume:65,shuffle:false};
  last = Date.now();
  async seek(position:number){if(!Number.isFinite(position)||position<0)throw new Error('Invalid playback position');this.track.position=Math.min(position,this.track.duration);this.last=Date.now();}
  async read() { const now=Date.now(); if(this.track.playing) this.track.position=(this.track.position+(now-this.last)/1000)%this.track.duration; this.last=now; return {...this.track}; }
  async command(c: Command) { await this.read(); if(c==='toggle') this.track.playing=!this.track.playing; if(c==='play') this.track.playing=true; if(c==='pause') this.track.playing=false; if(c==='shuffle') this.track.shuffle=!this.track.shuffle; if(c==='next'||c==='previous') {this.track.name=this.track.name==='Go To Town'?'Roll With Us':'Go To Town';this.track.position=0;} if(c==='forward'||c==='back') this.track.position=Math.max(0,Math.min(this.track.duration,this.track.position+(c==='forward'?10:-10))); if(c==='louder'||c==='quieter')this.track.volume=Math.max(0,Math.min(100,this.track.volume+(c==='louder'?5:-5))); }
}
