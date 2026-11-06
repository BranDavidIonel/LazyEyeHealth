// Content of the "Physical exercises" page (pages/physical/Index.vue): the
// off-screen exercises, each with what it is for, why it may help, what the
// studies honestly say, steps, dose and stop signs. The long texts are kept
// here in both languages ({ ro, en }, picked with getLocale()); short labels
// of the page use t() with resources/js/i18n/ro/physical.ts.
import { getLocale } from '@/i18n';
import type { Replacements } from '@/i18n';

export type Text = { ro: string; en: string };

/** Text in the current language, with :placeholders filled. */
export function tx(text: Text, replacements: Replacements = {}): string {
    let out = text[getLocale()];
    const names = Object.keys(replacements).sort((a, b) => b.length - a.length);

    for (const name of names) {
        out = out.replaceAll(`:${name}`, String(replacements[name]));
    }

    return out;
}

export type ExerciseKey =
    | 'brock'
    | 'pencil'
    | 'barrel'
    | 'nearfar'
    | 'patching'
    | 'drift'
    | 'rest';

export type FigureName =
    | 'brockTop'
    | 'brockView'
    | 'brockSigns'
    | 'pencil'
    | 'barrel'
    | 'nearfar'
    | 'patching'
    | 'drift'
    | 'rest';

export type Target = 'amblyopia' | 'exotropia' | 'both' | 'comfort';

export type GuideExercise = {
    key: ExerciseKey;
    title: Text;
    target: Target;
    /** Why it may help, in plain words. */
    why: Text;
    /** What the studies say (honestly). */
    evidence: Text;
    need: Text[];
    /** Numbered steps (may contain <b>). */
    steps: Text[];
    /** How long / how often. */
    dose: Text;
    right: Text[];
    stop: Text[];
    /** Optional extra block (e.g. what the Brock string picture means). */
    extra?: { title: Text; items: Text[] };
    /** Optional safety note shown in the card. */
    caution?: Text;
    figures: { name: FigureName; caption: Text }[];
    /** Timer lengths in seconds (first = suggested); tracked = counts as practice time. */
    timer: { options: number[]; tracked: boolean };
};

