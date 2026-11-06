// "Citire cu ochiul leneș": reading practice with the lazy eye only. Short
// everyday texts in the lazy-eye colour (glasses) or black on white (patch),
// with the print size set in logMAR at the exercise distance:
//   x-height = 5 arcmin × 10^logMAR   (logMAR 0 ≈ the size a healthy eye reads)
// A round has 5 texts. After each text you say how it went: "easy" makes the
// next one 0.1 logMAR smaller, "with effort" keeps the size, "could not read"
// makes it 0.1 larger. Reading speed (words per minute) is measured on the
// texts you read.
import Amb from '@/amb';
import type { Runtime } from '@/exercises/runtime';
import { getLocale, t } from '@/i18n';

const ID = 'citire';
const FONT = 'Verdana, Arial, sans-serif';
const TEXTS_PER_ROUND = 5;
const FIRST_LOGMAR = 0.7;
const MAX_LOGMAR = 1.0;
const MIN_LOGMAR = -0.1;
/** Order of the texts still to read, remembered in this browser only (no repeats until all were shown). */
const QUEUE_KEY = 'amb.opt.citire';

type Rating = 'easy' | 'effort' | 'failed';
type Passage = { ro: string; en: string };
type Item = { logmar: number; rating: Rating; words: number; ms: number };

