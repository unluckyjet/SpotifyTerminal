export class VolumeLock {
  locked=false;
  toggle(){this.locked=!this.locked;return this.locked;}
  allow(command:string){return !this.locked||(command!=='louder'&&command!=='quieter');}
}
