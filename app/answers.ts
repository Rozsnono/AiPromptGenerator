import { UserAnswer } from "./types";

/**
 * Ha a felhasználó egy előre megadott (A/B/C) választ kiegészített, ebből készít
 * promptba illeszthető sort. Egyéni (D) válasznál nincs külön kiegészítés.
 */
export function extensionSuffix(answer: UserAnswer | undefined): string {
  const extra = answer?.extraText?.trim();
  if (!answer || answer.selectedOption === "D" || !extra) return "";
  return `\nKiegészítés a választ illetően: "${extra}"`;
}

/** Megválaszoltnak számít: kiválasztott A/B/C, vagy kitöltött egyéni (D) válasz. */
export function isAnswered(answer: UserAnswer | undefined): boolean {
  if (!answer) return false;
  if (answer.selectedOption === "D") return Boolean(answer.customText && answer.customText.trim());
  return true;
}

/** A felhasználónak megjelenítendő válaszszöveg (opció tartalma vagy egyéni szöveg). */
export function displayAnswerText(
  question: { options: { A: string; B: string; C: string } },
  answer: UserAnswer | undefined
): string {
  if (!answer) return "";
  if (answer.selectedOption === "D") return answer.customText?.trim() ?? "";
  return question.options[answer.selectedOption];
}