/** Original short texts (written for this app), the same story in both languages. */
const PASSAGES: Passage[] = [
    {
        ro: 'În fiecare dimineață, Ana se trezește la ora șapte. Pune apă la fiert și deschide fereastra ca să intre aer proaspăt. Cât timp se face cafeaua, udă florile de pe pervaz și ascultă știrile la radio. Îi place să bea cafeaua încet, la masa din bucătărie, privind cum se luminează strada. Apoi își face o listă scurtă cu lucrurile importante ale zilei. Spune că un început liniștit o ajută să rămână calmă până seara.',
        en: 'Every morning, Ana wakes up at seven o’clock. She puts the kettle on and opens the window to let in some fresh air. While the coffee is brewing, she waters the flowers on the windowsill and listens to the news on the radio. She likes to drink her coffee slowly at the kitchen table, watching the street grow lighter. Then she writes a short list of the important things for the day. She says a quiet start helps her stay calm until the evening.',
    },
    {
        ro: 'Sâmbătă dimineață, Mihai merge la piața din cartier. Îi place să vorbească cu vânzătorii și să guste fructele înainte să le cumpere. Astăzi alege roșii, castraveți, un pepene mic și o legătură de mărar. O bătrână îi dă un sfat: merele de la capătul rândului sunt cele mai dulci. Mihai ascultă și cumpără un kilogram. Acasă, pune legumele în coș și face o salată mare pentru prânz. Merele chiar erau foarte bune.',
        en: 'On Saturday morning, Mihai goes to the market in his neighbourhood. He likes to chat with the sellers and to taste the fruit before he buys it. Today he picks tomatoes, cucumbers, a small melon and a bunch of dill. An old woman gives him a tip: the apples at the end of the row are the sweetest. Mihai listens and buys a kilo. At home, he puts the vegetables in a basket and makes a big salad for lunch. The apples really were very good.',
    },
    {
        ro: 'Autobuzul de la ora opt este mereu aglomerat. Elena urcă la a doua stație și caută un loc lângă geam. Dacă nu găsește, stă în picioare și se ține bine de bară. Pe drum se uită la oameni: un băiat citește o carte, o doamnă vorbește încet la telefon, iar un domn ține pe genunchi o cutie cu prăjituri. După douăzeci de minute, Elena coboară în fața biroului. Drumul nu e lung, dar îi place să observe orașul.',
        en: 'The eight o’clock bus is always crowded. Elena gets on at the second stop and looks for a seat by the window. If there is none, she stands and holds on to the rail. On the way she watches the people: a boy is reading a book, a lady is talking quietly on the phone, and a man holds a box of cakes on his knees. After twenty minutes, Elena gets off in front of her office. The ride is short, but she likes to watch the city.',
    },
    {
        ro: 'Era o zi caldă de iulie când cerul s-a întunecat dintr-odată. Copiii din parc au alergat sub acoperișul chioșcului, râzând. Primele picături au fost mari și rare, apoi ploaia a început să cadă cu putere. Pe trotuar s-au format bălți în care se oglindeau luminile magazinelor. După un sfert de oră, soarele a ieșit din nou. Aerul mirosea a pământ ud și a tei, iar pe cer a apărut un curcubeu mare.',
        en: 'It was a warm day in July when the sky suddenly grew dark. The children in the park ran laughing under the roof of the bandstand. The first drops were big and few, then the rain began to pour down. Puddles formed on the pavement, and the lights of the shops were reflected in them. After a quarter of an hour, the sun came out again. The air smelled of wet earth and lime blossom, and a big rainbow appeared in the sky.',
    },
    {
        ro: 'Când era mic, Radu petrecea vacanțele la bunica lui, la țară. Cel mai mult îi plăcea supa ei de legume. Bunica tăia morcovi, cartofi, ceapă și puțină țelină, apoi le punea la fiert într-o oală mare. La sfârșit adăuga pătrunjel verde din grădină. Acum Radu gătește aceeași supă în apartamentul lui din oraș. Nu iese chiar la fel de bună, dar mirosul îi amintește mereu de verile copilăriei.',
        en: 'When he was little, Radu spent his holidays at his grandmother’s house in the country. What he liked most was her vegetable soup. His grandmother chopped carrots, potatoes, onions and a little celery, then boiled them in a big pot. At the end she added fresh parsley from the garden. Now Radu cooks the same soup in his flat in the city. It is not quite as good, but the smell always reminds him of the summers of his childhood.',
    },
    {
        ro: 'Câinele familiei Popescu se numește Bruno și are patru ani. În fiecare seară, Ioana îl scoate la plimbare în jurul blocului. Bruno se oprește la fiecare copac și dă din coadă când vede alți câini. Uneori trag amândoi de lesă în direcții diferite, iar Ioana râde. Plimbarea durează cam o jumătate de oră. Când se întorc acasă, Bruno bea apă din castronul lui și se culcă pe covorul din hol, mulțumit.',
        en: 'The Popescu family’s dog is called Bruno and he is four years old. Every evening, Ioana takes him for a walk around the block. Bruno stops at every tree and wags his tail when he sees other dogs. Sometimes they both pull on the lead in different directions, and Ioana laughs. The walk lasts about half an hour. When they get back home, Bruno drinks water from his bowl and lies down on the rug in the hall, happy.',
    },
    {
        ro: 'În fiecare duminică, la ora cinci, Andrei își sună mama. Vorbesc despre vreme, despre grădină și despre ce au mâncat la prânz. Mama îl întreabă mereu dacă se odihnește destul și dacă se îmbracă bine când e frig. Andrei zâmbește, pentru că aude aceleași întrebări de ani de zile. La final, își promit că se vor vedea de sărbători. Convorbirea durează puțin, dar amândoi o așteaptă toată săptămâna.',
        en: 'Every Sunday at five o’clock, Andrei calls his mother. They talk about the weather, the garden and what they had for lunch. His mother always asks him if he gets enough rest and if he dresses warmly when it is cold. Andrei smiles, because he has been hearing the same questions for years. At the end, they promise to see each other for the holidays. The call is short, but they both look forward to it all week.',
    },
    {
        ro: 'Biblioteca din centrul orașului a fost renovată anul acesta. Acum are scaune comode, lămpi noi și o sală luminoasă pentru copii. Maria merge acolo în fiecare joi după serviciu. Împrumută două cărți, de obicei un roman și o carte despre călătorii. Bibliotecara o cunoaște deja și îi pune deoparte noutățile. Maria spune că acolo se simte ca acasă: e liniște, miroase a hârtie și nimeni nu se grăbește.',
        en: 'The library in the town centre was renovated this year. Now it has comfortable chairs, new lamps and a bright room for children. Maria goes there every Thursday after work. She borrows two books, usually a novel and a book about travelling. The librarian already knows her and puts the new books aside for her. Maria says she feels at home there: it is quiet, it smells of paper and nobody is in a hurry.',
    },
    {
        ro: 'Primăvara, Dan a hotărât să facă ordine pe balcon. A scos cutiile vechi, a spălat geamurile și a măturat praful adunat peste iarnă. Apoi a cumpărat trei ghivece cu mușcate roșii și un scaun mic de lemn. Acum, în serile calde, stă acolo cu o carte sau cu o cană de ceai. Vecinii de vizavi îi fac cu mâna. Un colț uitat al casei a devenit, încet, locul lui preferat.',
        en: 'In the spring, Dan decided to tidy up his balcony. He took out the old boxes, washed the windows and swept away the dust from the winter. Then he bought three pots of red geraniums and a small wooden chair. Now, on warm evenings, he sits there with a book or a cup of tea. The neighbours across the street wave to him. A forgotten corner of the flat has slowly become his favourite place.',
    },
    {
        ro: 'La treizeci de ani, Cristina a învățat să meargă pe bicicletă. Prietena ei a ajutat-o în parc, ținând șaua din spate în primele zile. La început Cristina se clătina și se oprea des, cu inima bătând tare. După o săptămână a reușit să facă singură un tur întreg al lacului. Acum merge cu bicicleta la serviciu când e vreme frumoasă. Spune că nu e niciodată prea târziu să înveți ceva nou.',
        en: 'At thirty, Cristina learned to ride a bike. Her friend helped her in the park, holding the back of the saddle for the first few days. At first Cristina wobbled and stopped often, with her heart beating fast. After a week she managed to ride a whole lap around the lake on her own. Now she cycles to work when the weather is nice. She says it is never too late to learn something new.',
    },
    {
        ro: 'Pisica vecinei de la etajul trei este gri, cu ochi verzi. Ziua doarme pe pervaz, la soare, iar seara coboară pe scări și se plimbă prin curte. Copiii din bloc i-au dat un nume: Fumuleț. Când vede pe cineva cu o pungă de cumpărături, vine imediat și se freacă de picioarele lui, torcând. Vecina spune, zâmbind, că pisica știe exact cine are ceva bun de mâncare în pungă.',
        en: 'The cat of the neighbour on the third floor is grey, with green eyes. During the day she sleeps on the windowsill in the sun, and in the evening she goes down the stairs and walks around the yard. The children in the building gave her a name: Smoky. When she sees someone with a shopping bag, she comes at once and rubs against their legs, purring. The neighbour says, smiling, that the cat knows exactly who has something tasty in the bag.',
    },
    {
        ro: 'Weekendul trecut, Sorin și prietenii lui au plecat la munte. Au urcat pe o potecă marcată cu dungi roșii, printre brazi înalți. Pe drum s-au oprit lângă un izvor cu apă rece și au mâncat sandvișuri. Spre prânz au ajuns la o cabană, unde au băut ceai fierbinte. De sus se vedea toată valea, cu sate mici și drumuri subțiri. S-au întors seara, obosiți, dar foarte bucuroși.',
        en: 'Last weekend, Sorin and his friends went to the mountains. They climbed a path marked with red stripes, among tall fir trees. On the way they stopped by a spring with cold water and ate sandwiches. Around noon they reached a mountain hut, where they drank hot tea. From the top they could see the whole valley, with small villages and thin roads. They came back in the evening, tired but very happy.',
    },
    {
        ro: 'În aprilie, domnul Vasile a plantat în grădină douăzeci de răsaduri de roșii. Le-a udat în fiecare seară și le-a legat de bețe ca să nu se aplece. În iunie au apărut primele flori galbene, iar în iulie fructele verzi au început să se înroșească. Prima roșie coaptă a împărțit-o cu nepoata lui. Ea a spus că nu a mâncat niciodată ceva atât de gustos.',
        en: 'In April, Mr Vasile planted twenty tomato seedlings in his garden. He watered them every evening and tied them to sticks so that they would not bend. In June the first yellow flowers appeared, and in July the green fruit began to turn red. He shared the first ripe tomato with his granddaughter. She said she had never eaten anything so tasty.',
    },
    {
        ro: 'Pentru ziua mamei, Laura a vrut să facă singură un tort. A găsit o rețetă simplă, cu blat de pandișpan și cremă de ciocolată. Prima încercare nu a ieșit bine, pentru că blatul nu a crescut. A doua zi a încercat din nou, cu ouă proaspete și mai multă răbdare. De data aceasta tortul a ieșit pufos și frumos. Mama a fost atât de emoționată încât a făcut o poză cu el.',
        en: 'For her mother’s birthday, Laura wanted to make a cake on her own. She found a simple recipe, with a sponge base and chocolate cream. The first try did not turn out well, because the sponge did not rise. The next day she tried again, with fresh eggs and more patience. This time the cake came out soft and pretty. Her mother was so moved that she took a photo of it.',
    },
    {
        ro: 'Vara aceasta, familia Ionescu a mers la mare cu trenul. Au plecat dimineața devreme, cu bagaje, pături și o geantă plină de mâncare. Copiii au stat lipiți de geam și au numărat vacile de pe câmp. Pe la prânz, peisajul s-a schimbat: au apărut lanuri întinse de floarea-soarelui și apoi primele bărci. Când au coborât din tren, au simțit imediat mirosul sărat al mării.',
        en: 'This summer, the Ionescu family went to the seaside by train. They left early in the morning, with luggage, blankets and a bag full of food. The children stayed glued to the window and counted the cows in the fields. Around noon the landscape changed: wide fields of sunflowers appeared, and then the first boats. When they got off the train, they could smell the salty sea at once.',
    },
    {
        ro: 'Azi-noapte a nins pentru prima dată în această iarnă. Dimineața, curtea școlii era albă și liniștită. Copiii au venit mai devreme ca de obicei, cu mănuși și fulare colorate. Au făcut un om de zăpadă cu nas din morcov și nasturi din pietre. Profesoara i-a lăsat zece minute în plus în pauză. Când au intrat în clasă, aveau obrajii roșii și ghetele ude, dar erau fericiți.',
        en: 'Last night it snowed for the first time this winter. In the morning, the school yard was white and quiet. The children came earlier than usual, with colourful gloves and scarves. They built a snowman with a carrot nose and buttons made of stones. The teacher gave them ten extra minutes of break. When they went back into the classroom, they had red cheeks and wet boots, but they were happy.',
    },
    {
        ro: 'Lampa de pe biroul lui Paul s-a stricat chiar într-o seară în care avea mult de lucru. Mai întâi a crezut că s-a ars becul, așa că l-a schimbat, dar lampa tot nu se aprindea. Apoi a verificat cablul și a văzut că ștecherul era slăbit. A scos lampa din priză și l-a strâns cu grijă, cu o șurubelniță mică. Când a apăsat butonul, lumina a revenit.',
        en: 'The lamp on Paul’s desk broke on an evening when he had a lot of work to do. At first he thought the bulb had burnt out, so he changed it, but the lamp still would not light up. Then he checked the cable and saw that the plug was loose. He unplugged the lamp and carefully tightened the plug with a small screwdriver. When he pressed the switch, the light came back on.',
    },
    {
        ro: 'De câteva luni, Irina învață să cânte la chitară. Exersează în fiecare seară câte douăzeci de minute, după cină. Săptămâna aceasta a început un cântec nou, mai greu decât cele de până acum. Degetele o dor puțin, iar unele acorduri încă sună ciudat. Totuși, nu renunță: repetă încet fiecare parte, apoi le leagă între ele. Speră că până la sfârșitul lunii îl va putea cânta pentru prietenii ei.',
        en: 'For a few months now, Irina has been learning to play the guitar. She practises for twenty minutes every evening, after dinner. This week she started a new song, harder than the ones before. Her fingers hurt a little, and some chords still sound strange. Still, she does not give up: she slowly repeats each part, then joins them together. She hopes that by the end of the month she will be able to play it for her friends.',
    },
    {
        ro: 'Toamna, parcul de lângă casa noastră se schimbă în fiecare zi. Frunzele de arțar devin galbene, portocalii și roșii, apoi cad pe alei. Grădinarii le adună în grămezi mari, iar copiii sar în ele râzând. Pe bănci, oamenii stau cu cafea caldă în mâini și se bucură de ultimele zile cu soare. Seara se lasă repede, iar aerul miroase a fum și a castane coapte.',
        en: 'In autumn, the park next to our house changes every day. The maple leaves turn yellow, orange and red, then fall onto the paths. The gardeners rake them into big piles, and the children jump into them, laughing. On the benches, people sit with warm coffee in their hands and enjoy the last sunny days. Evening comes quickly, and the air smells of smoke and roasted chestnuts.',
    },
    {
        ro: 'Duminică, trei familii de prieteni au organizat un picnic lângă râu. Fiecare a adus ceva: sandvișuri, plăcinte, fructe și o sticlă mare de limonadă. Au întins păturile la umbra unei sălcii și au pus mâncarea la mijloc. Copiii au jucat fotbal și au prins fluturi, iar adulții au povestit și au râs. Spre seară au strâns totul cu grijă, ca locul să rămână curat pentru alții.',
        en: 'On Sunday, three families of friends had a picnic by the river. Each one brought something: sandwiches, pies, fruit and a big bottle of lemonade. They spread their blankets in the shade of a willow and put the food in the middle. The children played football and caught butterflies, while the adults talked and laughed. Towards evening they carefully packed everything away, so that the place would stay clean for others.',
    },
];

