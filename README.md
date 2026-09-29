# Prompt Prefix Injector

A tiny Chrome extension that adds a floating **"🧩 Add Prompt"** button on top of popular AI chat sites (ChatGPT, Claude, Gemini, Perplexity, Grok). Click it, pick a saved persona/prefix, and it gets inserted at the very beginning of the text box you last clicked into — no copy-pasting required.

Useful if you keep reusing the same "You are a senior software architect, answer concisely..." style system-prompt prefixes across different AI chat websites.

## What it does

- Injects a small floating button (bottom-right corner) on:
  - `chatgpt.com` / `chat.openai.com`
  - `claude.ai`
  - `gemini.google.com`
  - `www.perplexity.ai`
  - `grok.com`
- Clicking the button opens a menu of your saved prefixes.
- Clicking a prefix **prepends** its text to whatever input field you last focused (a `<textarea>`, an `<input>`, or a rich-text/`contenteditable` box like ChatGPT's or Claude's message composer).
- A popup (opened from the extension's toolbar icon) lets you **add, edit, and delete** prefixes. Everything is saved locally via `chrome.storage.local` — nothing is sent anywhere.
- Comes with three example prefixes out of the box (Economist, Software Architect, Critical Analyst) that you can edit or delete freely.

## How it works (technical notes)

- **Manifest V3** extension, only requests the `storage` permission.
- `content.js` is injected on the matched sites and:
  - Renders the floating button + dropdown menu via plain DOM APIs (no framework).
  - For `<textarea>`/`<input>` fields, it uses the native property setter (`HTMLTextAreaElement.prototype.value` / `HTMLInputElement.prototype.value`) plus a dispatched `input` event, so React-controlled inputs (like ChatGPT's) correctly pick up the change.
  - For `contenteditable` fields (like Claude's ProseMirror-based composer), it uses `document.execCommand('insertText', ...)` after moving the cursor to the start, so the site's own editor framework sees a native input event.
  - Preserves the input field's focus when you click the floating button (`mousedown` is prevented from stealing focus).
- `popup.html` / `popup.js` provide a simple CRUD UI for the saved prefixes, stored under the `promptPrefixes` key in `chrome.storage.local`.

## Installation (load as an unpacked extension)

This extension is not published on the Chrome Web Store — you load it directly from this folder. Takes about a minute:

1. **Download/clone this repository** to your computer.
   ```bash
   git clone https://github.com/kutyaroztas/prompt-prefix-extension.git
   ```
2. Open Chrome and go to `chrome://extensions`.
3. In the top-right corner, turn on **Developer mode** (toggle switch).
4. Click the **"Load unpacked"** button that appears.
5. In the file picker, select the `prompt-prefix-extension` folder you just downloaded/cloned (the folder that directly contains `manifest.json`).
6. The extension should now appear in your extensions list as **"Prompt Prefix Injector"**. Pin it to your toolbar (puzzle-piece icon → pin) for easy access.
7. Visit any of the supported sites (e.g. `https://chatgpt.com`) and refresh the page if it was already open. You should see a blue **"🧩 Add Prompt"** button in the bottom-right corner.

### Editing your saved prefixes

1. Click the extension's icon in the Chrome toolbar (top-right of the browser) to open the popup.
2. Edit the label/text of an existing prefix, click **"+ New Prefix"** to add another, or **"Sil" (Delete)** to remove one.
3. Click **"Kaydet" (Save)** to persist your changes.

### Using it

1. Go to a supported chat site and click inside the message box you normally type in.
2. Click the floating **"🧩 Add Prompt"** button.
3. Pick a prefix from the menu — its text is inserted at the start of the message box, right before whatever you had already typed.
4. Continue typing your actual question/request after the inserted prefix, then send as usual.

## Troubleshooting

- **Nothing happens when I click a prefix**: Make sure you clicked *inside* the chat's text box first (so it has keyboard focus) before clicking the floating button. The extension inserts text into whichever field was last focused.
- **Button doesn't appear on a site**: This extension only runs on the domains listed in `manifest.json` under `matches`. Other sites are not supported by default (see "Adding more sites" below).
- **"Odaklanilan alan bir metin kutusu gibi gorunmuyor" alert**: This means the currently focused element isn't a normal text field or `contenteditable` region the extension recognizes — click directly into the chat input box and try again.
- **After updating the code**: Go to `chrome://extensions`, find "Prompt Prefix Injector", and click the reload icon (circular arrow) to pick up your changes, then refresh the target site's tab.

## Adding more sites

Edit the `matches` array inside `manifest.json` (under `content_scripts`) and add the URL pattern for the site you want, e.g. `"https://example.com/*"`. Then reload the extension from `chrome://extensions`.

## Privacy

All data (your saved prefixes) stays in your browser's local storage (`chrome.storage.local`). The extension makes no network requests and does not collect or transmit any data.

## License

No license specified. All rights reserved by the author unless stated otherwise.
