# AI Prompt Generator (Next.js + Google Gemini API)

Egy modern, egyoldalas AI Prompt Generator webalkalmazás, amely mélyreható magyar kérdéssor segítségével deríti fel a felhasználó céljait, majd a válaszok alapján egy csúcsminőségű, professzionális angol nyelvű Master Promptot szintetizál a Google Gemini API segítségével.

Az **egész alkalmazáskód egyetlen fájlban** (`app/page.tsx`) található a könnyű hordozhatóság és másolhatóság érdekében.

---

## Főbb funkciók és működés

1. **Dinamikus modell-lekérés API kulcs alapján**:
   - Amikor megadod a Gemini API kulcsot (vagy az `.env.local` fájlból betöltődik), az app automatikusan lekéri a Google Generative Language REST API-n keresztül (`/v1beta/models`) a fiókodban elérhető szöveggeneráló Gemini modelleket.
   - Kézi frissítő gomb (`RefreshCw` ikon) a modellek azonnali újratöltéséhez.
   - Intelligens rendezés és fallback a standard modellekre (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).

2. **Biztonság és hálózati szabályok**:
   - **Szigorúan REST/HTTP hívások** (semmilyen WebSocket nincs használatban).
   - API kulcs megadható a `.env.local` fájlban (`NEXT_PUBLIC_GEMINI_API_KEY`) vagy a felület tetején lévő modern input mezőben (kliensoldalon `localStorage`-ban tárolva).

3. **1. Lépés: Célleírás & Spamvédelem**:
   - Részletes szövegmező az elképzelés leírására.
   - Automatikus gombletiltás és spinner kattintáskor.
   - Hiba esetén 2-3 másodperces cooldown védelem.

4. **2. Lépés: 9 mélyreható kérdés generálása (AI Call 1)**:
   - Nyelv: **MAGYAR** (magyarul feltett kérdések és A, B, C opciók).
   - Mennyiség: **Pontosan 9 kérdés**.
   - Hőmérséklet: **0.5**.
   - Hibakezelés: Rosszul formázott JSON esetén csendes háttérbeli újrapróbálkozás (akár 3 alkalommal) toast üzenet előtt.

5. **3. Lépés: Interaktív kérdések és Egyéni "D" opció**:
   - `framer-motion` animált megjelenés.
   - Modern, neon kiemelésű kártyák A, B és C válaszokhoz.
   - Automatikusan injektált **D (Egyéni válasz)** szöveges mező minden kérdésnél.

6. **4. Lépés: Végleges Mester Prompt szintetizálása (AI Call 2)**:
   - A kiinduló célleírás + az összes megadott válasz összevonása.
   - Nyelv: **SZIGORÚAN ANGOL (ENGLISH)**.
   - Kimenet: Gazdag Markdown formázás (Szerepkör, Cél, Kontextus, Szabályok, Lépések, Kimeneti formátum).

7. **5. Lépés: Kimenet & Másolás**:
   - `<pre>` kódblokkban megjelenített raw Markdown szöveg.
   - Egykattintásos vágólapra másolás vizuális pipával és toast értesítéssel.
   - Teljes munkaterület-törlő (Reset) gomb a fejlécben.

---

## Használt parancsok

### 1. Függőségek telepítése
```bash
npm install
```

### 2. Környezeti változók beállítása (opcionális)
Hozz létre egy `.env.local` fájlt a gyökérkönyvtárban:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=a_te_gemini_api_kulcsod
```
*(Ha nem állítod be, a felületen megjelenő beviteli mezőben is bemásolhatod a kulcsot.)*

### 3. Fejlesztői szerver indítása
```bash
npm run dev
```
Nyisd meg a böngészőben: **`http://localhost:3000`**

### 4. TypeScript típusellenőrzés
```bash
npx tsc --noEmit
```