/** One decimal, so 0.7 - 0.1 stays 0.6 and not 0.6000000001. */
const r1 = (v: number): number => Math.round(v * 10) / 10;
const countWords = (text: string): number =>
    text.split(/\s+/).filter(Boolean).length;
const shuffled = (n: number): number[] => {
    const a = Array.from({ length: n }, (_, i) => i);

    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
};

/** Height of the letter x as a fraction of the font size, measured for the font the browser really uses. */
function xHeightRatio(): number {
    const fallback = 0.545; // Verdana

    try {
        const c = document.createElement('canvas').getContext('2d');

        if (!c) {
            return fallback;
        }

        c.font = `100px ${FONT}`;
        const ratio = c.measureText('x').actualBoundingBoxAscent / 100;

        return ratio > 0.3 && ratio < 0.8 ? ratio : fallback;
    } catch {
        return fallback;
    }
}

export default function start(rt: Runtime): void {
    const { $ } = rt;
    const fmt = (n: number, d: number): string => {
        const s = Number(n).toFixed(d);

        return getLocale() === 'en' ? s : s.replace('.', ',');
    };
    /** "0,7" / "−0,1" */
    const lm = (v: number): string =>
        `${v < 0 ? '−' : ''}${fmt(Math.abs(r1(v)), 1)}`;
    const cell = (label: string, value: string | number): string =>
        `<div><span>${label}</span><b>${value}</b></div>`;
    const stage = $('readStage');
    const textEl = $('readText');
    const noteEl = $('readNote');
    const mainBtn = $<HTMLButtonElement>('mainBtn');
    const rateBox = $('rateBox');
    const st = Amb.settings();
    const ratio = xHeightRatio();
    const RATING_LABEL: Record<Rating, string> = {
        easy: t('Easy'),
        effort: t('With effort'),
        failed: t('Could not read it'),
    };

    // smallest size whose x-height is still at least 3 device pixels
    const floorLogmar = Math.max(
        MIN_LOGMAR,
        Math.ceil(Math.log10(Amb.devPxToArcmin(3) / 5) * 10 - 1e-6) / 10,
    );
    const clampL = (v: number): number =>
        r1(Math.min(MAX_LOGMAR, Math.max(floorLogmar, v)));

    let phase: 'ready' | 'reading' | 'paused' | 'rating' | 'done' = 'ready';
    let logmar = FIRST_LOGMAR;
    let items: Item[] = [];
    let roundTexts: number[] = [];
    let startedAt = 0;
    let elapsed = 0;
    let lastFloorEasy = false;

    /* ---------- texts ---------- */
    /** Next texts in a shuffled order kept across rounds, so a text comes back only after all the others. */
    function pickTexts(n: number): number[] {
        let queue: number[] = [];

        try {
            const saved = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as unknown;

            if (Array.isArray(saved)) {
                queue = saved.filter(
                    (i): i is number =>
                        Number.isInteger(i) && i >= 0 && i < PASSAGES.length,
                );
            }
        } catch {
            // storage blocked
        }

        const picked: number[] = [];

        while (picked.length < n) {
            if (!queue.length) {
                queue = shuffled(PASSAGES.length).filter(
                    (i) => !picked.includes(i),
                );
            }

            picked.push(queue.shift()!);
        }

        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch {
            // ignore
        }

        return picked;
    }

    function passage(i: number): string {
        const p = PASSAGES[i];

        return getLocale() === 'en' ? p.en : p.ro;
    }

    /** Start size: last round's smallest "easy" size + 0.1 (0.7 the first time). */
    function startLogmar(): number {
        const last = Amb.results(ID).pop();

        if (!last) {
            return FIRST_LOGMAR;
        }

        if (typeof last.logmar_easy === 'number') {
            return clampL(last.logmar_easy + 0.1);
        }

        if (typeof last.logmar_min === 'number') {
            return clampL(last.logmar_min + 0.2);
        }

        // nothing was readable last time: start with the largest print
        return MAX_LOGMAR;
    }

    /** Font size in CSS px so that the x-height matches the logMAR at the exercise distance. */
    function fontSizeFor(v: number): number {
        const xHeightCss = Amb.arcminToDevPx(5 * Math.pow(10, v)) / Amb.dpr();

        return xHeightCss / ratio;
    }

    /* ---------- display ---------- */
    function renderStage(): void {
        const col = Amb.monoColors();
        stage.style.background = col.bg;
        const showing = phase === 'reading';
        textEl.hidden = !showing;
        noteEl.hidden = showing;

        if (showing) {
            textEl.style.color = col.fg;
            textEl.style.fontFamily = FONT;
            textEl.style.fontSize = `${fontSizeFor(logmar)}px`;
            textEl.textContent = passage(roundTexts[items.length]);

            return;
        }

        textEl.textContent = '';
        // grey that reads on the stage colour (black with glasses, white with the patch)
        noteEl.style.color = Amb.isAnaglyph() ? '#8a96a3' : '#5b6676';
        noteEl.textContent =
            phase === 'rating'
                ? t('How was this text?')
                : phase === 'paused'
                  ? t('Paused.')
                  : phase === 'done'
                    ? t('The round is over.')
                    : t('Text :n of :total appears here when you press “Start”.', {
                          n: items.length + 1,
                          total: TEXTS_PER_ROUND,
                      });
    }

    function fb(text: string, ok?: boolean): void {
        const el = $('fb');
        el.textContent = text;
        el.className =
            'feedback' + (ok === true ? ' good' : ok === false ? ' bad' : '');
    }

    function renderHistory(): void {
        const list = $('hist');
        list.innerHTML = '';

        items.forEach((it, i) => {
            const li = document.createElement('li');
            const speed =
                it.rating === 'failed'
                    ? ''
                    : ` · ${t(':wpm words/min', { wpm: Math.round(it.words / (it.ms / 60000)) })}`;
            li.textContent = `${i + 1}. ${lm(it.logmar)} logMAR · ${RATING_LABEL[it.rating]}${speed}`;
            li.className = `r-${it.rating}`;
            list.appendChild(li);
        });

        list.hidden = !items.length;
    }

    function ui(): void {
        const n = items.length;
        $('sText').textContent = `${Math.min(n + (phase === 'done' ? 0 : 1), TEXTS_PER_ROUND)} / ${TEXTS_PER_ROUND}`;
        $('sSize').textContent = `${lm(logmar)} logMAR`;
        const last = [...items].reverse().find((i) => i.rating !== 'failed');
        $('sSpeed').textContent = last
            ? t(':wpm words/min', {
                  wpm: Math.round(last.words / (last.ms / 60000)),
              })
            : '–';
        $('prog').style.width = `${(n / TEXTS_PER_ROUND) * 100}%`;
        mainBtn.hidden = phase === 'rating' || phase === 'done';
        mainBtn.textContent =
            phase === 'reading'
                ? t('I have finished')
                : phase === 'paused'
                  ? t('Continue')
                  : n === 0
                    ? t('Start')
                    : t('Next text');
        rateBox.hidden = phase !== 'rating';
        renderStage();
        renderHistory();
    }

    /* ---------- round ---------- */
    function newRound(): void {
        items = [];
        roundTexts = pickTexts(TEXTS_PER_ROUND);
        logmar = startLogmar();
        lastFloorEasy = false;
        phase = 'ready';
        fb('');
        ui();
    }

    function showText(): void {
        if (phase !== 'ready') {
            return;
        }

        phase = 'reading';
        elapsed = 0;
        startedAt = performance.now();
        fb('');
        ui();
        Amb.setActive(true);
        stage.scrollIntoView({ block: 'nearest' });
    }

    function stopText(): void {
        if (phase !== 'reading') {
            return;
        }

        elapsed += performance.now() - startedAt;
        phase = 'rating';
        Amb.setActive(false);
        ui();
        // no focus on a rating button: a second Space must not rate the text by accident
        mainBtn.blur();
    }

    function rate(r: Rating): void {
        if (phase !== 'rating') {
            return;
        }

        const text = passage(roundTexts[items.length]);
        const item: Item = {
            logmar,
            rating: r,
            words: countWords(text),
            ms: Math.max(1000, elapsed),
        };
        items.push(item);

        if (r === 'easy' && logmar <= floorLogmar + 1e-9) {
            lastFloorEasy = true;
        }

        if (r === 'failed') {
            Amb.beep('tick');
            fb(
                logmar >= MAX_LOGMAR - 1e-9
                    ? t('No problem: the next text stays at the largest size.')
                    : t('No problem: the next text will be larger.'),
            );
        } else {
            Amb.beep('ok');
            fb(
                t('Time: :sec s · :wpm words/min', {
                    sec: Math.round(item.ms / 1000),
                    wpm: Math.round(item.words / (item.ms / 60000)),
                }),
                true,
            );
        }

        if (items.length >= TEXTS_PER_ROUND) {
            finish();

            return;
        }

        logmar = clampL(
            r === 'easy' ? logmar - 0.1 : r === 'failed' ? logmar + 0.1 : logmar,
        );
        phase = 'ready';
        ui();
        mainBtn.focus();
    }

    function pause(): void {
        if (phase !== 'reading') {
            return;
        }

        elapsed += performance.now() - startedAt;
        phase = 'paused';
        Amb.setActive(false);
        ui();
        Amb.overlay(
            `<h2>${t('Pause')}</h2><p>${t('The text is hidden and the clock is stopped. When you are ready, check the glasses or the patch and press “Continue”.')}</p>`,
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('Continue'), primary: true, onClick: resume },
            ],
        );
    }

    function resume(): void {
        if (phase !== 'paused') {
            return;
        }

        phase = 'reading';
        startedAt = performance.now();
        ui();
        Amb.setActive(true);
    }

    function main(): void {
        if (phase === 'ready') {
            showText();
        } else if (phase === 'reading') {
            stopText();
        } else if (phase === 'paused') {
            resume();
        }
    }

    /** Comparison with the previous round: size in 0.1 logMAR steps, speed in %. */
    function compare(
        cur: { size: number | null; easy: boolean; wpm: number | null },
        prevRes: { size: number | null; easy: boolean; wpm: number | null; mode?: string } | null,
    ): string {
        if (!prevRes) {
            return `<p>${t('This is your first round. Repeat the exercise in the coming days to see how you progress.')}</p>`;
        }

        let h = '';

        if (cur.size != null && prevRes.size != null && cur.easy === prevRes.easy) {
            const steps = Math.round((prevRes.size - cur.size) * 10);

            if (steps > 0) {
                h += `<p class="good">${
                    steps === 1
                        ? t('The smallest text you read was one step (0.1 logMAR) smaller than last time.')
                        : t('The smallest text you read was :n steps (0.1 logMAR each) smaller than last time.', { n: steps })
                }</p>`;
            } else if (steps < 0) {
                h += `<p class="bad">${
                    steps === -1
                        ? t('The smallest text you read was one step larger than last time.')
                        : t('The smallest text you read was :n steps larger than last time.', { n: -steps })
                }</p>`;
            } else {
                h += `<p>${t('Same smallest size as last time.')}</p>`;
            }
        }

        if (cur.wpm != null && prevRes.wpm != null && prevRes.wpm > 0) {
            const p = ((cur.wpm - prevRes.wpm) / prevRes.wpm) * 100;

            if (Math.abs(p) < 5) {
                h += `<p>${t('Reading speed: almost the same as last time.')}</p>`;
            } else if (p > 0) {
                h += `<p class="good">${t('Reading speed: :pct% faster than last time.', { pct: Math.round(p) })}</p>`;
            } else {
                h += `<p class="bad">${t('Reading speed: :pct% slower than last time.', { pct: Math.round(-p) })}</p>`;
            }

            h += `<p class="hint">${t('The speed also depends on the print size, so compare rounds with similar sizes.')}</p>`;
        }

        if (h.includes('class="bad"')) {
            h += `<p>${t('Do not worry: tiredness, light and attention change the result from one day to the next. What matters is the trend over several days.')}</p>`;
        } else if (h.includes('class="good"')) {
            h += `<p>${t('Well done! Regular practice pays off.')}</p>`;
        }

        if (prevRes.mode && prevRes.mode !== Amb.settings().viewMode) {
            h += `<p class="hint">${t('Last time you worked in a different mode (glasses / patch), so the comparison is only a rough guide.')}</p>`;
        }

        return h;
    }

    function finish(): void {
        phase = 'done';
        Amb.setActive(false);
        const read = items.filter((i) => i.rating !== 'failed');
        const easy = items.filter((i) => i.rating === 'easy');
        const logmarEasy = easy.length
            ? r1(Math.min(...easy.map((i) => i.logmar)))
            : null;
        const logmarMin = read.length
            ? r1(Math.min(...read.map((i) => i.logmar)))
            : null;
        const words = read.reduce((a, i) => a + i.words, 0);
        const ms = read.reduce((a, i) => a + i.ms, 0);
        const wpm = read.length && ms > 0 ? Math.round(words / (ms / 60000)) : null;
        const mode = Amb.settings().viewMode;
        const prev = Amb.results(ID).pop();
        Amb.saveResult(ID, {
            logmar_easy: logmarEasy,
            logmar_min: logmarMin,
            wpm,
            texts: items.length,
            read: read.length,
            mode,
        });
        Amb.beep('win');
        ui();

        const num = (v: unknown): number | null =>
            typeof v === 'number' && isFinite(v) ? v : null;
        const prevRes = prev
            ? {
                  size: num(prev.logmar_easy) ?? num(prev.logmar_min),
                  easy: num(prev.logmar_easy) != null,
                  wpm: num(prev.wpm),
                  mode: typeof prev.mode === 'string' ? prev.mode : undefined,
              }
            : null;
        const next = logmarEasy != null ? clampL(logmarEasy + 0.1) : logmarMin != null ? clampL(logmarMin + 0.2) : MAX_LOGMAR;

        Amb.overlay(
            `<h2>${t('Round finished')}</h2>` +
                '<div class="result-grid">' +
                cell(
                    t('Smallest text read easily'),
                    logmarEasy != null ? `${lm(logmarEasy)} logMAR` : '–',
                ) +
                cell(
                    t('Smallest text read'),
                    logmarMin != null ? `${lm(logmarMin)} logMAR` : '–',
                ) +
                cell(
                    t('Reading speed'),
                    wpm != null ? t(':wpm words/min', { wpm }) : '–',
                ) +
                cell(t('Texts read'), `${read.length} / ${items.length}`) +
                '</div>' +
                `<p class="hint">${t('logMAR 0 is about the print size a healthy eye can just read at this distance; each 0.1 step is about 25% larger. Smaller is better. The next round starts at :next logMAR.', { next: lm(next) })}</p>` +
                (lastFloorEasy
                    ? `<p class="good">${t(
                          'You easily read the smallest text this screen can show at this distance. To practise with smaller print, sit further from the screen and update the distance in the <a href=":url">calibration</a>.',
                          { url: Amb.urls.calibration },
                      )}</p>`
                    : '') +
                compare(
                    { size: logmarEasy ?? logmarMin, easy: logmarEasy != null, wpm },
                    prevRes,
                ) +
                `<p class="hint">${t('The figures are training estimates, not a medical diagnosis.')}</p>`,
            [
                { label: t('Menu'), onClick: () => Amb.go(Amb.urls.home) },
                { label: t('One more round'), primary: true, onClick: newRound },
            ],
        );
    }

    /* ---------- input ---------- */
    const KEY_RATING: Record<string, Rating> = {
        '1': 'easy',
        '2': 'effort',
        '3': 'failed',
    };

    rt.on<KeyboardEvent>(document, 'keydown', (e) => {
        if (Amb.modalOpen() || e.repeat || e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        const el = e.target instanceof Element ? e.target : null;

        if (el?.closest('input, select, textarea')) {
            return;
        }

        if (phase === 'rating' && KEY_RATING[e.key]) {
            e.preventDefault();
            rate(KEY_RATING[e.key]);

            return;
        }

        if (e.key !== ' ' && e.key !== 'Enter') {
            return;
        }

        // a focused button or link reacts to Space / Enter by itself
        if (el?.closest('button, a')) {
            return;
        }

        if (phase === 'ready' || phase === 'reading' || phase === 'paused') {
            e.preventDefault();
            main();
        }
    });
    rt.on(mainBtn, 'click', main);
    rt.on($('rEasy'), 'click', () => rate('easy'));
    rt.on($('rEffort'), 'click', () => rate('effort'));
    rt.on($('rFail'), 'click', () => rate('failed'));
    rt.on(window, 'resize', () => {
        if (phase === 'reading') {
            renderStage();
        }
    });

    /* ---------- init ---------- */
    const distLine = t('Sit about :cm cm from the screen.', {
        cm: st.distanceCm,
    });
    $('instr').innerHTML = `<p>${Amb.setupText('mono')}</p><p>${distLine}</p>`;
    const calText =
        t('The screen is not calibrated yet, so the print size is approximate.') +
        ` <a href="${Amb.urls.calibration}">${t('Calibrate the screen size')}</a>.`;

    if (!st.sizeCalibrated) {
        $('calHint').hidden = false;
        $('calHint').innerHTML = calText;
    }

    newRound();

    Amb.startTracking(ID, { onPause: pause, onResume: () => {} });

    Amb.overlay(
        `<h2>${t('Reading with the lazy eye')}</h2>` +
            `<p>${Amb.setupText('mono')}</p>` +
            `<p>${distLine}</p>` +
            `<p>${t(
                'You read :n short texts with the lazy eye only. Press “Start” (or Space): the text appears and the clock starts. ' +
                    'Read it silently, at your usual pace, to the end. Then press “I have finished” and say how it went: ' +
                    '“Easy”, “With effort” or “Could not read it” (keys <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>).',
                { n: TEXTS_PER_ROUND },
            )}</p>` +
            `<p>${t('After “Easy” the next text is smaller, after “With effort” it stays the same, after “Could not read it” it gets larger. The first text has a size of :size logMAR.', { size: lm(logmar) })}</p>` +
            (st.sizeCalibrated ? '' : `<p class="hint">${calText}</p>`),
        [{ label: t('Start'), primary: true, onClick: showText }],
    );
}
