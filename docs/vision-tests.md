# Vision tests and the monthly comparison

Page: **Test de vedere** (`/test-vedere`). The goal is to answer one question honestly: *does the vision really get better?* Three home tests, always in the same conditions, compared month by month.

All three need the screen size from the calibration (bank-card step) so the letters have the right size. Each test is saved per eye (`vision_tests` table) and counts as practice time (`test-vedere`).

## 1. Letter chart — visual acuity (`/test-vedere/acuity`)

Page: `resources/js/pages/vision/Acuity.vue`

- Letters: the 10 **Sloan letters** (C D H K N O R S V Z) of standard eye charts, drawn on a 5 × 5 grid (`resources/js/vision/sloan.ts`). The stroke is 1/5 of the letter height.
- Size of a line: letter height = 5 arcmin × 10^logMAR at the chosen distance (`letterHeightPx()`); lines go from 1.3 to −0.3 logMAR in steps of 0.1. Only lines that fit on the screen and whose stroke is at least one screen pixel are used.
- Each line has 5 different random letters, spaced one letter width apart. You **type** the letters you see (keyboard or on-screen keys) — the answer is checked letter by letter.
- Walk (ETDRS style): start 2 lines above your last result (or at 1.0). Go **up** until a line has 4+ letters right, then **down** until a line has 2 or fewer right.
- **Score (ETDRS letter-by-letter):**
  `logMAR = top line + 0.1 − 0.02 × letters read`
  Each letter is worth 0.02 logMAR, each line (5 letters) 0.1. Lines above the first one count as read.
- Also shown: decimal acuity (`10^−logMAR`) and Snellen 6/x.
- Flags: `floor` (could not read the biggest line that fits → move closer) and `ceiling` (read the smallest line the screen can show → sit further away).

Recommended: 150–300 cm, every week, twice in a row per eye.

## 2. Reading test (`/test-vedere/reading`)

Page: `resources/js/pages/vision/Reading.vue`, sentences in `resources/js/vision/sentences.ts` (original sentences of 10 words, Romanian and English, in the spirit of the MNREAD chart).

- Print size by **x-height**: x-height = 5 arcmin × 10^logMAR at the distance (40 cm standard). The font's x-height ratio is measured in the browser.
- For each size (big → small): show the sentence, read it aloud, stop the clock, enter the number of wrong / skipped words.
- Results:
  - **Reading acuity** = start + 0.1 − 0.1 × sentences read + 0.01 × wrong words (MNREAD rule) — the smallest print you can read.
  - **Reading speed** per sentence = (words − errors) × 60 / seconds; **best speed** = best average of 3 sentences in a row.
  - **Critical print size** = the smallest size before the speed drops below 80 % of the best speed — below it reading becomes slow.
- Saved `score` = reading acuity (logMAR); `data.max_wpm`, `data.cps`, every sentence in `data.lines`.

## 3. Contrast test (`/test-vedere/contrast`)

Page: `resources/js/pages/vision/Contrast.vue` — Pelli-Robson style.

- Big Sloan letters (about 2.8° tall), in groups of 3, at contrasts from 100 % down: logCS 0.00, 0.15 … 2.25 (Weber contrast = 10^−logCS).
- Grey levels are computed in linear luminance (sRGB) and **dithered** pixel by pixel, so contrasts smaller than one 8-bit step are still right on average.
- Continue while at least 2 of 3 letters are right. **Score** = 0.05 × letters read − 0.15 (logCS, higher = better; healthy adults ≈ 1.65–2.0).
- Depends on the screen and its brightness: always the same screen and brightness.

## The comparison: real progress or chance?

Service: `app/Services/VisionProgressService.php`

1. Tests of the same day, type and eye are **averaged** (two tests in a row are more reliable than one).
2. For the latest test day, the **baseline** is the test day closest to **30 days earlier**, within 20–45 days. If there is none, the first test day at least 7 days older is used and the comparison is marked *approximate*.
3. Gain = old − new for logMAR (lower is better), new − old for logCS.
4. Verdict, using the measurement error ("noise") of the test — about **0.1 logMAR** (one line) for the letter chart and reading, 0.15 logCS for contrast:

| Gain | Verdict | Shown as |
|---|---|---|
| ≥ 2 × noise (≥ 2 lines) | `better` | Clear progress |
| ≥ noise (≈ 1 line) | `maybe_better` | Possible progress — repeat the test |
| between −noise and +noise | `stable` | Stable |
| ≤ −noise | `maybe_worse` | Slightly weaker |
| ≤ −2 × noise | `worse` | Weaker |

Also shown: lines (gain / 0.1) and letters (gain / 0.02), the change since the **first** test, and for reading the change of the best speed in %.

Why 2 lines: studies of the ETDRS chart found that a change of 0.2 logMAR (two lines) or more can be told apart from no change reliably, while 0.1 or less cannot (Rosser et al., *Br J Ophthalmol* 2003, <https://pubmed.ncbi.nlm.nih.gov/12882770/>).

## Good practice (shown on the page too)

- Same distance (measured), same screen, same light, ideally the same time of day.
- Usual glasses on, the other eye covered with the palm or a patch (not the red-cyan glasses).
- Rested eyes, not right after a long exercise session.
- These are home measurements to follow the trend; the official measurement and the diagnosis are made by the eye doctor.
