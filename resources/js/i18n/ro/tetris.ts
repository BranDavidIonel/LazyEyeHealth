// Romanian texts of the dichoptic Tetris (resources/js/exercises/tetris.ts
// and pages/exercises/Tetris.vue).
export default {
    'Dichoptic Tetris': 'Tetris dihoptic',
    'The falling piece is seen by the lazy eye, the settled pieces by the good eye, and the frame by both. Keys: ← → move, ↑ rotate, ↓ down, Space drop, P pause.':
        'Piesa care cade o vede ochiul leneș, piesele așezate le vede ochiul bun, iar rama o văd amândoi. Taste: ← → mută, ↑ rotește, ↓ coboară, Spațiu cade, P pauză.',
    'Tip: do the <a href=":url">calibration</a> first, so the game suits your eyes.':
        'Recomandare: fă întâi <a href=":url">calibrarea</a>, ca jocul să fie potrivit pentru ochii tăi.',

    // side panel
    Score: 'Scor',
    Lines: 'Linii',
    Level: 'Nivel',
    'Good eye contrast': 'Contrast ochi bun',
    'Next piece': 'Următoarea',
    patch: 'ocluzor',
    Start: 'Start',
    'New game': 'Joc nou',
    'Pause (P)': 'Pauză (P)',
    'Resume (P)': 'Continuă (P)',
    move: 'mută',
    rotate: 'rotește',
    'move down': 'coboară',
    Space: 'Spațiu',
    drop: 'cade',
    pause: 'pauză',

    // touch buttons
    Left: 'Stânga',
    Right: 'Dreapta',
    Rotate: 'Rotește',
    'Move down': 'Coboară',
    Drop: 'Cade',

    // board
    'Press Start': 'Apasă Start',
    'or the Enter key': 'sau tasta Enter',
    Pause: 'Pauză',
    'press P to continue': 'apasă P ca să continui',
    'Game over': 'Joc terminat',
    'Score: :score': 'Scor: :score',

    // game over
    'Best score': 'Cel mai bun scor',
    Menu: 'Meniu',
    'Play again': 'Joacă din nou',
    'Very good! The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.':
        'Foarte bine! Contrastul pentru ochiul bun crește la <b>:pct%</b>: ochii lucrează mai echilibrat.',
    'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.':
        'Contrastul pentru ochiul bun a scăzut la <b>:pct%</b>, ca ochiul leneș să intre mai ușor în joc.',
} satisfies Record<string, string>;
