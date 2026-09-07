import {formatRepeatBadge, type RepeatMode} from './repeat';
import {formatRemaining} from './remaining';
import {progressLabel} from './progress';

export type StatusBits = {
  demo?: boolean;
  notice?: string;
  overlay?: string;
  focus?: string;
  sleep?: string;
  pomodoro?: string;
  repeat?: RepeatMode;
  muted?: boolean;
  vim?: boolean;
  night?: boolean;
  shuffle?: boolean;
  favorite?: boolean;
  rating?: string;
  loop?: string;
  session?: string;
};

export function composeStatus(bits: StatusBits) {
  if (bits.notice) return bits.notice;
  const parts = [
    bits.focus,
    bits.sleep,
    bits.pomodoro,
    bits.repeat ? formatRepeatBadge(bits.repeat) : '',
    bits.muted ? 'mute' : '',
    bits.shuffle ? 'shuffle' : '',
    bits.vim ? 'vim' : '',
    bits.night ? 'night' : '',
    bits.favorite ? '♥' : '',
    bits.rating,
    bits.loop,
    bits.session,
    bits.overlay,
    bits.demo ? 'demo · no audio' : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function transportMeta(position: number, duration: number) {
  return `${progressLabel(position, duration)} ${formatRemaining(position, duration)}`;
}
