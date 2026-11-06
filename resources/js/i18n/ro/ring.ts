// Romanian texts of the "Inelul deschis" exercise (exercises/ring.ts, pages/exercises/Ring.vue).
export default {
    // page
    Start: 'Start',
    Time: 'Timp',
    Found: 'Găsite',
    Points: 'Puncte',
    'Size (gap)': 'Mărime (fantă)',
    'All the rings are closed, except one that has a small gap. Tap it as fast as you can.':
        'Toate inelele sunt închise, în afară de unul care are o fantă mică. Apasă pe el cât mai repede.',

    // exercise
    Pause: 'Pauză',
    Continue: 'Continuă',
    Wrong: 'Greșit',
    Menu: 'Meniu',
    'Time is up: the open ring was here.': 'Timpul a expirat: inelul deschis era aici.',
    'Correct! +:pts': 'Corect! +:pts',
    'The game is stopped, the clock does not run. When you are ready, check the glasses or the patch and press “Continue”.':
        'Jocul e oprit, timpul nu curge. Când ești gata, verifică ochelarii sau ocluzorul și apasă „Continuă”.',
    'This is your first saved game. Play again in the coming days to see how you progress.':
        'Este primul tău joc salvat. Joacă din nou în zilele următoare ca să vezi cum evoluezi.',
    'Better than last time.': 'Mai bine decât data trecută.',
    'Try again, without hurrying: look at each ring in turn.':
        'Încearcă din nou, fără grabă: privește pe rând fiecare inel.',
    'Almost the same as last time. Consistency is a good sign, keep going!':
        'Aproape la fel ca data trecută. Constanța e un semn bun, continuă!',
    'Better by :pct% than last time.': 'Mai bine cu :pct% decât data trecută.',
    'Well done! Regular practice pays off.': 'Bravo! Exercițiul regulat dă rezultate.',
    ':pct% weaker than last time.': 'Cu :pct% mai slab decât data trecută.',
    'Do not worry: tiredness, light and attention change the result from one day to the next. What matters is the trend over several days.':
        'Nu-ți face griji: oboseala, lumina și atenția schimbă rezultatul de la o zi la alta. Contează tendința pe mai multe zile.',
    'Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.':
        'Data trecută ai lucrat în alt mod (ochelari / ocluzor), așa că comparația e orientativă.',
    'New record! The old record was :best points.': 'Record nou! Vechiul record era :best puncte.',
    'Your best score: <b>:best</b> points.': 'Cel mai bun scor al tău: <b>:best</b> puncte.',
    'Time is up!': 'Timpul a expirat!',
    'Rings found': 'Inele găsite',
    Mistakes: 'Greșeli',
    'Smallest gap found': 'Cea mai mică fantă găsită',
    'Estimated acuity': 'Acuitate estimată',
    'The gap is measured in minutes of arc (′); smaller is better.':
        'Fanta e măsurată în minute de arc (′); mai mică e mai bine.',
    'The figures are training estimates, not a medical diagnosis.':
        'Cifrele sunt estimări de antrenament, nu un diagnostic medical.',
    'One more round': 'Încă o rundă',
    'Sit about :cm cm from the screen.': 'Stai la ~:cm cm de ecran.',
    'The screen is not calibrated yet, so the acuity values are approximate.':
        'Ecranul nu e calibrat încă, așa că valorile de acuitate sunt aproximative.',
    'Calibrate the screen size': 'Calibrează mărimea ecranului',
    'Find the open ring': 'Găsește inelul deschis',
    'Several rings appear on the screen. They are all closed, except one that has a small gap, like the letter C. Tap (or click) it as fast as you can. After each ring you find, the next ones get smaller; if you make a mistake, they get bigger. If you do not find it in 12 seconds, I show it to you and we move on.':
        'Pe ecran apar mai multe inele. Toate sunt închise, în afară de unul care are o fantă mică, ca litera C. Apasă (sau dă clic) pe el cât mai repede. După fiecare inel găsit, următoarele devin mai mici; dacă greșești, devin mai mari. Dacă nu-l găsești în 12 secunde, ți-l arăt și trecem mai departe.',
    'The round lasts 60 seconds. Small rings found quickly bring more points.':
        'Runda durează 60 de secunde. Inelele mici și găsite repede aduc mai multe puncte.',
} satisfies Record<string, string>;
