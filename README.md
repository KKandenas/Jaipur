# Jaipur

An iOS/iPadOS app for playing the 2-player card game **Jaipur** against a friend
on a separate device, synced live through Firebase.

This repo was scaffolded in a Linux, Xcode-less environment, so **nothing here
has been compiled or run yet** - see [Status & what to verify first](#status--what-to-verify-first)
before you start relying on it.

## Repo layout

```
JaipurKit/          Pure Swift package: the Jaipur rules engine. No SwiftUI,
                     no Firebase - a plain, unit-tested value-type model that
                     both the app and (later, optionally) a server can share.
JaipurApp/           The iOS app. Built with XcodeGen from project.yml, so the
                     .xcodeproj itself isn't committed (see below).
firebase/            firestore.rules, firestore.indexes.json, firebase.json -
                     deploy with the Firebase CLI.
```

## Status & what to verify first

This was written without access to a Mac/Xcode/Swift toolchain, so treat it as
a strong, carefully-reasoned-through first draft rather than "known working
code":

1. **`JaipurKit` is the part to trust most** - it's a plain Swift package with
   a full unit test suite (`JaipurKit/Tests`). The very first thing to do on
   your Mac is:
   ```sh
   cd JaipurKit
   swift test
   ```
   Fix whatever that turns up before building on top of it.
2. **The goods-token values** (`TokenBank.defaultStacks` in
   `JaipurKit/Sources/JaipurKit/TokenBank.swift`) were reconstructed from
   published Jaipur rules summaries, cross-checked for internal consistency
   (token counts line up with the card counts in the deck), but I could not
   reach the publisher's own rulebook PDF to confirm them byte-for-byte
   (outbound web access was restricted in this environment). **Double-check
   that table against your physical rulebook/insert before you rely on it for
   real scoring.** Everything else - deck composition (55 cards: 6 diamond /
   6 gold / 6 silver / 8 cloth / 8 spice / 10 leather / 11 camel), the 18
   bonus-sale tokens (3×[3,3,2,2,2,1,1], 4×[6,6,5,5,4,4], 5+×[10,10,9,8,8]),
   the 5-point camel bonus, the 7-card hand limit, the "sell at least 2" rule
   for diamond/gold/silver, and "first to 2 round wins" - was confirmed via
   multiple independent sources.
3. **The SwiftUI + Firebase code has never been compiled.** The logic is
   straightforward and I checked every API call against documented Firebase
   iOS SDK signatures, but the very first `xcodegen generate && open` in Xcode
   will likely surface a handful of small mistakes (a wrong argument label, a
   missing `await`, that kind of thing). Budget an hour for that pass before
   demoing it to anyone.
4. **There's no game artwork.** The cards you shared are the publisher's
   licensed illustrations, which I can't reproduce. `CardView` instead draws
   each good as a color + SF Symbol (see `GoodType+Style.swift`) so the app is
   fully playable and re-skinnable - drop real art into `Assets.xcassets` and
   point `CardView` at it whenever you have some (commissioned or licensed).

## Getting set up

### 1. Firebase project

You said no Firebase project exists yet, so:

1. Go to the [Firebase console](https://console.firebase.google.com), create
   a new project (Analytics is optional, you don't need it here).
2. Add an iOS app with bundle ID `com.kkandenas.jaipur` (or change
   `PRODUCT_BUNDLE_IDENTIFIER` in `JaipurApp/project.yml` to whatever you
   prefer, consistently).
3. Download the generated `GoogleService-Info.plist` and save it as
   `JaipurApp/JaipurApp/GoogleService-Info.plist` (see the `.example` file
   next to it for the expected shape). This file is git-ignored - never
   commit your real one.
4. In the console, enable:
   - **Authentication → Sign-in method → Anonymous** (the app signs each
     device in anonymously; there's no account system).
   - **Firestore Database** (start in production mode - the rules in
     `firebase/firestore.rules` lock it down).
5. Deploy the security rules once you have the [Firebase CLI](https://firebase.google.com/docs/cli):
   ```sh
   cd firebase
   firebase login
   firebase use --add        # pick the project you just created
   firebase deploy --only firestore
   ```

### 2. Generate and open the Xcode project

The `.xcodeproj` isn't committed - [XcodeGen](https://github.com/yonaskolb/XcodeGen)
generates it from `JaipurApp/project.yml` (much less error-prone than hand
editing/committing a `.pbxproj`, and it keeps the file list in sync with disk
automatically).

```sh
brew install xcodegen
cd JaipurApp
xcodegen generate
open JaipurApp.xcodeproj
```

Xcode will then resolve the Firebase Swift Package (declared in `project.yml`)
on first open - that can take a couple of minutes. `JaipurKit` resolves
instantly since it's a local path dependency (`../JaipurKit`).

Set your Team under **Signing & Capabilities** for the `JaipurApp` target,
then run on two simulators (or a simulator + your phone) to play a match
against yourself.

### 3. Play

- One device: **Create Game** → get a 5-character code.
- Other device: **Join Game** → type that code.
- Both boards update live via a Firestore listener.

## Architecture

```
 ┌────────────┐        JaipurKit.GameAction        ┌────────────┐
 │  Device A  │ ─────────────────────────────────▶ │            │
 │ (SwiftUI)  │                                     │  Firestore │
 │            │ ◀───────────────────────────────── │ games/{code}│
 └────────────┘     live listener: GameDocument     └────────────┘
                                                            ▲  │
 ┌────────────┐                                            │  │
 │  Device B  │ ───────────────────────────────────────────┘  │
 │ (SwiftUI)  │ ◀───────────────────────────────────────────────┘
 └────────────┘
```

- **`JaipurKit`** (`GameEngine.apply(_:by:to:)`) is a pure function:
  `(GameAction, playerID, GameState) throws -> GameState`. It has no I/O and
  no notion of Firebase, which is what makes it unit-testable and reusable.
- **`GameService`** (`JaipurApp/JaipurApp/Services/GameService.swift`) is the
  only thing that talks to Firestore. Every move goes through a **Firestore
  transaction**: read the current `GameState`, run it through `GameEngine`,
  write the result. That's what stops two near-simultaneous taps on both
  phones from corrupting the board - Firestore retries the transaction if the
  document changed underneath it.
- **`GameViewModel`** observes `games/{code}` via `addSnapshotListener`
  wrapped in an `AsyncStream`, and turns UI taps (selecting market/hand cards)
  into a single `GameAction` once the player confirms.
- Auth is **anonymous** (`FirebaseAuthService`) - there's no email/password
  flow to build, and the Firebase UID is all the engine needs to tell the two
  players apart.

### Hardening hidden information (Tier 2, not built here)

Right now `games/{code}.state` holds the *entire* game - including the draw
pile order and the opponent's hand - and both players' clients can read the
whole document (that's what `firestore.rules` allows). A player willing to
bypass the app and read Firestore directly could see cards they shouldn't.
For playing with a friend that's a fine trade-off for how much simpler it
keeps the app. If you later want it cheat-proof:

1. Move `GameEngine.apply` into a **Cloud Function** (callable), rewritten in
   TypeScript (or run the actual Swift engine server-side via a small
   Linux-hosted Swift service - `JaipurKit` already builds on Linux since it
   has zero Apple-only dependencies, so this is realistic).
2. Store the authoritative `GameState` in a document clients *can't* read
   directly (e.g. `games/{code}/private/state`, Firestore rules deny all
   client access), written only by the Cloud Function via the Admin SDK.
3. Have the function fan out a **redacted view** per player into
   `games/{code}/players/{uid}` (that player's own hand in full, the
   opponent's hand as a card *count* only, the market, token banks, etc.),
   each readable only by its own `uid`.
4. Clients call the callable function with a `GameAction` instead of writing
   Firestore directly; `GameService` already models actions this way, so the
   client-side change is mostly swapping the transaction call for a callable
   invocation.

## Rules reference implemented

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
