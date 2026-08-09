import { GameError, type GameErrorCode } from "../engine";

const GAME_ERROR_MESSAGES: Record<GameErrorCode, string> = {
  notYourTurn: "Det är inte din tur.",
  gameAlreadyOver: "Matchen är redan slut.",
  roundAlreadyOver: "Ronden är redan slut.",
  cardNotInMarket: "Det kortet finns inte längre på marknaden.",
  cardNotInHand: "Det kortet finns inte i din hand.",
  cannotTakeCamelViaSingleTake: "Du kan inte ta en enstaka kamel - använd \"Ta kameler\" för att ta alla på en gång.",
  noCamelsInMarket: "Det finns inga kameler på marknaden just nu.",
  handLimitExceeded: "Du får max ha 7 varukort på hand.",
  exchangeCountOutOfRange: "Du måste byta 2-5 kort åt gången.",
  exchangeCountMismatch: "Du måste ge lika många kort som du tar.",
  exchangeCannotIncludeCamelFromMarket: "Du kan inte ta en kamel från marknaden i ett byte.",
  exchangeInsufficientCamelsInHerd: "Du har inte så många kameler i din hjord.",
  sellRequiresCardsOfSameGood: "Du kan bara sälja kort av samma vara samtidigt.",
  sellBelowMinimumForPreciousGood: "Diamanter, guld och silver måste säljas minst 2 åt gången.",
  emptyAction: "Välj minst ett kort först."
};

/** Turns a caught error into a Swedish message safe to show the player. */
export function describeError(error: unknown): string {
  if (error instanceof GameError) return GAME_ERROR_MESSAGES[error.code];
  if (error instanceof Error) return error.message;
  return "Något gick fel.";
}
