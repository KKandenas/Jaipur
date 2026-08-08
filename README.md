# Jaipur

Play the 2-player card game **Jaipur** against a friend on a separate device,
synced live through Firebase. Two implementations live in this repo:

- **`web/`** - a PWA (installable web app) that runs in Safari on iPhone/iPad
  (or any browser), deployed automatically to GitHub Pages by a workflow in
  this repo. **This is the one to use if you don't have a Mac** - no Xcode,
  no Apple Developer account, nothing to build locally. Start here.
- **`JaipurKit` / `JaipurApp`** - a native SwiftUI app for iOS/iPadOS. Requires
  a Mac with Xcode to build, and an Apple Developer account to install on a
  real device. Kept in the repo as an optional future upgrade path (see
  [Native iOS app](#native-ios-app-optional-requires-a-mac) below) - not the
  recommended path given no Mac access.

## Quick start (web app, no Mac needed)

1. **Create a Firebase project** (free tier is plenty) - see
   [Firebase setup](#firebase-setup) below.
2. **Add the config as GitHub Actions secrets** on this repo (Settings →
   Secrets and variables → Actions) - six `VITE_FIREBASE_*` values, see
   below.
3. **Turn on GitHub Pages**: Settings → Pages → Source → **GitHub Actions**.
   (I can't flip this toggle myself - it's an admin-only repo setting.)
4. Push to `main`. The `Deploy web app to GitHub Pages` workflow
   (`.github/workflows/deploy-web.yml`) builds `web/` and publishes it to
   `https://<you>.github.io/Jaipur/`.
5. Open that URL in Safari on your iPhone/iPad, tap **Share → Add to Home
   Screen** to make it feel like an installed app.

No local install is required to *use* the app, but if you want to develop it
locally: `cd web && npm install && npm run dev` (needs a `web/.env` - copy
`web/.env.example` and fill in the same Firebase values).

## Status - what's actually been verified

Unlike the native app below, **the web app has been built, type-checked, unit
tested, and smoke-tested in a real headless browser** in the environment this
was written in (no Mac needed for any of that - it's all just Node.js):

- `cd web && npm test` → 31/31 rules-engine tests passing (deck composition,
  every action type, round/game-end conditions, scoring).
- `npm run build` → production build succeeds, output verified under a
  `/Jaipur/` base path.
- A Playwright smoke test caught and fixed two real bugs before you ever saw
  them: the app going fully blank (no error shown) when Firebase isn't
  configured yet, and a naive re-render approach that would have kicked the
  on-screen keyboard away after every single keystroke while typing your
  name. Both are fixed - typing a multi-word name now works fine, and a
  missing Firebase config now shows a clear message instead of a blank page.
- The generated PNG app icons were round-tripped through a real decoder
  (Pillow) to confirm they're valid, not just correctly-named files.

What's **not** verified: the actual multiplayer flow end-to-end against a
real Firebase project (this environment has no Firebase credentials to test
with), and how it looks/feels on a physical iPhone/iPad screen. Test that
part after you've done the Firebase setup below.

The **goods-token values** (`web/src/engine/tokenBank.ts`,
`JaipurKit/Sources/JaipurKit/TokenBank.swift`) are confirmed against the
physical game's component list: 38 tokens total - 5 diamond (7,7,5,5,5),
5 gold (6,6,5,5,5), 5 silver (5,5,5,5,5), 7 cloth (5,3,3,2,2,1,1), 7 spice
(5,3,3,2,2,1,1), 9 leather (4,3,2,1,1,1,1,1,1). Deck composition, the
5-point camel bonus, the 7-card hand limit, the "sell at least 2" rule for
diamond/gold/silver, and "first to 2 round wins" are confirmed the same way
(see [Rules reference](#rules-reference-implemented)).

The **18 bonus-sale tokens** (`web/src/engine/bonusTokenBank.ts`,
`JaipurKit/Sources/JaipurKit/BonusTokenBank.swift`) are confirmed against the
physical game's component list: 6 tokens per tier, two of each value -
3-card sale 6×[3,3,2,2,1,1], 4-card sale 6×[6,6,5,5,4,4], 5-or-more-card sale
6×[10,10,9,9,8,8]. A bonus token's value is secret until the round ends: the
web app hides it behind a "?" chip the instant it's won, and only lets the
player who won it flip each one over (locally, on their own screen) once the
round-end screen appears - matching how the physical tokens are kept face
down until the round's scoring reveal.

Card, card-back, and token artwork (`web/src/assets/`) is original artwork
supplied for this project - not reproductions of the publisher's cards, so
there's no copyright concern reproducing it here. Camel's card art has no
matching token (camels aren't a sellable good, so there never was one to
crop). To swap in different art later, replace the files under
`web/src/assets/` and update the imports in `web/src/ui/goodStyle.ts` - the
rest of the UI (`CardView`, `TokenChip`, etc.) just reads from there.

## Firebase setup

You said no Firebase project exists yet:

1. Go to the [Firebase console](https://console.firebase.google.com) and
   create a new project (Analytics is optional).
2. **Authentication → Sign-in method → Anonymous** → enable. The app signs
   each browser in anonymously; there's no account system to manage.
3. **Firestore Database** → create (production mode - `firebase/firestore.rules`
   locks it down).
4. **Project settings → Your apps → Add app → Web** (the `</>` icon, not iOS).
   Register it (nickname doesn't matter, skip hosting setup). Copy the six
   values from the shown `firebaseConfig` object:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`.
5. Put those six values in two places:
   - **Locally**: `web/.env` (copy from `web/.env.example`), for `npm run dev`.
   - **GitHub Actions**: repo Settings → Secrets and variables → Actions →
     New repository secret, one per value, named exactly
     `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
     `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
     `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. The deploy
     workflow reads these at build time.

   (A Firebase web config isn't a secret the way a server API key is - it
   only identifies which project to talk to, and real access control lives in
   `firestore.rules`. Using GitHub secrets here is just a convenient way to
   inject per-environment values into the build, not because leaking it would
   be dangerous.)
6. Deploy the security rules with the [Firebase CLI](https://firebase.google.com/docs/cli):
   ```sh
   cd firebase
   firebase login
   firebase use --add        # pick the project you just created
   firebase deploy --only firestore
   ```

## Architecture (web app)

```
 ┌────────────┐   engine.GameAction   ┌────────────┐
 │  Device A  │ ─────────────────────▶│            │
 │  (Safari)  │                        │  Firestore │
 │            │ ◀───────────────────── │ games/{code}│
 └────────────┘  onSnapshot: GameDoc   └────────────┘
                                              ▲  │
 ┌────────────┐                               │  │
 │  Device B  │ ──────────────────────────────┘  │
 │  (Safari)  │ ◀─────────────────────────────────┘
 └────────────┘
```

- **`web/src/engine`** (`apply(action, playerID, state)`) is a pure function
  - no DOM, no Firebase - that returns a brand new `GameState` or throws a
  typed `GameError`. That's what makes it unit-testable and safe to run
  inside a Firestore transaction.
- **`web/src/firebase/gameService.ts`** is the only thing that talks to
  Firestore. Every move runs inside a `runTransaction`: read the current
  `GameState`, run it through the engine, write the result back. That's what
  stops two near-simultaneous taps on both phones from corrupting the board.
- **`web/src/ui`** is plain TypeScript + DOM (no framework) - a tiny
  hyperscript-style builder (`ui/h.ts`) and a full-tree re-render on every
  state change, with explicit focus/cursor preservation for text inputs
  (`mount()` in `ui/h.ts`) so re-rendering doesn't fight you while typing.
- Auth is **anonymous** - there's no email/password flow, and the Firebase
  UID is all the engine needs to tell the two players apart.
- The exact same `games/{code}` document shape is used here as in the native
  Swift version below, so `firebase/firestore.rules` works for either.

### Hardening hidden information (not built here)

Right now `games/{code}.state` holds the *entire* game - including the draw
pile order and the opponent's hand - and both players' clients can read the
whole document (that's what `firestore.rules` allows). A player willing to
open devtools and read Firestore directly could see cards they shouldn't. For
playing with a friend that's a reasonable trade-off for how much simpler it
keeps the app. If you want it cheat-proof later: move `apply()` into a
Firebase **Cloud Function** (callable), store the authoritative `GameState`
in a doc clients can't read directly, and fan out a redacted per-player view
(own hand in full, opponent's hand as a count only) into
`games/{code}/players/{uid}`, each readable only by its own `uid`.

## Native iOS app (optional, requires a Mac)

`JaipurKit` (pure Swift rules engine, mirrors `web/src/engine` exactly) and
`JaipurApp` (SwiftUI) implement the same game as a native app. This was
written in an environment with no Mac/Xcode/Swift toolchain, so **none of it
has been compiled** - treat it as a well-reasoned first draft, not working
code, and budget time for a first build/debug pass. If you get access to a
Mac later:

```sh
cd JaipurKit && swift test        # verify the rules engine first
```

Then, for the app itself:

1. Firebase console → **Add app → iOS**, bundle ID `com.kkandenas.jaipur` (or
   change `PRODUCT_BUNDLE_IDENTIFIER` in `JaipurApp/project.yml`). Download
   `GoogleService-Info.plist` → save as `JaipurApp/JaipurApp/GoogleService-Info.plist`
   (git-ignored; see the `.example` next to it).
2. `brew install xcodegen && cd JaipurApp && xcodegen generate && open JaipurApp.xcodeproj`
3. Set your Team under Signing & Capabilities, run on two simulators.

Installing on a real iPhone/iPad additionally needs an Apple Developer
Program account ($99/yr) for code signing - Xcode can't put an app on a
physical device without one, Mac or no Mac.

## Rules reference implemented

Both engines (`web/src/engine`, `JaipurKit`) implement the same rules:

- 55-card deck: 6 diamond, 6 gold, 6 silver, 8 cloth, 8 spice, 10 leather, 11 camel.
- Market seeded with 3 camels + 2 random cards; each player dealt 5.
- One action per turn: take all camels, take one card, exchange 2-5 cards
  (goods and/or herd camels) with the market, or sell same-good cards.
- Selling diamond/gold/silver requires at least 2 cards at once; cloth/spice/
  leather can be sold one at a time.
- Selling 3+ cards at once also awards a bonus token from the matching
  3/4/5+ stack.
- 7-card hand limit (camels don't count against it).
- Round ends the instant 3 of the 6 goods-token stacks are empty, or the draw
  pile can't refill the market back to 5.
- Camel-herd majority gets a 5-point bonus at round end (tie = nobody).
- First player to win 2 rounds wins the match; on a tied round total, nobody
  is credited a round win.

## Repo layout

```
web/                 The PWA - recommended path, see Quick start above.
  src/engine/          Pure TS rules engine + vitest suite.
  src/firebase/         Firestore/Auth service layer.
  src/ui/               Vanilla TS/DOM views and components.
  scripts/generate-icons.mjs  Dependency-free PNG icon generator (`npm run icons`).
.github/workflows/deploy-web.yml   Builds web/ and deploys to GitHub Pages.

JaipurKit/           Native rules engine (Swift package, mirrors web/src/engine).
JaipurApp/           Native SwiftUI app, built via XcodeGen from project.yml.

firebase/            firestore.rules, firestore.indexes.json, firebase.json -
                     shared by both apps, deploy with the Firebase CLI.
```
