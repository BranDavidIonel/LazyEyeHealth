// Romanian texts of the "Citire cu ochiul leneș" exercise (exercises/reading.ts, pages/exercises/Reading.vue).
// The reading passages themselves are in exercises/reading.ts, in both languages.
export default {
    // page
    Start: 'Start',
    'How was this text?': 'Cum a fost textul?',
    Easy: 'Ușor',
    'With effort': 'Cu efort',
    'Could not read it': 'N-am putut citi',
    Text: 'Text',
    'Print size': 'Mărimea textului',
    'Last speed': 'Ultima viteză',

    // exercise
    'Paused.': 'Pauză.',
    'The round is over.': 'Runda s-a terminat.',
    'Text :n of :total appears here when you press “Start”.':
        'Textul :n din :total apare aici când apeși „Start”.',
    ':wpm words/min': ':wpm cuvinte/min',
    'I have finished': 'Am terminat',
    Continue: 'Continuă',
    'Next text': 'Textul următor',
    'No problem: the next text will be larger.': 'Nicio problemă: următorul text va fi mai mare.',
    'No problem: the next text stays at the largest size.':
        'Nicio problemă: următorul text rămâne la cea mai mare mărime.',
    'Time: :sec s · :wpm words/min': 'Timp: :sec s · :wpm cuvinte/min',
    Pause: 'Pauză',
    Menu: 'Meniu',
    'The text is hidden and the clock is stopped. When you are ready, check the glasses or the patch and press “Continue”.':
        'Textul e ascuns și cronometrul e oprit. Când ești gata, verifică ochelarii sau ocluzorul și apasă „Continuă”.',
    'This is your first round. Repeat the exercise in the coming days to see how you progress.':
        'Este prima ta rundă. Repetă exercițiul în zilele următoare ca să vezi cum evoluezi.',
    'The smallest text you read was one step (0.1 logMAR) smaller than last time.':
        'Cel mai mic text citit a fost cu o treaptă (0,1 logMAR) mai mic decât data trecută.',
    'The smallest text you read was :n steps (0.1 logMAR each) smaller than last time.':
        'Cel mai mic text citit a fost cu :n trepte (de câte 0,1 logMAR) mai mic decât data trecută.',
    'The smallest text you read was one step larger than last time.':
        'Cel mai mic text citit a fost cu o treaptă mai mare decât data trecută.',
    'The smallest text you read was :n steps larger than last time.':
        'Cel mai mic text citit a fost cu :n trepte mai mare decât data trecută.',
    'Same smallest size as last time.': 'Aceeași mărime minimă ca data trecută.',
    'Reading speed: almost the same as last time.': 'Viteza de citire: aproape la fel ca data trecută.',
    'Reading speed: :pct% faster than last time.': 'Viteza de citire: cu :pct% mai mare decât data trecută.',
    'Reading speed: :pct% slower than last time.': 'Viteza de citire: cu :pct% mai mică decât data trecută.',
    'The speed also depends on the print size, so compare rounds with similar sizes.':
        'Viteza depinde și de mărimea textului, așa că compară runde cu mărimi asemănătoare.',
    'Do not worry: tiredness, light and attention change the result from one day to the next. What matters is the trend over several days.':
        'Nu-ți face griji: oboseala, lumina și atenția schimbă rezultatul de la o zi la alta. Contează tendința pe mai multe zile.',
    'Well done! Regular practice pays off.': 'Bravo! Exercițiul regulat dă rezultate.',
    'Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.':
        'Data trecută ai lucrat în alt mod (ochelari / ocluzor), așa că comparația e orientativă.',
    'Round finished': 'Rundă terminată',
    'Smallest text read easily': 'Cel mai mic text citit ușor',
    'Smallest text read': 'Cel mai mic text citit',
    'Reading speed': 'Viteza de citire',
    'Texts read': 'Texte citite',
    'logMAR 0 is about the print size a healthy eye can just read at this distance; each 0.1 step is about 25% larger. Smaller is better. The next round starts at :next logMAR.':
        'logMAR 0 este cam mărimea pe care abia o citește un ochi sănătos la această distanță; fiecare treaptă de 0,1 e cu aproximativ 25% mai mare. Mai mic e mai bine. Runda următoare începe de la :next logMAR.',
    'You easily read the smallest text this screen can show at this distance. To practise with smaller print, sit further from the screen and update the distance in the <a href=":url">calibration</a>.':
        'Ai citit ușor cel mai mic text pe care îl poate arăta ecranul la această distanță. Ca să exersezi cu litere mai mici, stai mai departe de ecran și actualizează distanța în <a href=":url">calibrare</a>.',
    'The figures are training estimates, not a medical diagnosis.':
        'Cifrele sunt estimări de antrenament, nu un diagnostic medical.',
    'One more round': 'Încă o rundă',
    'Sit about :cm cm from the screen.': 'Stai la ~:cm cm de ecran.',
    'The screen is not calibrated yet, so the print size is approximate.':
        'Ecranul nu e calibrat încă, așa că mărimea textului este aproximativă.',
    'Calibrate the screen size': 'Calibrează mărimea ecranului',
    'Reading with the lazy eye': 'Citire cu ochiul leneș',
    'You read :n short texts with the lazy eye only. Press “Start” (or Space): the text appears and the clock starts. Read it silently, at your usual pace, to the end. Then press “I have finished” and say how it went: “Easy”, “With effort” or “Could not read it” (keys <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>).':
        'Citești :n texte scurte, doar cu ochiul leneș. Apasă „Start” (sau Spațiu): apare textul și pornește cronometrul. Citește-l în gând, în ritmul tău obișnuit, până la capăt. Apoi apasă „Am terminat” și spune cum a fost: „Ușor”, „Cu efort” sau „N-am putut citi” (tastele <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>).',
    'After “Easy” the next text is smaller, after “With effort” it stays the same, after “Could not read it” it gets larger. The first text has a size of :size logMAR.':
        'După „Ușor” următorul text e mai mic, după „Cu efort” rămâne la fel, după „N-am putut citi” devine mai mare. Primul text are mărimea :size logMAR.',
} satisfies Record<string, string>;
