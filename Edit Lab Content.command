#!/bin/bash
# Launches the local-only content editor. Keep this file in the repository root.
cd "$(dirname "$0")" || exit 1

PORT=8787
URL="http://localhost:$PORT/local-editor/admin.html"

if [ ! -f content.json ]; then
  echo "content.json not found. Move this launcher into the repository root (next to content.json) and try again."
  read -r -p "Press return to close."
  exit 1
fi

PY=$(command -v python3 || command -v python)
if [ -z "$PY" ]; then
  echo "Python is not installed. Install it from python.org, then run this again."
  read -r -p "Press return to close."
  exit 1
fi

echo "Serving $(pwd) at http://localhost:$PORT"
"$PY" -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
sleep 1
open "$URL"

echo
echo "Editor open in your browser."
echo "LEAVE THIS WINDOW OPEN while you work."
echo "Close it (or press Ctrl-C) when you are done."
trap 'kill $SERVER 2>/dev/null' EXIT
wait $SERVER
