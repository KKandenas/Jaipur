import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import { requireDb } from "./app";
import type { GameDocument } from "./gameDocument";
import {
  apply,
  newGame,
  revealBonusToken as engineRevealBonusToken,
  startNextRound as engineStartNextRound,
  type GameAction
} from "../engine";

export class GameServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameServiceError";
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I - easy to read aloud

function randomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function gameRef(code: string) {
  return doc(collection(requireDb(), "games"), code.toUpperCase());
}

export async function createGame(hostID: string, hostName: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const ref = gameRef(code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    const document: GameDocument = {
      status: "waiting",
      hostID,
      hostName,
      playerIDs: [hostID],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      state: null
    };
    await setDoc(ref, document);
    return code;
  }
  throw new GameServiceError("Kunde inte skapa ett nytt spel just nu. Försök igen.");
}

export async function joinGame(code: string, guestID: string, guestName: string): Promise<void> {
  const ref = gameRef(code);
  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new GameServiceError("Hittade inget spel med den koden.");
    }
    const document = snapshot.data() as GameDocument;
    if (document.playerIDs.includes(guestID)) {
      return; // already joined - e.g. app relaunch mid-game
    }
    if (document.status !== "waiting" || document.playerIDs.length !== 1) {
      throw new GameServiceError("Det spelet har redan två spelare.");
    }

    const state = newGame(document.hostID, document.hostName, guestID, guestName);
    const next: GameDocument = {
      ...document,
      playerIDs: [document.hostID, guestID],
      status: "active",
      state,
      updatedAt: Date.now()
    };
    transaction.set(ref, next);
  });
}

export function observeGame(code: string, onChange: (doc: GameDocument) => void): Unsubscribe {
  return onSnapshot(gameRef(code), (snapshot) => {
    if (!snapshot.exists()) return;
    onChange(snapshot.data() as GameDocument);
  });
}

export async function applyAction(action: GameAction, code: string, playerID: string): Promise<void> {
  const ref = gameRef(code);
  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new GameServiceError("Spelet finns inte längre.");
    const document = snapshot.data() as GameDocument;
    if (!document.state) throw new GameServiceError("Spelet har inte startat än.");

    const nextState = apply(action, playerID, document.state);
    const next: GameDocument = {
      ...document,
      state: nextState,
      status: nextState.winnerID ? "finished" : document.status,
      updatedAt: Date.now()
    };
    transaction.set(ref, next);
  });
}

export async function revealBonusToken(code: string, playerID: string, tokenIndex: number): Promise<void> {
  const ref = gameRef(code);
  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new GameServiceError("Spelet finns inte längre.");
    const document = snapshot.data() as GameDocument;
    if (!document.state) throw new GameServiceError("Spelet har inte startat än.");

    const nextState = engineRevealBonusToken(document.state, playerID, tokenIndex);
    const next: GameDocument = { ...document, state: nextState, updatedAt: Date.now() };
    transaction.set(ref, next);
  });
}

export async function startNextRound(code: string): Promise<void> {
  const ref = gameRef(code);
  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new GameServiceError("Spelet finns inte längre.");
    const document = snapshot.data() as GameDocument;
    if (!document.state) throw new GameServiceError("Spelet har inte startat än.");
    if (!document.state.roundEndReason || document.state.winnerID) return;

    const next: GameDocument = {
      ...document,
      state: engineStartNextRound(document.state),
      updatedAt: Date.now()
    };
    transaction.set(ref, next);
  });
}
