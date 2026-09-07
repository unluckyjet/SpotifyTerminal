import {createCliRenderer} from '@opentui/core';
import sharp from 'sharp';
import {Spotify,Demo,type Command,type Track} from './spotify';
import {PlayerUI} from './ui';
import type {Artwork} from './cover';
import {ArtworkOverlay} from './overlay';
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('spotterminal [--demo] [--no-autoplay] [--no-overlay] [--no-menubar]\nSpace: play/pause | Left/Right: skip | Up/Down: seek 10s\nS: shuffle | +/-: volume | O: enable overlay | Q: quit (music continues)');process.exit(0);}
const demo=args.includes('--demo');
if(!demo&&process.platform!=='darwin'){console.error('Live playback requires Spotify for macOS. Try spotterminal --demo.');process.exit(1);}
const backend=demo?new Demo():new Spotify();
const renderer=await createCliRenderer({exitOnCtrlC:false,useMouse:true});
let track:Track={id:'',name:'Connecting to Spotify…',artist:'',album:'',artwork:'',duration:0,position:0,playing:false,volume:0,shuffle:false};
let status='',cover:Artwork|undefined,artUrl='',closed=false,busy=false;
async function artwork(url:string){
  if(url===artUrl)return;
  artUrl=url;cover=undefined;
  if(!url)return;
  try{
    const u=new URL(url);if(u.protocol!=='https:')return;
    const res=await fetch(u,{signal:AbortSignal.timeout(6000)});
    if(!res.ok)throw Error('Artwork unavailable');
    const encoded=Buffer.from(await res.arrayBuffer());
    const palette=await sharp(encoded).resize(32,32,{fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
    if(!closed && url===artUrl)cover={encoded,palette};
  }catch{
    // Permit the next poll to retry a transient artwork failure.
    if(url===artUrl)artUrl='';
  }
}
async function poll(){if(busy||closed)return;busy=true;try{track=await backend.read();status='';void artwork(track.artwork);}catch(e){status=e instanceof Error?e.message:String(e);track.playing=false;}finally{busy=false;}}
let queue=Promise.resolve();
const action=(c:Command)=>{queue=queue.then(async()=>{if(closed)return;try{await backend.command(c);await poll();}catch(e){status=e instanceof Error?e.message:String(e);}});};
const overlay=new ArtworkOverlay(true,event=>{if(event.command==='quit')quit();else if(event.command!=='seek')action(event.command);},{overlay:!args.includes('--no-overlay'),menuBar:!args.includes('--no-menubar')});
renderer.setTerminalTitle(overlay.token);
const ui=new PlayerUI(renderer,action,overlay);
const animation=setInterval(()=>{if(!closed){overlay.setTrack(track);ui.draw(track,cover,demo,status);}},100);
const polling=setInterval(()=>void poll(),1000);
function quit(){closed=true;overlay.close();clearInterval(animation);clearInterval(polling);renderer.destroy();process.exit(0);}
renderer.keyInput.on('keypress',key=>{if(key.name==='q'||(key.ctrl&&key.name==='c'))return quit();if(key.name==='o'){overlay.requestAccess();return;}const keys:Record<string,Command>={space:'toggle',right:'next',left:'previous',up:'forward',down:'back',s:'shuffle','+':'louder','=':'louder','-':'quieter'};const c=keys[key.name]??keys[key.sequence];if(c)action(c);});
process.on('SIGTERM',quit);process.on('SIGINT',quit);
ui.draw(track,cover,demo,status);
if(!args.includes('--no-autoplay'))action('play');else void poll();