export const GUIDE: GuideExercise[] = [
    {
        key: 'brock',
        title: { ro: 'Sfoara Brock', en: 'Brock string' },
        target: 'both',
        why: {
            ro: 'Sfoara îți arată pe loc ce face fiecare ochi. Fiecare ochi vede propria „copie” a sforii, așa că, atunci când ambii ochi țintesc aceeași mărgea, cele două copii se încrucișează exact în ea, ca un X. Dacă o copie dispare, creierul a „oprit” un ochi (suprimare); dacă încrucișarea fuge în spatele mărgelei, ochii nu converg destul – exact ce face ochiul care fuge spre ureche. Exercițiul te învață să simți asta și să corectezi.',
            en: 'The string shows you, right away, what each eye is doing. Each eye sees its own “copy” of the string, so when both eyes aim at the same bead the two copies cross exactly there, like an X. If one copy disappears, the brain has switched one eye off (suppression); if the crossing slips behind the bead, the eyes are not converging enough – exactly what the eye that drifts towards the ear does. The exercise teaches you to feel this and correct it.',
        },
        evidence: {
            ro: 'Sfoara Brock e folosită de mult în terapia vederii binoculare (ortoptică), mai ales ca parte din terapia făcută la cabinet. Nu există studii mari care să arate că sfoara singură, acasă, vindecă ceva. În studiul CITT (copii de 9–17 ani cu insuficiență de convergență), cel mai bine a funcționat terapia la cabinet cu exerciții de întărire acasă; exercițiile făcute doar acasă nu au fost mai bune decât placebo. Pentru exotropia intermitentă, dovezile pentru orice tratament sunt foarte limitate (Cochrane, 2013).',
            en: 'The Brock string has long been used in binocular vision therapy (orthoptics), mostly as part of therapy in the office. There are no large studies showing that the string alone, at home, cures anything. In the CITT trial (children 9–17 with convergence insufficiency), office-based therapy with home reinforcement worked best; exercises done only at home were not better than placebo. For intermittent exotropia the evidence for any treatment is very limited (Cochrane, 2013).',
        },
        need: [
            { ro: 'O sfoară de aproximativ 3 m (albă sau deschisă la culoare)', en: 'A string about 3 m long (white or light-coloured)' },
            { ro: '3 mărgele de culori diferite: roșie, galbenă, verde (merg și noduri sau agrafe colorate)', en: '3 beads of different colours: red, yellow, green (knots or coloured clips work too)' },
            { ro: 'Un punct de prindere la nivelul ochilor: clanța ușii, un cui', en: 'Something to tie it to at eye level: a door handle, a hook' },
        ],
        steps: [
            { ro: 'Leagă un capăt al sforii de clanță, la nivelul ochilor. Așază mărgelele: cea <b>roșie</b> la ~40 cm de nas, cea <b>galbenă</b> la ~80 cm, cea <b>verde</b> la ~1,5 m.', en: 'Tie one end of the string to the door handle, at eye level. Place the beads: the <b>red</b> one ~40 cm from your nose, the <b>yellow</b> one at ~80 cm, the <b>green</b> one at ~1.5 m.' },
            { ro: 'Ține celălalt capăt lipit de vârful nasului, cu sfoara întinsă drept în față. Ambii ochi deschiși, fără ocluzor.', en: 'Hold the other end against the tip of your nose, with the string stretched straight ahead. Both eyes open, no patch.' },
            { ro: 'Privește mărgeaua <b>galbenă</b>. Corect: vezi o singură mărgea galbenă și două sfori care se încrucișează exact în ea, ca un X. Celelalte mărgele apar dublate – e normal.', en: 'Look at the <b>yellow</b> bead. Correct: you see one yellow bead and two strings crossing exactly in it, like an X. The other beads look double – that is normal.' },
            { ro: 'Ține privirea 5–10 secunde, clipind normal. Treci apoi la mărgeaua verde (departe), apoi la cea roșie (aproape). La fiecare, X-ul trebuie să se mute în mărgeaua privită.', en: 'Hold for 5–10 seconds, blinking normally. Then move to the green bead (far), then to the red one (near). Each time the X should move into the bead you look at.' },
            { ro: 'Dacă vezi o singură sfoară, clipește, mișcă ușor sfoara și caută „a doua” sfoară: ea vine de la ochiul care s-a oprit.', en: 'If you see only one string, blink, move the string a little and look for the “second” string: it belongs to the eye that switched off.' },
            { ro: 'Când reușești ușor, apropie mărgeaua roșie cu 2–3 cm spre nas, de la o zi la alta. Nu o aduce mai aproape de punctul în care se dedublează.', en: 'When it is easy, move the red bead 2–3 cm closer to your nose from one day to the next. Do not bring it closer than the point where it doubles.' },
        ],
        dose: {
            ro: '3–5 minute, o dată sau de două ori pe zi – doar dacă medicul nu ți-a spus altceva.',
            en: '3–5 minutes, once or twice a day – unless your doctor told you otherwise.',
        },
        right: [
            { ro: 'Vezi două sfori care se încrucișează în mărgeaua privită (X).', en: 'You see two strings crossing in the bead you look at (X).' },
            { ro: 'Când schimbi mărgeaua, X-ul „sare” în noua mărgea în câteva secunde.', en: 'When you change beads, the X “jumps” to the new bead within a few seconds.' },
            { ro: 'Mărgelele pe care nu le privești apar dublate (vedere dublă normală, fiziologică).', en: 'The beads you are not looking at look double (normal, physiological double vision).' },
        ],
        stop: [
            { ro: 'Dureri de cap, greață sau amețeală.', en: 'Headache, nausea or dizziness.' },
            { ro: 'Vedere dublă care rămâne după ce lași sfoara.', en: 'Double vision that stays after you put the string down.' },
            { ro: 'Ochi foarte încordați sau care lăcrimează mult.', en: 'Eyes that strain a lot or water a lot.' },
        ],
        extra: {
            title: { ro: 'Ce înseamnă ce vezi', en: 'What the picture means' },
            items: [
                { ro: '<b>X în mărgea</b>: ambii ochi țintesc mărgeaua. Așa trebuie.', en: '<b>X in the bead</b>: both eyes aim at the bead. That is the goal.' },
                { ro: '<b>X înaintea mărgelei</b> (mai aproape de tine): ochii converg prea mult.', en: '<b>X in front of the bead</b> (closer to you): the eyes converge too much.' },
                { ro: '<b>X în spatele mărgelei sau un V</b> (sforile se întâlnesc doar departe sau deloc): ochii nu converg destul – ochiul care fuge spre exterior a alunecat. Privește din nou mărgeaua și „adună” ochii.', en: '<b>X behind the bead, or a V</b> (the strings meet only far away or not at all): the eyes do not converge enough – the eye that drifts out has slipped. Look at the bead again and “pull” the eyes together.' },
                { ro: '<b>O singură sfoară</b>: un ochi e „oprit” (suprimare). Sfoara care lipsește ține de ochiul acela.', en: '<b>Only one string</b>: one eye is switched off (suppression). The missing string belongs to that eye.' },
            ],
        },
        figures: [
            { name: 'brockTop', caption: { ro: 'Văzut de sus: ambii ochi țintesc mărgeaua galbenă.', en: 'Seen from above: both eyes aim at the yellow bead.' } },
            { name: 'brockView', caption: { ro: 'Ce vezi corect: un X în mărgeaua privită; celelalte mărgele apar dublate.', en: 'What you should see: an X in the bead you look at; the other beads look double.' } },
            { name: 'brockSigns', caption: { ro: 'Semnele de urmărit.', en: 'Signs to watch for.' } },
        ],
        timer: { options: [300, 180], tracked: true },
    },
    {
        key: 'pencil',
        title: { ro: 'Apropierea creionului', en: 'Pencil push-ups' },
        target: 'exotropia',
        why: {
            ro: 'Când un obiect se apropie de nas, ochii trebuie să se întoarcă spre interior (convergență). Ochiul care fuge spre ureche face exact opusul. Apropierea creionului antrenează convergența și, mai ales, îți dă un număr simplu de urmărit: punctul de convergență – la câți centimetri de nas se dedublează creionul.',
            en: 'When an object comes towards your nose, the eyes must turn inwards (convergence). The eye that drifts towards the ear does the opposite. Pencil push-ups train convergence and, above all, give you a simple number to follow: the near point of convergence – how many centimetres from your nose the pencil doubles.',
        },
        evidence: {
            ro: 'Este exercițiul de acasă cel mai des recomandat, dar în studiul CITT apropierea creionului făcută doar acasă nu a fost mai bună decât placebo la copii (9–17 ani). Măsurarea punctului de convergență este însă un test clinic obișnuit: CITT a considerat „depărtat” un punct de dedublare de 6 cm sau mai mult. Folosește-l mai ales ca să-ți urmărești evoluția și ca informație pentru medic.',
            en: 'It is the most often recommended home exercise, but in the CITT trial pencil push-ups done only at home were not better than placebo in children (9–17). Measuring the near point of convergence is, however, a standard clinical test: CITT counted a break point of 6 cm or more as “receded”. Use it mainly to follow your progress and as information for the doctor.',
        },
        need: [
            { ro: 'Un creion cu o literă mică sau un desen pe el (sau o scobitoare cu un punct)', en: 'A pencil with a small letter or picture on it (or a toothpick with a dot)' },
            { ro: 'O riglă sau un metru de croitorie', en: 'A ruler or a tape measure' },
            { ro: 'Ideal, cineva care să se uite la ochii tăi', en: 'Ideally, someone who watches your eyes' },
        ],
        steps: [
            { ro: 'Stai drept, într-o lumină bună. Ține creionul la distanța brațului, la nivelul ochilor, exact în fața nasului.', en: 'Sit up straight in good light. Hold the pencil at arm’s length, at eye level, right in front of your nose.' },
            { ro: 'Privește litera de pe creion și ține-o clară.', en: 'Look at the letter on the pencil and keep it clear.' },
            { ro: 'Apropie creionul încet, cam 2–3 cm pe secundă, spre rădăcina nasului (punctul dintre ochi).', en: 'Bring the pencil slowly, about 2–3 cm per second, towards the bridge of your nose (the point between the eyes).' },
            { ro: 'Oprește-te când litera se dedublează și nu o mai poți uni, sau când simți că un ochi „scapă”. Cine te ajută vede momentul în care un ochi fuge spre exterior – uneori înainte să observi tu.', en: 'Stop when the letter doubles and you cannot join it, or when you feel one eye “let go”. A helper can see the moment one eye drifts out – sometimes before you notice.' },
            { ro: 'Măsoară cu rigla distanța de la creion la rădăcina nasului: acesta e <b>punctul de dedublare</b>.', en: 'Measure with the ruler the distance from the pencil to the bridge of your nose: this is the <b>break point</b>.' },
            { ro: 'Îndepărtează încet creionul până vezi din nou una singură: acesta e <b>punctul de revenire</b>.', en: 'Move the pencil slowly away until it is single again: this is the <b>recovery point</b>.' },
            { ro: 'Măsoară de 3 ori și notează mai jos valoarea obișnuită. Ca exercițiu: repetă apropierea de 10–15 ori, oprindu-te puțin înainte de punctul de dedublare.', en: 'Measure 3 times and write the usual value below. As an exercise: repeat the push-up 10–15 times, stopping just before the break point.' },
        ],
        dose: {
            ro: 'Măsurarea: o dată pe săptămână, cam la aceeași oră. Exercițiul: 3–5 minute pe zi, dacă medicul e de acord.',
            en: 'Measurement: once a week, at about the same time of day. Exercise: 3–5 minutes a day, if your doctor agrees.',
        },
        right: [
            { ro: 'Litera rămâne clară și una singură până aproape de nas.', en: 'The letter stays clear and single until close to the nose.' },
            { ro: 'Simți un efort ușor de „încrucișare”, fără durere.', en: 'You feel a light “crossing” effort, without pain.' },
            { ro: 'În timp, punctul de dedublare se apropie de nas.', en: 'Over time, the break point comes closer to your nose.' },
        ],
        stop: [
            { ro: 'Dureri de cap sau greață.', en: 'Headache or nausea.' },
            { ro: 'Vedere dublă care nu trece după exercițiu.', en: 'Double vision that does not go away after the exercise.' },
            { ro: 'Punctul de dedublare se depărtează de la o săptămână la alta – spune-i medicului.', en: 'The break point moves further away from week to week – tell your doctor.' },
        ],
        figures: [
            { name: 'pencil', caption: { ro: 'Apropie creionul de rădăcina nasului și măsoară unde se dedublează. Reperul CITT: sub 6 cm.', en: 'Bring the pencil towards the bridge of your nose and measure where it doubles. CITT reference: under 6 cm.' } },
        ],
        timer: { options: [300, 180], tracked: true },
    },
    {
        key: 'barrel',
        title: { ro: 'Cartonașul cu butoaie', en: 'Barrel card' },
        target: 'exotropia',
        why: {
            ro: 'Cartonașul are perechi de butoaie: unul roșu și unul verde. Când ochii converg destul, cele două butoaie dintr-o pereche se suprapun într-unul singur, roșu și verde în același timp. Culorile sunt un control: dacă butoiul unit e doar roșu sau doar verde, un ochi s-a „oprit”. Perechile sunt la distanțe diferite, așa că treci treptat de la o convergență mai ușoară la una mai grea.',
            en: 'The card has pairs of barrels: one red and one green. When the eyes converge enough, the two barrels of a pair overlap into a single one, red and green at the same time. The colours are a check: if the joined barrel is only red or only green, one eye has switched off. The pairs are at different distances, so you move step by step from easier to harder convergence.',
        },
        evidence: {
            ro: 'Cartonașele de convergență (cu butoaie, puncte sau cercuri) sunt exerciții ortoptice clasice. Un studiu din 2006 a arătat că exercițiile ortoptice au redus simptomele la persoane cu insuficiență de convergență sau exoforie decompensată. Dovezile sunt modeste și nu privesc strabismul constant.',
            en: 'Convergence cards (with barrels, dots or circles) are classic orthoptic exercises. A 2006 study found that orthoptic exercises reduced symptoms in people with convergence insufficiency or decompensating exophoria. The evidence is modest and does not cover constant strabismus.',
        },
        need: [
            { ro: 'Cartonașul de mai jos, tipărit la mărime reală (100%) și lipit pe un carton', en: 'The card below, printed at actual size (100%) and glued on cardboard' },
            { ro: 'Un creion, ca să găsești mai ușor punctul în care se unesc', en: 'A pencil, to find the joining point more easily' },
        ],
        steps: [
            { ro: 'Tipărește cartonașul la 100% și verifică cu rigla linia de 50 mm. Lipește-l pe un carton, ca să stea drept.', en: 'Print the card at 100% and check the 50 mm line with a ruler. Glue it on cardboard so it stays straight.' },
            { ro: 'Ține capătul marcat „nas” lipit de vârful nasului, cu cartonașul îndreptat în față și ușor înclinat în jos, cu linia din mijloc pe direcția nasului.', en: 'Hold the end marked “nose” against the tip of your nose, with the card pointing forwards and tilted slightly down, the middle line in line with your nose.' },
            { ro: 'Începe cu perechea <b>1</b> (cea mai mare, departe). Ține vârful creionului între ochi și butoaie, privește vârful și mută-l încet până când, în spatele lui, cele două butoaie se unesc într-unul la mijloc, roșu și verde.', en: 'Start with pair <b>1</b> (the largest, far away). Hold the pencil tip between your eyes and the barrels, look at the tip and move it slowly until, behind it, the two barrels join into one in the middle, red and green.' },
            { ro: 'Coboară creionul și ține butoiul unit 5–10 secunde, cât mai clar. În lateral vei vedea și câte un butoi roșu și unul verde: e normal.', en: 'Lower the pencil and hold the joined barrel for 5–10 seconds, as clear as you can. You will also see a red and a green barrel at the sides: that is normal.' },
            { ro: 'Treci la perechea <b>2</b>, apoi la perechea <b>3</b> (aproape), care cere cea mai multă convergență.', en: 'Move on to pair <b>2</b>, then pair <b>3</b> (near), which needs the most convergence.' },
            { ro: 'Relaxează: privește câteva secunde departe, pe geam, apoi reia.', en: 'Relax: look far away, out of the window, for a few seconds, then start again.' },
        ],
        dose: {
            ro: '3–5 minute pe zi, cu pauze. Nu forța perechea apropiată din prima zi.',
            en: '3–5 minutes a day, with breaks. Do not force the near pair on the first day.',
        },
        right: [
            { ro: 'Butoiul din mijloc are ambele culori, roșu și verde suprapuse.', en: 'The middle barrel shows both colours, red and green on top of each other.' },
            { ro: 'Poți ține butoiul unit câteva secunde fără să se rupă.', en: 'You can hold the joined barrel for a few seconds without it breaking.' },
            { ro: 'Butoaiele celorlalte perechi apar dublate – e normal.', en: 'The barrels of the other pairs look double – that is normal.' },
        ],
        stop: [
            { ro: 'Durere, greață sau amețeală.', en: 'Pain, nausea or dizziness.' },
            { ro: 'Vedere dublă care rămâne după exercițiu.', en: 'Double vision that stays after the exercise.' },
            { ro: 'Dacă după câteva zile nu reușești deloc să unești nici perechea mare, nu insista – întreabă medicul.', en: 'If after a few days you cannot join even the large pair, do not insist – ask your doctor.' },
        ],
        figures: [
            { name: 'barrel', caption: { ro: 'Ochiul stâng privește butoiul verde, ochiul drept pe cel roșu: privirile se încrucișează în fața cartonașului (la vârful creionului) și vezi un butoi unit, roșu cu verde.', en: 'The left eye looks at the green barrel, the right eye at the red one: the lines of sight cross in front of the card (at the pencil tip) and you see one joined red-and-green barrel.' } },
        ],
        timer: { options: [300, 180], tracked: true },
    },
    {
        key: 'nearfar',
        title: { ro: 'Aproape – departe', en: 'Near – far' },
        target: 'both',
        why: {
            ro: 'Mutarea privirii de la un text apropiat la unul îndepărtat antrenează focalizarea (acomodația) și legătura dintre focalizare și convergență. Cu ocluzorul pe ochiul bun, ochiul leneș face singur munca de focalizare pe detalii. Fără ocluzor, cu ambii ochi, exersezi să păstrezi o singură imagine la fiecare schimbare de distanță.',
            en: 'Switching your gaze from a near text to a far one trains focusing (accommodation) and the link between focusing and convergence. With the patch on the good eye, the lazy eye does the focusing work on details alone. Without the patch, with both eyes, you practise keeping one single picture at every change of distance.',
        },
        evidence: {
            ro: 'Salturile aproape–departe fac parte din programele de terapie folosite în studiile pentru insuficiența de convergență (de exemplu terapia de cabinet din CITT), dar nu au fost testate singure. Ia-le ca exercițiu de antrenament, nu ca tratament dovedit.',
            en: 'Near–far jumps are part of the therapy programmes used in convergence insufficiency studies (for example the office therapy in CITT), but they have not been tested on their own. Take them as practice, not as a proven treatment.',
        },
        need: [
            { ro: 'Un text mic, de aproape (o carte, un cartonaș cu litere)', en: 'A small near text (a book, a card with letters)' },
            { ro: 'Un text mare, departe (un calendar, un poster) la ~3 m', en: 'A large far text (a calendar, a poster) at ~3 m' },
            { ro: 'Ocluzorul, pentru varianta cu ochiul leneș', en: 'The patch, for the lazy-eye version' },
        ],
        steps: [
            { ro: 'Lipește pe perete un text mare, la nivelul ochilor, și stai la ~3 m de el.', en: 'Put a large text on the wall at eye level and stand ~3 m from it.' },
            { ro: 'Ține un text mic în mână, la ~40 cm. Pentru ochiul leneș: pune ocluzorul pe ochiul :good (cel bun). Pentru convergență: ține ambii ochi deschiși.', en: 'Hold a small text in your hand at ~40 cm. For the lazy eye: put the patch on the :good eye (the good one). For convergence: keep both eyes open.' },
            { ro: 'Citește o literă de aproape până e clară, apoi o literă de departe până e clară.', en: 'Read a near letter until it is clear, then a far letter until it is clear.' },
            { ro: 'Alternează în ritmul tău, de 10–20 de ori. Contează ca imaginea să devină repede clară, nu viteza mișcării.', en: 'Switch at your own pace, 10–20 times. What matters is that the picture gets clear quickly, not how fast you move.' },
            { ro: 'Cu ambii ochi: la fiecare schimbare verifică să vezi o singură imagine. Dacă ochiul fuge, rămâi pe textul apropiat până se adună.', en: 'With both eyes: at every switch check that you see one single picture. If the eye drifts, stay on the near text until the eyes come together.' },
        ],
        dose: {
            ro: '3–5 minute, o dată sau de două ori pe zi.',
            en: '3–5 minutes, once or twice a day.',
        },
        right: [
            { ro: 'Literele devin clare în 1–2 secunde la fiecare schimbare.', en: 'The letters get clear within 1–2 seconds at every switch.' },
            { ro: 'Cu ambii ochi nu vezi dublu, nici aproape, nici departe.', en: 'With both eyes you do not see double, near or far.' },
        ],
        stop: [
            { ro: 'Dureri de cap sau ochi foarte obosiți.', en: 'Headache or very tired eyes.' },
            { ro: 'Vedere dublă care rămâne.', en: 'Double vision that stays.' },
        ],
        figures: [
            { name: 'nearfar', caption: { ro: 'Privirea sare între textul de aproape (~40 cm) și cel de departe (~3 m).', en: 'The gaze jumps between the near text (~40 cm) and the far one (~3 m).' } },
        ],
        timer: { options: [300, 180], tracked: true },
    },
    {
        key: 'patching',
        title: { ro: 'Ocluzia cu activități de aproape', en: 'Patching with near activities' },
        target: 'amblyopia',
        why: {
            ro: 'Când acoperi ochiul bun, creierul e obligat să folosească ochiul leneș. Activitățile de aproape, cu detalii mici, îl fac să lucreze activ, nu doar să „stea deschis”.',
            en: 'When you cover the good eye, the brain has to use the lazy eye. Near activities with small details make it work actively, not just “stay open”.',
        },
        evidence: {
            ro: 'Ocluzia (acoperirea ochiului mai bun) este tratamentul de bază al ambliopiei (NEI, ghidul AAO 2022). Studiile PEDIG au arătat că ajută și copiii mai mari, de 7–17 ani, mai ales dacă nu au mai fost tratați. La adulți tratamentul e mai puțin eficient și mult mai puțin studiat: unii câștigă puțin, alții deloc. Discută cu medicul câte ore ți se potrivesc.',
            en: 'Patching (covering the better eye) is the basic treatment of amblyopia (NEI, AAO guideline 2022). PEDIG studies showed that it also helps older children aged 7–17, especially if they were never treated before. In adults the treatment is less effective and much less studied: some gain a little, others nothing. Discuss with your doctor how many hours suit you.',
        },
        need: [
            { ro: 'Un ocluzor adeziv sau din material, care nu lasă lumină pe la margini', en: 'An adhesive or fabric patch that lets no light in at the edges' },
            { ro: 'Activități de aproape: citit, puzzle, desen, colorat, sortat obiecte mici (mărgele, semințe), jocuri de cărți', en: 'Near activities: reading, puzzles, drawing, colouring, sorting small objects (beads, seeds), card games' },
        ],
        steps: [
            { ro: 'Pune ocluzorul pe ochiul <b>:good</b> (cel bun). Nu trebuie să poți privi pe lângă el.', en: 'Put the patch on the <b>:good</b> eye (the good one). You must not be able to peek around it.' },
            { ro: 'Alege o activitate cu detalii mici, la 30–40 cm: citit, puzzle, desen, sortat mărgele sau semințe.', en: 'Choose an activity with small details at 30–40 cm: reading, a puzzle, drawing, sorting beads or seeds.' },
            { ro: 'Lucrează 20–30 de minute, apoi fă o pauză scurtă privind departe (tot cu ocluzorul).', en: 'Work for 20–30 minutes, then take a short break looking far away (still with the patch).' },
            { ro: 'Adună 1–2 ore pe zi, sau cât îți recomandă medicul.', en: 'Add up 1–2 hours a day, or as much as your doctor recommends.' },
            { ro: 'Notează minutele de ocluzie în jurnalul zilnic de pe pagina Acasă, ca să le vezi în rapoarte.', en: 'Write the patching minutes in the daily journal on the Home page, so you see them in the reports.' },
        ],
        dose: {
            ro: '1–2 ore pe zi, în bucăți de 20–30 de minute.',
            en: '1–2 hours a day, in blocks of 20–30 minutes.',
        },
        right: [
            { ro: 'Ochiul bun e complet acoperit.', en: 'The good eye is fully covered.' },
            { ro: 'În timp, activitatea devine mai ușoară cu ochiul leneș.', en: 'Over time the activity gets easier with the lazy eye.' },
            { ro: 'Ai notat minutele în jurnal.', en: 'You wrote the minutes in the journal.' },
        ],
        stop: [
            { ro: 'Vedere dublă care apare după ce scoți ocluzorul (mai ales dacă ai strabism) – spune-i medicului.', en: 'Double vision that appears after you take the patch off (especially with a strabismus) – tell your doctor.' },
            { ro: 'Iritații ale pielii de la ocluzorul adeziv – schimbă tipul.', en: 'Skin irritation from the adhesive patch – change the type.' },
            { ro: 'Ochiul bun vede mai slab după ocluzie – mergi la medic.', en: 'The good eye sees worse after patching – see your doctor.' },
        ],
        caution: {
            ro: 'Nu conduce și nu face activități periculoase cu ochiul bun acoperit: vederea în relief și câmpul vizual sunt mai mici.',
            en: 'Do not drive or do anything dangerous with the good eye covered: depth vision and the field of view are smaller.',
        },
        figures: [
            { name: 'patching', caption: { ro: 'Ocluzorul stă pe ochiul bun; ochiul leneș lucrează pe detalii de aproape.', en: 'The patch is on the good eye; the lazy eye works on near details.' } },
        ],
        timer: { options: [3600, 1800, 5400, 7200], tracked: false },
    },
    {
        key: 'drift',
        title: { ro: 'Controlul ochiului care fuge', en: 'Controlling the drifting eye' },
        target: 'exotropia',
        why: {
            ro: 'În exotropia intermitentă, ochiul fuge spre exterior mai ales când ești obosit, privești departe sau „visezi cu ochii deschiși”. Mulți oameni nu observă, pentru că creierul oprește imaginea ochiului care fuge. Dacă înveți să simți momentul – cu ajutorul vederii duble normale – îl poți readuce privind un punct apropiat. Iar ce observi (cât de des, când) e o informație foarte utilă pentru medic.',
            en: 'In intermittent exotropia the eye drifts out mostly when you are tired, look far away or daydream. Many people do not notice, because the brain switches off the drifting eye’s picture. If you learn to feel the moment – with the help of normal double vision – you can bring the eye back by looking at a near point. And what you notice (how often, when) is very useful information for the doctor.',
        },
        evidence: {
            ro: 'Pentru exotropia intermitentă, dovezile pentru orice tratament sunt foarte limitate (Cochrane, 2013). Conștientizarea vederii duble și readucerea ochiului fac parte din exercițiile ortoptice clasice; nu e garantat că schimbă unghiul strabismului, dar te ajută să-l controlezi și să-l descrii medicului.',
            en: 'For intermittent exotropia the evidence for any treatment is very limited (Cochrane, 2013). Double-vision awareness and bringing the eye back are part of classic orthoptic exercises; they are not guaranteed to change the angle of the strabismus, but they help you control it and describe it to the doctor.',
        },
        need: [
            { ro: 'Degetul tău sau un creion', en: 'Your finger or a pencil' },
            { ro: 'O oglindă (sau camera frontală a telefonului)', en: 'A mirror (or the phone’s front camera)' },
            { ro: 'Opțional: cineva care să-ți spună când fuge ochiul', en: 'Optional: someone who tells you when the eye drifts' },
        ],
        steps: [
            { ro: 'Ține degetul arătător la 30 cm în fața nasului și privește un obiect îndepărtat, în spatele lui. Ar trebui să vezi <b>două degete</b>, transparente: e vederea dublă normală (fiziologică) și arată că ambii ochi lucrează.', en: 'Hold your index finger 30 cm in front of your nose and look at a far object behind it. You should see <b>two fingers</b>, see-through: that is normal (physiological) double vision and it shows both eyes are working.' },
            { ro: 'Acum privește degetul: cele două degete se unesc într-unul, iar obiectul din spate se dedublează. Alternează de 10 ori.', en: 'Now look at the finger: the two fingers join into one and the object behind doubles. Switch 10 times.' },
            { ro: 'Dacă vezi un singur deget când privești departe, un ochi s-a „oprit”. Clipește și încearcă să-l aduci înapoi.', en: 'If you see only one finger while looking far, one eye has switched off. Blink and try to bring it back.' },
            { ro: 'În oglindă, de la ~40 cm: privește-ți ochii, apoi un punct îndepărtat din oglindă (reflexia camerei). Observă dacă ochiul :lazy alunecă spre ureche.', en: 'In a mirror, from ~40 cm: look at your eyes, then at a far point in the mirror (the reflection of the room). Notice whether the :lazy eye slides towards the ear.' },
            { ro: 'Când simți sau vezi că ochiul fuge, privește un punct apropiat (vârful degetului, la 30 cm) până se adună la loc, apoi privește din nou departe.', en: 'When you feel or see the eye drift, look at a near point (your fingertip at 30 cm) until it comes back, then look far again.' },
            { ro: 'Notează câteva zile când fuge ochiul (oboseală, seara, privind departe) și spune-i medicului.', en: 'For a few days, write down when the eye drifts (tiredness, evenings, looking far) and tell your doctor.' },
        ],
        dose: {
            ro: 'Câteva minute pe zi, plus atenție în timpul zilei.',
            en: 'A few minutes a day, plus attention during the day.',
        },
        right: [
            { ro: 'Vezi două degete când privești departe.', en: 'You see two fingers when you look far.' },
            { ro: 'Poți readuce ochiul în câteva secunde privind aproape.', en: 'You can bring the eye back within a few seconds by looking near.' },
            { ro: 'Observi tot mai repede momentele în care ochiul fuge.', en: 'You notice the moments when the eye drifts sooner and sooner.' },
        ],
        stop: [
            { ro: 'Vedere dublă care nu mai dispare.', en: 'Double vision that no longer goes away.' },
            { ro: 'Ochiul fuge mai des sau rămâne afară tot timpul – mergi la medic.', en: 'The eye drifts more often or stays out all the time – see your doctor.' },
        ],
        figures: [
            { name: 'drift', caption: { ro: 'Ochiul :lazy fuge spre ureche; privind un punct apropiat îl aduci înapoi.', en: 'The :lazy eye drifts towards the ear; looking at a near point brings it back.' } },
        ],
        timer: { options: [180, 300], tracked: true },
    },
    {
        key: 'rest',
        title: { ro: 'Pauzele 20-20-20 și clipitul', en: '20-20-20 breaks and blinking' },
        target: 'comfort',
        why: {
            ro: 'La ecran sau la citit clipim mai rar, iar ochii stau mult timp fixați aproape. Pauzele scurte relaxează focalizarea și umezesc ochii.',
            en: 'At a screen or while reading we blink less, and the eyes stay focused near for a long time. Short breaks relax focusing and keep the eyes moist.',
        },
        evidence: {
            ro: 'Este un sfat de confort, nu un tratament: nu schimbă ambliopia și nici strabismul. Te ajută doar să lucrezi fără ochi obosiți.',
            en: 'This is a comfort tip, not a treatment: it does not change amblyopia or strabismus. It only helps you work without tired eyes.',
        },
        need: [
            { ro: 'Un loc de unde poți privi la cel puțin 6 metri (geamul, capătul camerei)', en: 'A place where you can look at least 6 metres away (a window, the end of the room)' },
        ],
        steps: [
            { ro: 'La fiecare 20 de minute de lucru de aproape, ridică privirea.', en: 'Every 20 minutes of near work, look up.' },
            { ro: 'Privește 20 de secunde ceva aflat la cel puțin 6 metri (20 de picioare).', en: 'Look for 20 seconds at something at least 6 metres (20 feet) away.' },
            { ro: 'În pauză, clipește complet de 10 ori: închide bine ochii, apoi deschide-i.', en: 'During the break, blink fully 10 times: close your eyes well, then open them.' },
            { ro: 'În timpul exercițiilor de pe ecran, aplicația îți amintește singură de pauză (intervalul se schimbă din setări).', en: 'During the screen exercises the app reminds you of the break by itself (you can change the interval in the settings).' },
        ],
        dose: {
            ro: 'La fiecare 20 de minute, 20 de secunde.',
            en: 'Every 20 minutes, for 20 seconds.',
        },
        right: [
            { ro: 'Ochii se simt mai odihniți după pauză.', en: 'Your eyes feel more rested after the break.' },
        ],
        stop: [
            { ro: 'Dacă ochii rămân roșii, uscați sau dureroși – mergi la medic.', en: 'If the eyes stay red, dry or painful – see your doctor.' },
        ],
        figures: [
            { name: 'rest', caption: { ro: 'La 20 de minute, 20 de secunde privind la peste 6 m.', en: 'Every 20 minutes, 20 seconds looking more than 6 m away.' } },
        ],
        timer: { options: [20], tracked: false },
    },
];

