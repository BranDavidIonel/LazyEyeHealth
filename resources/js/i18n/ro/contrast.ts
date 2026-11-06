// Romanian texts of the "Contrast fin" exercise (exercises/contrast.ts, pages/exercises/Contrast.vue).
export default {
    // page
    'Spatial frequency (stripe fineness)': 'Frecvență spațială (finețea dungilor)',
    '1.5 cycles/degree (wide stripes)': '1,5 cicluri/grad (dungi late)',
    ':n cycles/degree': ':n cicluri/grad',
    '12 cycles/degree (fine stripes)': '12 cicluri/grad (dungi fine)',
    'Display time': 'Timp de afișare',
    '0.3 s': '0,3 s',
    '0.5 s': '0,5 s',
    'Until I answer': 'Până răspund',
    Start: 'Start',
    Trial: 'Încercare',
    'Correct answers': 'Corecte',
    Points: 'Puncte',
    'Contrast now': 'Contrast acum',
    'Are the stripes tilted to the left or to the right?':
        'Dungile sunt înclinate la stânga sau la dreapta?',
    left: 'stânga',
    right: 'dreapta',
    'Tilted to the left': 'Înclinate la stânga',
    'Tilted to the right': 'Înclinate la dreapta',

    // exercise
    'The chosen frequency is too high for this screen and this distance (the stripes would be thinner than 3 pixels). About :sf cycles/degree are used. Choose a lower frequency or sit further from the screen (and change the distance in the calibration).':
        'Frecvența aleasă e prea mare pentru acest ecran și această distanță (dungile ar fi mai subțiri de 3 pixeli). Se folosesc ~:sf cicluri/grad. Alege o frecvență mai mică sau stai mai departe de ecran (și schimbă distanța în calibrare).',
    Pause: 'Pauză',
    Continue: 'Continuă',
    Correct: 'Corect',
    Wrong: 'Greșit',
    Menu: 'Meniu',
    'The exercise is stopped. When you are ready, check the glasses or the patch and press “Continue”.':
        'Exercițiul e oprit. Când ești gata, verifică ochelarii sau ocluzorul și apasă „Continuă”.',
    'This is your first result with this setting. Repeat the exercise in the coming days to see how you progress.':
        'Este primul tău rezultat cu această setare. Repetă exercițiul în zilele următoare ca să vezi cum evoluezi.',
    'Almost the same as last time. Consistency is a good sign, keep going!':
        'Aproape la fel ca data trecută. Constanța e un semn bun, continuă!',
    'Better by :pct% than last time.': 'Mai bine cu :pct% decât data trecută.',
    'Well done! Regular practice pays off.': 'Bravo! Exercițiul regulat dă rezultate.',
    ':pct% weaker than last time.': 'Cu :pct% mai slab decât data trecută.',
    'Do not worry: tiredness, light and attention change the result from one day to the next. What matters is the trend over several days.':
        'Nu-ți face griji: oboseala, lumina și atenția schimbă rezultatul de la o zi la alta. Contează tendința pe mai multe zile.',
    'Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.':
        'Data trecută ai lucrat în alt mod (ochelari / ocluzor), așa că comparația e orientativă.',
    'Round finished': 'Rundă terminată',
    'Contrast threshold': 'Prag de contrast',
    'Contrast sensitivity': 'Sensibilitatea la contrast',
    ' (limited to about :sf by the screen)': ' (limitată la ~:sf de ecran)',
    'Frequency: :sf cycles/degree:limit. A lower threshold means you see fainter stripes, that is a higher sensitivity.':
        'Frecvență: :sf cicluri/grad:limit. Un prag mai mic înseamnă că vezi dungi mai estompate, adică o sensibilitate mai mare.',
    'You reached the lowest contrast in the program (0.4%). Very good!':
        'Ai ajuns la cel mai mic contrast din program (0,4%). Foarte bine!',
    'The figures are training estimates, not a medical diagnosis.':
        'Cifrele sunt estimări de antrenament, nu un diagnostic medical.',
    'One more round': 'Încă o rundă',
    'Sit about :cm cm from the screen.': 'Stai la ~:cm cm de ecran.',
    'The screen is not calibrated yet, so the stripe frequency and the values are approximate.':
        'Ecranul nu e calibrat încă, așa că frecvența dungilor și valorile sunt aproximative.',
    'Calibrate the screen size': 'Calibrează mărimea ecranului',
    'A cross appears in the centre. Look at it. Then a striped patch appears briefly, sometimes very faint. Say whether the stripes are tilted to the left ╲ (<kbd>←</kbd>) or to the right ╱ (<kbd>→</kbd>). If you see nothing, guess: that is normal, this is how we find the threshold.':
        'În centru apare o cruce. Privește-o. Apoi apare scurt o pată cu dungi, uneori foarte estompate. Spune dacă dungile sunt înclinate la stânga ╲ (<kbd>←</kbd>) sau la dreapta ╱ (<kbd>→</kbd>). Dacă nu vezi nimic, ghicește: e normal, așa găsim pragul.',
    Options: 'Opțiuni',
} satisfies Record<string, string>;
