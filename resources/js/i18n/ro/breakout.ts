// Romanian texts of the dichoptic Breakout (resources/js/exercises/breakout.ts
// and pages/exercises/Breakout.vue).
export default {
    'Dichoptic Breakout': 'Breakout dihoptic',
    'The ball and the bricks are seen by the lazy eye, the paddle by the good eye, and the frame by both. Move the paddle with the mouse, your finger or ← →; Space, ↑ or click launches the ball; P pauses.':
        'Mingea și cărămizile le vede ochiul leneș, paleta o vede ochiul bun, iar rama o văd amândoi. Mută paleta cu mouse-ul, cu degetul sau cu ← →; Spațiu, ↑ sau clic lansează mingea; P pune pauză.',
    'Tip: do the <a href=":url">calibration</a> first, so the game suits your eyes.':
        'Recomandare: fă întâi <a href=":url">calibrarea</a>, ca jocul să fie potrivit pentru ochii tăi.',

    // side panel
    Score: 'Scor',
    Lives: 'Vieți',
    Level: 'Nivel',
    'Good eye contrast': 'Contrast ochi bun',
    patch: 'ocluzor',
    Start: 'Start',
    'New game': 'Joc nou',
    'Pause (P)': 'Pauză (P)',
    'Resume (P)': 'Continuă (P)',
    'Mouse / finger on the game or': 'Mouse / deget pe joc sau',
    'move the paddle': 'mută paleta',
    Space: 'Spațiu',
    'or click: launch the ball': 'sau clic: lansează mingea',
    pause: 'pauză',

    // board
    'Press Start': 'Apasă Start',
    'or the Enter key': 'sau tasta Enter',
    Pause: 'Pauză',
    'press P to continue': 'apasă P ca să continui',
    'Game over': 'Joc terminat',
    'Score: :score': 'Scor: :score',
    'Space, ↑ or click: launch the ball': 'Spațiu, ↑ sau clic: lansează mingea',

    // between levels / game over
    'Level :level complete': 'Nivelul :level terminat',
    'Next level': 'Nivelul următor',
    'Best score': 'Cel mai bun scor',
    Menu: 'Meniu',
    'Play again': 'Joacă din nou',
    'The contrast for the good eye goes up to <b>:pct%</b>: the eyes work in better balance.':
        'Contrastul pentru ochiul bun crește la <b>:pct%</b>: ochii lucrează mai echilibrat.',
    'The contrast for the good eye went down to <b>:pct%</b>, so the lazy eye can join the game more easily.':
        'Contrastul pentru ochiul bun a scăzut la <b>:pct%</b>, ca ochiul leneș să intre mai ușor în joc.',
} satisfies Record<string, string>;