/** Top safety banner. */
export const SAFETY: Text[] = [
    {
        ro: 'Aceste exerciții nu vindecă strabismul și nu garantează vindecarea ambliopiei. Pot ajuta controlul ochilor și confortul, dar dovezile sunt limitate.',
        en: 'These exercises do not cure strabismus and do not guarantee a cure for amblyopia. They can help eye control and comfort, but the evidence is limited.',
    },
    {
        ro: 'La adulții cu strabism vechi, exercițiile care „sparg” suprimarea (de fuziune: sfoara Brock, cartonașul cu butoaie, antrenamentul de convergență) pot scoate la iveală o vedere dublă care uneori nu mai trece.',
        en: 'In adults with a long-standing strabismus, exercises that “break” suppression (fusion exercises: Brock string, barrel card, convergence training) can bring out double vision that sometimes does not go away.',
    },
    {
        ro: 'Exotropia constantă (ochiul e afară tot timpul) se tratează de obicei cu ochelari, prisme sau operație. Fă exercițiile de fuziune doar după un consult la medicul oftalmolog sau la un ortoptist.',
        en: 'Constant exotropia (the eye is out all the time) is usually treated with glasses, prisms or surgery. Do fusion exercises only after an examination by an ophthalmologist or an orthoptist.',
    },
    {
        ro: 'Oprește-te dacă apar dureri de cap, greață, amețeală sau vedere dublă care rămâne după exercițiu.',
        en: 'Stop if you get a headache, nausea, dizziness or double vision that stays after the exercise.',
    },
];

