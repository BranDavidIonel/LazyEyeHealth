// Romanian texts of the dichoptic Snake (resources/js/exercises/snake.ts
// and pages/exercises/Snake.vue).
export default {
    'Dichoptic Snake': 'Șarpele dihoptic',
    'The snake is seen by the lazy eye, the food and the obstacles by the good eye, and the frame by both. Eat the round dots to grow; avoid the edge, the squares with an X (obstacles, from level 2) and your own tail. Keys: arrows or W A S D, Space or P pause.':
        'Șarpele îl vede ochiul leneș, mâncarea și obstacolele le vede ochiul bun, iar rama o văd amândoi. Mănâncă bulinele ca să crești; ferește-te de margine, de pătratele cu X (obstacolele, de la nivelul 2) și de propria coadă. Taste: săgețile sau W A S D, Spațiu sau P pauză.',
    'Tip: do the <a href=":url">calibration</a> first, so the game suits your eyes.':
        'Recomandare: fă întâi <a href=":url">calibrarea</a>, ca jocul să fie potrivit pentru ochii tăi.',

    // side panel
    Score: 'Scor',
    Length: 'Lungime',
    Level: 'Nivel',
    'Best score': 'Cel mai bun scor',
    'Good eye contrast': 'Contrast ochi bun',
    patch: 'ocluzor',
    Start: 'Start',
    'New game': 'Joc nou',
    'Pause (P)': 'Pauză (P)',
    'Resume (P)': 'Continuă (P)',
    or: 'sau',
    'change direction': 'schimbă direcția',
    Space: 'Spațiu',
    pause: 'pauză',

    // touch buttons
    Up: 'Sus',
    Down: 'Jos',
    Left: 'Stânga',
    Right: 'Dreapta',
    Pause: 'Pauză',

    // board
    'Press Start': 'Apasă Start',
    'or the Enter key': 'sau tasta Enter',
    'press P or Space to continue': 'apasă P sau Spațiu ca să continui',
    'Game over': 'Joc terminat',
    'Score: :score': 'Scor: :score',
    'Level :level': 'Nivelul :level',

    // game over
    'The snake hit the edge.': 'Șarpele a lovit marginea.',
    'The snake hit an obstacle.': 'Șarpele a lovit un obstacol.',
    'The snake bit its own tail.': 'Șarpele și-a mușcat coada.',
    'The snake filled the whole board. Bravo!':
        'Șarpele a umplut toată tabla. Bravo!',
    Menu: 'Meniu',
    'One more game': 'Încă un joc',
    'Very good! The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.':
        'Foarte bine! Contrastul pentru ochiul bun crește la <b>:pct%</b>: ochii lucrează mai echilibrat.',
    'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.':
        'Contrastul pentru ochiul bun a scăzut la <b>:pct%</b>, ca ochiul leneș să intre mai ușor în joc.',
} satisfies Record<string, string>;
