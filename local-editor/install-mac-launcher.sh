#!/bin/bash
# Builds "Edit Lab Content.app" on your Desktop.
# Run once:  bash "/path/to/repo/local-editor/install-mac-launcher.sh"
set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/Desktop/Edit Lab Content.app"

if [ ! -f "$REPO/content.json" ]; then
  echo "Could not find content.json in $REPO"
  echo "This script must stay inside the repository's local-editor folder."
  exit 1
fi

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Edit Lab Content</string>
  <key>CFBundleIdentifier</key><string>ca.hielab.contenteditor</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleExecutable</key><string>launcher</string>
  <key>CFBundleIconFile</key><string>appicon</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
PLIST

cat > "$APP/Contents/MacOS/launcher" <<LAUNCHER
#!/bin/bash
REPO="$REPO"
PORT=8787
cd "\$REPO" || exit 1
PY=\$(command -v python3 || command -v python)
if [ -z "\$PY" ]; then
  osascript -e 'display alert "Python not found" message "Install Python from python.org, then click the icon again."'
  exit 1
fi
if ! curl -s -o /dev/null "http://127.0.0.1:\$PORT/content.json"; then
  "\$PY" -m http.server "\$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:\$PORT/local-editor/admin.html"
LAUNCHER

chmod +x "$APP/Contents/MacOS/launcher"

# Optional: lab logo as the app icon, if the tools are available.
SRC="$REPO/assets/images/logo-colour-logomark.svg"
if [ -f "$SRC" ] && command -v sips >/dev/null && command -v iconutil >/dev/null; then
  TMP=$(mktemp -d)
  if sips -s format png "$SRC" --out "$TMP/base.png" >/dev/null 2>&1; then
    mkdir -p "$TMP/appicon.iconset"
    for S in 16 32 128 256 512; do
      sips -z $S $S "$TMP/base.png" --out "$TMP/appicon.iconset/icon_${S}x${S}.png" >/dev/null 2>&1
      sips -z $((S*2)) $((S*2)) "$TMP/base.png" --out "$TMP/appicon.iconset/icon_${S}x${S}@2x.png" >/dev/null 2>&1
    done
    iconutil -c icns "$TMP/appicon.iconset" -o "$APP/Contents/Resources/appicon.icns" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP"
fi

touch "$APP"
echo
echo "Done. \"Edit Lab Content\" is on your Desktop."
echo "First click: macOS may ask to confirm — right-click the icon, choose Open, then Open again."