export const NO_EVIDENCE: Text = {
    ro: '„Yoga pentru ochi”, palming-ul (palmele calde peste ochi), rotirea ochilor sau programele care promit că „îndreaptă ochiul” nu vindecă strabismul și nu vindecă ambliopia – nu există studii care să arate asta. Le poți face pentru relaxare, dacă îți plac, dar nu înlocuiesc ochelarii, ocluzia, prismele sau operația atunci când sunt necesare.',
    en: '“Eye yoga”, palming (warm palms over the eyes), eye rolling or programmes that promise to “straighten the eye” do not cure strabismus or amblyopia – there are no studies that show it. You can do them to relax if you like them, but they do not replace glasses, patching, prisms or surgery when these are needed.',
};

export const SEE_DOCTOR: Text[] = [
    { ro: 'Ochiul fuge spre exterior mai des decât înainte sau rămâne afară tot timpul.', en: 'The eye drifts out more often than before, or stays out all the time.' },
    { ro: 'Vezi dublu constant sau vederea dublă nu trece după exerciții.', en: 'You see double all the time, or the double vision does not go away after the exercises.' },
    { ro: 'Ai dureri de cap, greață sau ochi foarte obosiți din cauza exercițiilor.', en: 'You get headaches, nausea or very tired eyes from the exercises.' },
    { ro: 'Înainte să începi exerciții de fuziune (sfoara Brock, cartonașul cu butoaie, antrenamentul de convergență), mai ales ca adult cu strabism vechi.', en: 'Before you start fusion exercises (Brock string, barrel card, convergence training), especially as an adult with a long-standing strabismus.' },
    { ro: 'Vederea scade brusc, la oricare dintre ochi.', en: 'Your vision drops suddenly, in either eye.' },
];

