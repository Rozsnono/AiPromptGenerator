import { UserAnswer } from "./types";

type Letter = "A" | "B" | "C";
type QuestionOptions = { options: { A: string; B: string; C: string } };

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

/** A kijelölt A/B/C betűk (egyéni D válasznál vagy válasz nélkül üres), ABC sorrendben. */
export function selectedLetters(answer: UserAnswer | undefined): Letter[] {
  if (!answer || answer.selectedOption === "D") return [];
  const letters = answer.selectedOptions?.length ? answer.selectedOptions : [answer.selectedOption as Letter];
  return (["A", "B", "C"] as const).filter((l) => letters.includes(l));
}

/** A felhasználónak megjelenítendő válaszszöveg (opciók tartalma vagy egyéni szöveg). */
export function displayAnswerText(question: QuestionOptions, answer: UserAnswer | undefined): string {
  if (!answer) return "";
  if (answer.selectedOption === "D") return answer.customText?.trim() ?? "";
  return selectedLetters(answer)
    .map((l) => question.options[l])
    .join(" + ");
}

/** Promptba illeszthető válasz-leírás: "Opció A: "..."" (több kijelölésnél soronként). */
export function describeSelectedOptions(question: QuestionOptions, answer: UserAnswer): string {
  const letters = selectedLetters(answer);
  if (letters.length === 1) return `Opció ${letters[0]}: "${question.options[letters[0]]}"`;
  return `Több opció együtt:\n${letters.map((l) => `- Opció ${l}: "${question.options[l]}"`).join("\n")}`;
}

/**
 * Lezárt körhöz tartozó kérdés: a `roundEnds` a lezárt körök utolsó kérdésének azonosítóit tartalmazza
 * (egy kör akkor záródik, ha új kérdéseket kértek utána), ezért minden kérdés zárolt, aminek az azonosítója
 * nem nagyobb a legnagyobb lezáró azonosítónál.
 */
export function isQuestionLocked(questionId: number, roundEnds: number[]): boolean {
  return roundEnds.length > 0 && questionId <= Math.max(...roundEnds);
}
