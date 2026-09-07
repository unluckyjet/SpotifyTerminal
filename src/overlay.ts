import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import type {Artwork} from './cover';
import type {Track} from './spotify';
import {albumTheme} from './theme';
import {nativeCommand,type NativeCommand} from './native-commands';

export type OverlayLayout = {
  cover: {x:number;y:number;width:number;height:number};
  anchor: {text:string;x:number;y:number};
  background: string;
};
type Reply = {visible:boolean;reason:string;key:string};
export const overlayExecutable=fileURLToPath(new URL('../native/Spotterminal Artwork.app/Contents/MacOS/SpotterminalArtwork',import.meta.url));

export class ArtworkOverlay {
  readonly token=`spotterminal-${crypto.randomUUID().slice(0,8)}`;
  private process: ReturnType<typeof Bun.spawn> | null = null;
  private lastImage?:Buffer;
  private generation=0;
  private lastKey='';
  private lastSent=0;
  private lastReply=0;
  private stopped=false;
  private reply:Reply={visible:false,reason:'starting',key:''};
  private failure='';
  private transitions=false;
  setMini(value:boolean){this.options.mini=value;this.lastSent=0;}
  get mini(){return this.options.mini===true;}
  get running(){return this.process!==null&&!this.stopped;}
  setTransitions(value:boolean){this.transitions=value;}
  private track?:Track;
  private playbackArtwork?:Artwork;
  private lastPlaybackImage?:Buffer;
  setTrack(track:Track,artwork?:Artwork){this.track=track;this.playbackArtwork=artwork;}

  constructor(enabled:boolean,private onCommand?:(command:NativeCommand)=>void,private options:{overlay?:boolean;menuBar?:boolean;systemMedia?:boolean;mini?:boolean}={}){
    if(!enabled||process.platform!=='darwin'){this.failure='disabled';return;}
    if(!existsSync(overlayExecutable)){this.failure='missing';return;}
    try{
      const child=Bun.spawn([overlayExecutable],{stdin:'pipe',stdout:'pipe',stderr:'ignore'});
      this.process=child;
      void this.readReplies(child.stdout as ReadableStream<Uint8Array>);
      void child.exited.then(()=>{this.process=null;if(!this.stopped)this.failure='stopped';});
    }catch{this.failure='stopped';}
  }

  private async readReplies(stream:ReadableStream<Uint8Array>){
    const reader=stream.getReader(),decoder=new TextDecoder();let pending='';
    try{
      while(true){const {done,value}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});
        let index:number;
        while((index=pending.indexOf('\n'))>=0){
          const line=pending.slice(0,index);pending=pending.slice(index+1);
          try{const result=JSON.parse(line);const command=nativeCommand(result);if(command){this.onCommand?.(command);continue;}if(typeof result.visible==='boolean'&&typeof result.reason==='string'&&typeof result.key==='string'){this.reply=result;this.lastReply=Date.now();}}catch{}
        }
      }
    }catch{ /* A failed helper leaves the terminal renderer active. */ }
    finally{reader.releaseLock();}
  }

  update(artwork:Artwork|undefined,layout:OverlayLayout|undefined,wantsOverlay:boolean){
    if(!this.process||this.stopped)return false;
    const changedImage=this.lastImage!==artwork?.encoded;
    if(changedImage){this.lastImage=artwork?.encoded;this.generation++;}
    const enabled=!!artwork&&!!layout&&wantsOverlay&&this.options.overlay!==false;
    const key=JSON.stringify([this.generation,enabled,layout?.cover,layout?.anchor]);
    const now=Date.now();
    if(key!==this.lastKey||now-this.lastSent>400){
      this.lastKey=key;this.lastSent=now;
      const empty={cover:{x:0,y:0,width:0,height:0},anchor:{text:'',x:0,y:0},background:'#000000'};
      const playbackImage=this.playbackArtwork?.encoded;
      const changedPlayback=this.lastPlaybackImage!==playbackImage;this.lastPlaybackImage=playbackImage;
      const payload={playbackBackground:albumTheme(this.playbackArtwork?.palette).bg,mini:this.mini,transitions:this.transitions,clearPlaybackImage:!playbackImage,...(changedPlayback&&playbackImage?{playbackImage:playbackImage.toString('base64')}:{ }),key,enabled,token:this.token,track:this.track,systemMedia:this.options.systemMedia===true,menuBar:this.options.menuBar!==false,clearImage:!artwork,...(layout??empty),...(changedImage&&artwork?{image:artwork.encoded.toString('base64')}:{})};
      try{const stdin=this.process.stdin;if(stdin&&typeof stdin!=='number'){stdin.write(JSON.stringify(payload)+'\n');stdin.flush();}}catch{this.failure='stopped';}
    }
    return this.reply.visible&&this.reply.key===key&&now-this.lastReply<1500;
  }

  get note(){
    if(this.failure==='missing')return 'Artwork overlay: run npm run build:overlay';
    if(this.reply.reason==='accessibility')return 'O enable artwork overlay · using Chafa';
    return '';
  }

  requestAccess(){
    if(!existsSync(overlayExecutable)||process.platform!=='darwin')return;
    Bun.spawn([overlayExecutable,'--request-accessibility'],{stdin:'ignore',stdout:'ignore',stderr:'ignore'});
  }

  close(){
    this.stopped=true;
    if(this.process){
      const child=this.process;
      try{const stdin=child.stdin;if(stdin&&typeof stdin!=='number')stdin.end();}catch{}
      setTimeout(()=>{try{child.kill();}catch{}},500).unref();
    }
  }
}
