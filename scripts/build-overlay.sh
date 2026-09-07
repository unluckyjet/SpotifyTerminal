#!/bin/sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
app_dir="$project_dir/native/Spotterminal Artwork.app"
mkdir -p "$app_dir/Contents/MacOS"
module_cache="${TMPDIR:-/tmp}/spotterminal-swift-cache"
mkdir -p "$module_cache"
source_dir=$(mktemp -d "${TMPDIR:-/tmp}/spotterminal-build.XXXXXX")
trap 'rm -rf "$source_dir"' EXIT
cp "$project_dir/native/ArtworkOverlay.swift" "$source_dir/main.swift"
swiftc -O -module-cache-path "$module_cache" "$source_dir/main.swift" "$project_dir/native/MiniPlayer.swift" -o "$app_dir/Contents/MacOS/SpotterminalArtwork" -framework AppKit -framework ApplicationServices -framework MediaPlayer
cat > "$app_dir/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.spotterminal.artwork</string>
<key>CFBundleName</key><string>Spotterminal Artwork</string>
<key>CFBundleExecutable</key><string>SpotterminalArtwork</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSUIElement</key><true/>
<key>NSAccessibilityUsageDescription</key><string>Align album artwork with your terminal window.</string>
</dict></plist>
PLIST
codesign --force --sign - --identifier com.spotterminal.artwork "$app_dir"
