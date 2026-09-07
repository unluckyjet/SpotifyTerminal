# spotterminal

A Spotify desktop remote for macOS, built with Anomaly's OpenTUI. Centered song, album, and artist names above a clean album cover, a thin progress line, timestamps, and three evenly spaced playback controls. The background, text, and accent colors are derived from the current album cover.

## Menu bar

While Spotterminal is running, its music-note icon appears in the macOS menu bar. Open it for current track details, play/pause, previous/next, shuffle, volume, and quit. These controls work without Accessibility permission. The native helper must be built (`npm run build:overlay`). Use `--no-menubar` to hide the icon; `--no-overlay` only disables the artwork overlay.

## System media controls

Run `spotterminal --system-media` to publish the current title, artist, album, artwork, progress, and playback state through macOS Now Playing, with play/pause, skip, and scrub controls routed to Spotify. This uses the public MediaPlayer API. macOS decides whether this session appears in Control Center, media-key controls, or a lock-screen surface; lock-screen presentation is not guaranteed. This mode is optional because Spotify already publishes its own system media session. It is disabled in silent demo mode.

## Run

```sh
spotterminal
spotterminal --demo
spotterminal --no-autoplay
spotterminal --no-overlay
```

The command resumes your Spotify session automatically. Spotify must be installed and signed in, with a track or playlist selected. On first use, macOS may ask whether your terminal can control Spotify: allow it. If denied, enable your terminal under System Settings → Privacy & Security → Automation → Spotify.

Audio plays through the Spotify desktop app and its selected output. No Spotify API keys are needed. Demo mode is silent. Missing artwork leaves the cover area empty. Artwork uses native Kitty/Sixel images where supported. On macOS terminals without image graphics, a borderless native helper draws the original cover over the terminal’s artwork area. It measures the visible progress bar through Accessibility so it can align to the character grid. It hides when focus, tab, title, or geometry no longer matches, and exits with the player. It never captures the screen or intercepts clicks.

On first use, press **O** and enable **Spotterminal Artwork** (or the terminal named in the macOS prompt) under **System Settings → Privacy & Security → Accessibility**. This permission lets the helper read the terminal’s window and character positions. Restart the player if macOS requests it. The terminal window title must be allowed to show the running program’s custom title. The overlay supports Terminal, iTerm2, Ghostty, Kitty, and WezTerm when they expose the necessary accessible text bounds; unsupported panes or terminals stay on the fallback. Use `--no-overlay` to keep everything inside the terminal.

The fallback uses **Chafa**, with full color, edge-matching characters, and no dithering. It is cached per cover and terminal size. While Chafa is loading, or if it cannot decode a cover, the player uses the smoothed quadrant renderer. Both use the complete cover without cropping. Enlarging the window or reducing the terminal font size increases fallback detail. Use a true-color terminal at least 32 columns by 16 rows; 80 × 30 is recommended.

| Control | Action |
| --- | --- |
| Space | Play / pause |
| Tab | Toggle fullscreen artwork |
| H | Browse local listening history |
| T | Toggle optional cover/color transitions |
| Left / Right | Previous / next track |
| Up / Down | Seek forward / backward 10 seconds |
| + / - | Volume |
| S | Shuffle |
| O | Request native overlay permission |
| Q / Ctrl-C | Exit, leaving music playing |

The three playback controls also accept mouse clicks. Keyboard shortcuts remain available without taking up space in the interface.

## Install

Requires Node.js 20.9 or newer, npm, and macOS for live playback. Bun is installed locally by npm. Building the optional native overlay also requires the Xcode Command Line Tools (`xcode-select --install`).

```sh
git clone https://github.com/unluckyjet/SpotifyTerminal.git
cd SpotifyTerminal
npm ci
npm run build:overlay
npm link --prefix "$HOME/.local"
spotterminal
```

Skip `npm run build:overlay` and run `spotterminal --no-overlay` if you only want the terminal renderer. The native `.app` is built locally for your Mac; it is not stored in the repository.

Ensure `~/.local/bin` is on PATH. Keep this project folder in place while its command is linked. Demo mode can run on other OpenTUI-supported operating systems.

## Fullscreen artwork

Press **Tab** or launch with `--fullscreen` to give the cover most of the window. Transport controls fade from view after a short idle period and return on keyboard or mouse activity. A thin progress line stays visible. The image remains static.

## Listening history

Press **H** to browse the most recent 200 distinct tracks with **Left/Right**. Press **H** or **Escape** to return to the player. Music keeps playing while browsing. Metadata and album covers are saved only on your computer under `~/Library/Application Support/Spotterminal` (or `$XDG_DATA_HOME/Spotterminal`). Set `SPOTTERMINAL_DATA_DIR` to choose another location. Demo playback is not recorded.

## Transitions

Transitions are off by default. Press **T** or use `--transitions` for a short crossfade between album covers and their color themes. The native artwork overlay uses the same setting.

## Development

```sh
npm run build:overlay  # macOS; requires Xcode Command Line Tools
npm test
npm run test:overlay
npm run typecheck
npm run demo
```

`native/ArtworkOverlay.swift` implements the macOS overlay, `src/overlay.ts` manages its lifecycle, and `src/chafa.ts` provides the portable artwork renderer.

`src/spotify.ts` contains the AppleScript/JXA desktop adapter and demo transport. `src/ui.ts` renders the interface using native OpenTUI text renderables and native album images. `src/index.ts` owns polling, artwork decoding, keyboard events, and lifecycle cleanup.

Built with [OpenTUI](https://github.com/anomalyco/opentui), [Chafa](https://github.com/hpjansson/chafa) through [chafa-wasm](https://github.com/hectorm/chafa-wasm), and [sharp](https://github.com/lovell/sharp).

The native overlay is experimental. Its geometry and image drawing have been tested independently; alignment across live terminal profiles and apps still needs on-device verification. Chafa remains available if the overlay cannot attach.
