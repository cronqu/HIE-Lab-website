# Content editor — local only

This folder is **not** published. Keep it off GitHub; the editor is never reachable
from charleneronquillo.com.

## Folder setup

Put the editor folder inside a folder that also holds the two site data files:

```
your-folder/
  content.json
  publications.json
  local-editor/
    admin.html
    README.md
```

The editor reads `../content.json` and `../publications.json`, so those two files
must sit one level above `admin.html`.

## Editing the site content

1. Open Terminal and go to the outer folder (type `cd ` then drag the folder in):
   `cd your-folder`
2. Start a small web server:
   `python3 -m http.server 8000`
3. Open `http://localhost:8000/local-editor/admin.html`
4. Passphrase: **Qf\&$Eng5!#X**
5. Make your edits, click **Download content.json**
6. Press Control-C in Terminal to stop the server when done

## Publishing the changes

On github.com, open `content.json` on the `main` branch, click the pencil icon,
select all, paste in the downloaded file, and commit. The live site picks it up
on the next load.

Then replace the `content.json` in your local folder with the downloaded one, so
the editor starts from what is live next time.

## Desktop launcher

The editor needs a local web server — double-clicking `admin.html` will not work (it cannot read `../content.json` over `file://`).

Two launchers sit in the repository root:

- macOS — `Edit Lab Content.command`
- Windows — `Edit Lab Content.bat`

They serve the repository folder at `http://localhost:8787` and open the editor. Leave the terminal window open while editing; closing it stops the server.

**macOS — clickable Desktop app.** Open Terminal, paste this once, press return:

    bash "/path/to/repo/local-editor/install-mac-launcher.sh"

That builds **Edit Lab Content.app** on your Desktop (lab logomark as its icon). Clicking it starts the server in the background and opens the editor — no terminal window. On the very first click, right-click the icon → *Open* → *Open* to clear Gatekeeper.

Rebuild the app by running the same line again if you move the repository folder.

`Edit Lab Content.command` is the manual alternative: `chmod +x` it, then alias it to the Desktop.

**Windows:** right-click `Edit Lab Content.bat` → *Send to* → *Desktop (create shortcut)*.

Requires Python (preinstalled on macOS; on Windows install from python.org).
