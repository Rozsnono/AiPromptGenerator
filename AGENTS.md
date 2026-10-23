# AGENTS.md – AiPromptGenerator

## Projekt státusza
KEDD-nek készül-e: **nem, külső projekt** (nem kell KEDD-Intranet API-t vagy Windows/AD környezetet figyelembe venni).

## Cél
Egyoldalas webalkalmazás, amely magyar kérdéssorral feltárja a felhasználó célját, majd a válaszokból professzionális Master Promptot szintetizál. Az AI-hívások az **Anthropic Claude API-n** keresztül mennek (korábban Google Gemini volt).

## Stack
Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, framer-motion, react-hot-toast, `@anthropic-ai/sdk`.

## Felépítés
- `app/page.tsx` – fő állapot és workflow (kérdésgenerálás, prompt-szintézis, localStorage perzisztencia, modell-lista).
- `app/claude.ts` – **egyetlen belépési pont a Claude API-hoz**: `generateClaudeText`, `sendClaudeChat`, `listClaudeModels`, `describeClaudeError`.
- `app/constants.ts` – alapmodellek, localStorage kulcsok, preset-ek, alapkonfig.
- `app/types.ts` – közös típusok.
- `app/answers.ts` – válasz-segédek (`isAnswered`, `displayAnswerText`, `extensionSuffix`).
- `components/` – UI (Header, Stepper, PromptConfigPanel, FinalPromptView, ChatModal, MarkdownRenderer, ConfirmFinalModal).
- Kérdés-lépés (2. lépés) **két külön nézet**, azonos propokkal (`QuestionsViewProps`), CSS breakpointtal váltva az `app/page.tsx`-ben:
  - `components/QuestionsView.tsx` – desktop (`lg` felett): szerkesztői, tágas, jobb oldali fix oldalsávval.
  - `components/QuestionsMobileChat.tsx` – telefon/tablet (`lg` alatt): chat-szerű, buborékokkal, alsó beviteli sávval.
  Az 1. és 3. lépés még közös, reszponzív nézet.

## Indítás / build / teszt
```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npx tsc --noEmit     # típusellenőrzés
```
Automatizált teszt és ESLint-konfiguráció jelenleg nincs (`next lint` interaktív beállítást kér).

## Konfiguráció
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` (`.env.local`, gitignorált) vagy a felületen megadott kulcs (böngésző `localStorage`, kulcs: `ai_prompt_gen_anthropic_api_key`).
- Régi Gemini-kulcs/modellek (`ai_prompt_gen_api_key`, `ai_prompt_gen_cached_models`) már nem használtak; a nem `claude*` azonosítójú tárolt modell figyelmen kívül marad.

## Külső API
Anthropic Messages API (`POST /v1/messages`) és Models API (`GET /v1/models`) a hivatalos SDK-n át. Alapmodell: `claude-opus-5-5` (választható: `claude-sonnet-5-5`, `claude-haiku-5-5`, a fiókban elérhető többi Claude modell). Nem küldünk `temperature`/`budget_tokens` paramétert (az újabb modelleken 400-at okoz); a kérdések JSON kimenetét prompt írja elő, `cleanAndParseJSON` dolgozza fel.

## Üzleti szabályok / formátumok
- Kérdések: JSON tömb `{id, question, options:{A,B,C}, isNew?, newReason?}`; a D opció egyéni szabad szöveg. `isNew` csak a további (follow-up) körben kérhető a modelltől: olyan témát jelöl, ami a célban/korábbi válaszokban még nem szerepelt (a kérés a kódban egészül ki, nem a mentett rendszerpromptban).
- Válasz: `{selectedOption, customText?, extraText?}`; `extraText` az A/B/C válasz kiegészítése, a promptokba `extensionSuffix`-szel kerül.
- A végleges generálás előtt megerősítő ablak ("Biztos kész vagy?") jelenik meg.
- A végső prompt célnyelve (hu/en), hangnem és programozói tudásszint konfigurálható.
- Állapot teljes egészében `localStorage`-ban él (nincs szerver/DB).

## Ismert korlátok
- Az API-hívás a böngészőből történik (`dangerouslyAllowBrowser: true`), a kulcs így a kliensnél van; a `NEXT_PUBLIC_` kulcs a bundle-be kerül. Nyilvános éles telepítéshez szerveroldali proxy (Next.js route) javasolt.
- Hálózati/API hiba esetén magyar hibaüzenet toast-ban, részletek `console`-ban; a kérdésgenerálás 3-szor újrapróbál.

## Biztonság
Jelszó, API-kulcs, token nem kerülhet Gitbe (`.env*` gitignorált). Ha secret mégis bekerül, el kell távolítani a Git historyból és rotálni kell.

## Kódminőség
A kód legyen emberi fejlesztő és más AI számára is jól érthető, dokumentált; a meglévő működést meg kell őrizni, csak a feladathoz szükséges részeken módosítsunk. Új Claude-hívás az `app/claude.ts`-en keresztül menjen.