export const SOURCES: { title: Text; url: string }[] = [
    {
        title: {
            ro: 'Cochrane CD006768: tratamentele insuficienței de convergență (include studiul CITT, 2008)',
            en: 'Cochrane CD006768: treatments for convergence insufficiency (includes the CITT trial, 2008)',
        },
        url: 'https://www.cochrane.org/evidence/CD006768_how-do-different-treatments-vision-disorder-convergence-insufficiency-compare-effectiveness',
    },
    {
        title: {
            ro: 'Cochrane 2013: intervenții pentru exotropia intermitentă',
            en: 'Cochrane 2013: interventions for intermittent exotropia',
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/23728647/',
    },
    {
        title: {
            ro: 'Exerciții ortoptice în insuficiența de convergență și exoforia decompensată (2006)',
            en: 'Orthoptic exercises in convergence insufficiency and decompensating exophoria (2006)',
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/17162439/',
    },
    {
        title: {
            ro: 'NEI (National Eye Institute): ambliopia (ochiul leneș)',
            en: 'NEI (National Eye Institute): amblyopia (lazy eye)',
        },
        url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/amblyopia-lazy-eye',
    },
    {
        title: {
            ro: 'AAO: ghidul de practică pentru ambliopie (Preferred Practice Pattern, 2022)',
            en: 'AAO: Amblyopia Preferred Practice Pattern (2022)',
        },
        url: 'https://www.aao.org/preferred-practice-pattern/amblyopia-ppp-2022',
    },
];
