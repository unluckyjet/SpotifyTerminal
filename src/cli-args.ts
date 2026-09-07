import {parseRepeatFlag, type RepeatMode} from './repeat';
import {parseVolume} from './parse-volume';

export type CliOptions = {
  demo: boolean;
  autoplay: boolean;
  overlay: boolean;
  menubar: boolean;
  systemMedia: boolean;
  fullscreen: boolean;
  transitions: boolean;
  mini: boolean;
  focus?: number;
  lyrics?: string;
  once: boolean;
  json: boolean;
  repeat?: RepeatMode;
  sleep?: number;
  night: boolean;
  highContrast: boolean;
  mono: boolean;
  vim: boolean;
  compact: boolean;
  pomodoro: boolean;
  notify: boolean;
  statusFile: boolean;
  volume?: number;
};

function flagValue(args: string[], name: string) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) return undefined;
  return v;
}

export function parseCliOptions(args: string[]): CliOptions {
  const focusRaw = flagValue(args, '--focus');
  const sleepRaw = flagValue(args, '--sleep');
  const lyrics = flagValue(args, '--lyrics');
  const repeatRaw = flagValue(args, '--repeat');
  const volumeRaw = flagValue(args, '--volume');
  return {
    demo: args.includes('--demo'),
    autoplay: !args.includes('--no-autoplay'),
    overlay: !args.includes('--no-overlay'),
    menubar: !args.includes('--no-menubar'),
    systemMedia: args.includes('--system-media'),
    fullscreen: args.includes('--fullscreen'),
    transitions: args.includes('--transitions'),
    mini: args.includes('--mini'),
    focus: focusRaw !== undefined ? Number(focusRaw) : undefined,
    lyrics,
    once: args.includes('--once'),
    json: args.includes('--json'),
    repeat: repeatRaw !== undefined ? parseRepeatFlag(repeatRaw) : undefined,
    sleep: sleepRaw !== undefined ? Number(sleepRaw) : undefined,
    night: args.includes('--night'),
    highContrast: args.includes('--high-contrast'),
    mono: args.includes('--mono'),
    vim: args.includes('--vim'),
    compact: args.includes('--compact'),
    pomodoro: args.includes('--pomodoro'),
    notify: args.includes('--notify'),
    statusFile: args.includes('--status-file'),
    volume: volumeRaw !== undefined ? parseVolume(volumeRaw) : undefined,
  };
}
