import {existsSync} from 'node:fs';
import sharp from 'sharp';
import {Spotify,Demo,type Track} from './spotify';
import {ArtworkOverlay,overlayExecutable} from './overlay';
import type {Artwork} from './cover';
import {ListeningHistory} from './history';
import {albumTheme} from './theme';
import {FocusTimer} from './focus';

export async function runMini(args:string[]):Promise<never>{
  if(process.platform!=='darwin'||!existsSync(overlayExecutable))throw Error('The mini player requires macOS and npm run build:overlay.');
  const demo=args.includes('--demo'),backend=demo?new Demo():new Spotify();
  const focus=new FocusTimer();
  if(args.includes('--focus'))focus.start(Number(args[args.indexOf('--focus')+1]));
  const history=new ListeningHistory();await history.load();
  let track:Track={id:'',name:'Connecting to Spotify…',artist:'',album:'',artwork:'',duration:0,position:0,playing:false,volume:0,shuffle:false};
  let cover:Artwork|undefined,url='',closed=false,busy=false,queue=Promise.resolve();
  async function loadArtwork(next:string){
    if(next===url)return;url=next;cover=undefined;if(!next)return;
    try{
      if(new URL(next).protocol!=='https:')return;
      const response=await fetch(next,{signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('Artwork unavailable');
      const encoded=Buffer.from(await response.arrayBuffer());
      const palette=await sharp(encoded).resize(32,32,{fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
      if(!closed&&next===url)cover={encoded,palette};
    }catch{if(next===url)url='';}
  }
  async function poll(){
    if(busy||closed)return;busy=true;
    try{track=await backend.read();void loadArtwork(track.artwork);if(!demo)await history.record(track,cover);}
    catch(e){console.error(String(e));track={...track,playing:false};}
    finally{busy=false;}
  }
  const overlay=new ArtworkOverlay(true,event=>{
    if(event.command==='quit')return quit();
    if(event.command==='mini'){overlay.setMini(true);return;}
    if(event.command==='hide-mini'){
      // Without a menu icon there would be no way to reopen or quit the process.
      if(args.includes('--no-menubar'))return quit();
      overlay.setMini(false);return;
    }
    queue=queue.then(async()=>{if(closed)return;try{if(event.command==='seek')await backend.seek(event.position);else await backend.command(event.command);await poll();}catch(e){console.error(String(e));}});
  },{overlay:false,mini:true,menuBar:!args.includes('--no-menubar'),systemMedia:args.includes('--system-media')&&!demo});
  overlay.setTransitions(args.includes('--transitions'));
  const heartbeat=setInterval(()=>{
    if(!overlay.running){console.error('Native mini player stopped');quit(1);return;}
    if(focus.expired())queue=queue.then(async()=>{try{await backend.command('pause');await poll();}catch(e){console.error('Focus pause failed:',e);}});
    overlay.setTrack(track,cover);
    overlay.update(undefined,{cover:{x:0,y:0,width:0,height:0},anchor:{text:'',x:0,y:0},background:albumTheme(cover?.palette).bg},false);
  },200);
  const polling=setInterval(()=>void poll(),1000);
  function quit(code=0){closed=true;clearInterval(heartbeat);clearInterval(polling);overlay.close();process.exit(code);}
  process.on('SIGTERM',()=>quit());process.on('SIGINT',()=>quit());
  if(!args.includes('--no-autoplay'))try{await backend.command('play');}catch(e){console.error(String(e));}
  await poll();
  return await new Promise<never>(()=>{});
}
if(import.meta.main)await runMini(process.argv.slice(2));
