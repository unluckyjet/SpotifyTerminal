export const HELP_TEXT = `spotterminal [--demo] [--no-autoplay] [--no-overlay] [--no-menubar] [--system-media] [--fullscreen] [--transitions] [--mini] [--focus minutes] [--lyrics file.lrc] [--version] [--once] [--json] [--repeat off|context|track] [--sleep minutes] [--night] [--high-contrast] [--mono] [--vim] [--compact] [--pomodoro] [--notify] [--status-file] [--volume 0-100]
Space: play/pause | Left/Right: skip | Up/Down: seek 10s
/: commands | M: mini player | F: focus | L/I: lyrics/import | P: postcard | H: history | Tab: fullscreen | S: shuffle | +/-: volume | O: enable overlay | Q: quit (music continues)
R: repeat | U: mute | B: bookmark | A: A-B loop | .: replay | 0-9: jump | ?: cheat sheet | Z: sleep | G: favorite | E: export history | N: night | C: contrast | Y: share | V: vim | W: wrapped | X: block | J: pomodoro | K: metadata | D: charts`;

export function helpText() {
  return HELP_TEXT;
}

export function wantsHelp(args: string[]) {
  return args.includes('--help') || args.includes('-h');
}

export function wantsVersion(args: string[]) {
  return args.includes('--version') || args.includes('-v');
}
