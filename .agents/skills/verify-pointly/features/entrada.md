# Entrada (join)

## Sub-features

- Create room (mode "Create room") with a nickname and optional avatar.
- Join with code (mode "Join with code") via the 4-char OTP field or a `/join?code=<CODE>` link.
- Spectate checkbox (join as non-voting spectator).
- Nickname validation (2–20 chars, no double/edge spaces) and code validation (A–Z, 0–9), errors inline.

## How to get to it (user POV)

Open `/join` (or click "Entrar com código" / "Enter with code" in the header). Pick a mode, type a nickname, optionally a photo; submit sends you to `/s/<CODE>`.

## Driving it

```
browser.open { url: "http://localhost:5173/join", viewport: "desktop" }
browser.type { selector: "#nick", value: "Verifier" }
browser.click { selector: "button[type=\"submit\"]" }        // "Create room" submit
// Join instead:
browser.open { url: "http://localhost:5173/join?code=<CODE>" }
browser.type { selector: "#code", value: "<CODE>" }          // OTPField, 4 chars
```

Confirm navigation by URL changing to `http://localhost:5173/s/<CODE>` and `[data-testid="sala-code"]` showing the code.

## Gotchas

- The mode switch labels ("Create room" / "Join with code") duplicate the submit button's text — click the submit by `selector: "button[type=\"submit\"]"`, not by text.
- App language follows the browser locale; toggle via the header button if the expected copy is pt-BR and you see English (or vice versa).
- Nick/avatar persist on the device, so a fresh `/join` may prefill them.
