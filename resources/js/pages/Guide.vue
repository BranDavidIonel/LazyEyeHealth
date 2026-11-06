<template>
    <Head :title="$t('Guide')" />

    <PageHeader
        :title="$t('Guide')"
        :description="
            $t(
                'How to train, what to watch out for and what the studies say.',
            )
        "
    />

    <!-- eslint-disable vue/no-v-html -- the texts below are written in this file -->
    <div class="grid gap-3" @click="openAppLink">
        <details
            v-for="section in sections"
            :key="section.id"
            class="panel group"
            :open="section.open"
        >
            <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden"
            >
                {{ pick(section.title) }}
                <ChevronDown
                    class="size-5 shrink-0 text-muted transition group-open:rotate-180"
                />
            </summary>
            <div
                class="space-y-3 border-t border-line px-5 py-4 text-sm leading-relaxed"
            >
                <template v-for="(block, i) in section.blocks" :key="i">
                    <p v-if="'p' in block" v-html="pick(block.p)" />
                    <ul v-else class="list-disc space-y-1.5 pl-5">
                        <li
                            v-for="(item, j) in block.ul"
                            :key="j"
                            v-html="pick(item)"
                        />
                    </ul>
                </template>
            </div>
        </details>

        <details class="panel group">
            <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden"
            >
                {{ $t('Sources') }}
                <ChevronDown
                    class="size-5 shrink-0 text-muted transition group-open:rotate-180"
                />
            </summary>
            <div class="border-t border-line px-5 py-4 text-sm">
                <p class="mb-3 text-muted">
                    {{
                        $t(
                            'Studies and guidelines this guide is based on (in English).',
                        )
                    }}
                </p>
                <ul class="space-y-2.5">
                    <li v-for="source in sources" :key="source.url">
                        <a
                            :href="source.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-start gap-1.5 font-medium"
                        >
                            {{ pick(source.title) }}
                            <ExternalLink
                                class="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            <span class="sr-only">{{
                                $t('(opens in a new tab)')
                            }}</span>
                        </a>
                        <span class="block text-muted">{{
                            pick(source.note)
                        }}</span>
                    </li>
                </ul>
            </div>
        </details>
    </div>

    <p class="mt-8 text-xs text-muted">
        {{
            $t(
                'The information here is general and does not replace the advice of your eye doctor.',
            )
        }}
    </p>
</template>

<script lang="ts">
import { ChevronDown, ExternalLink } from '@lucide/vue';
import { Head, router } from '@inertiajs/vue3';
import { defineComponent } from 'vue';
import PageHeader from '@/components/general/PageHeader.vue';
import { getLocale } from '@/i18n';

/** A text in both languages (long paragraphs are kept here instead of i18n/ro). */
type Text = { ro: string; en: string };
type Block = { p: Text } | { ul: Text[] };
type Section = { id: string; title: Text; open?: boolean; blocks: Block[] };
type Source = { title: Text; note: Text; url: string };

const SECTIONS: Section[] = [
    {
        id: 'program',
        open: true,
        title: { ro: 'Program recomandat', en: 'Recommended program' },
        blocks: [
            {
                ul: [
                    {
                        ro: `<b>30–60 de minute pe zi, 5–6 zile pe săptămână</b>, în reprize de 15–20 de minute, cu pauză între ele. Aplicația îți amintește de pauză (o poți schimba în <a href="/setari">Setări</a>).`,
                        en: `<b>30–60 minutes a day, 5–6 days a week</b>, in rounds of 15–20 minutes with a break in between. The app reminds you of the break (you can change it in <a href="/setari">Settings</a>).`,
                    },
                    {
                        ro: `<b>Ordinea unei sesiuni:</b> 15–20 de minute de joc cu ambii ochi (Tetris, Breakout sau Șarpele) cu ochelarii roșu-cyan, apoi 10–15 minute dintr-un exercițiu de precizie cu ochiul leneș (alternează Contrastul fin, Litera E și Citirea). <a href="/">Programul de azi</a> de pe pagina principală le alege pentru tine.`,
                        en: `<b>Order of a session:</b> 15–20 minutes of a game with both eyes (Tetris, Breakout or Snake) with the red-cyan glasses, then 10–15 minutes of a precision exercise with the lazy eye (alternate Fine contrast, Letter E and Reading). <a href="/">Today's program</a> on the home page picks them for you.`,
                    },
                    {
                        ro: `<b>O dată pe săptămână</b> fă <a href="/test-vedere">testul de vedere</a> cu tabelul de litere, pentru fiecare ochi, mereu la aceeași distanță și în aceeași lumină. După aproximativ o lună, comparația lunară îți arată dacă acuitatea s-a schimbat cu adevărat.`,
                        en: `<b>Once a week</b> take the <a href="/test-vedere">vision test</a> with the letter chart, for each eye, always at the same distance and in the same light. After about a month, the monthly comparison shows whether your acuity has really changed.`,
                    },
                    {
                        ro: `Dacă medicul ți-a recomandat exerciții de convergență (de exemplu pentru insuficiență de convergență sau pentru un ochi care fuge spre exterior), adaugă <a href="/exercitii/convergenta">antrenamentul de convergență</a> și <a href="/exercitii-fizice">exercițiile fizice</a> (sfoara Brock, creionul, cartonașul cu butoaie), câte 5–10 minute.`,
                        en: `If your doctor has recommended convergence exercises (for example for convergence insufficiency or an eye that drifts outward), add the <a href="/exercitii/convergenta">convergence training</a> and the <a href="/exercitii-fizice">physical exercises</a> (Brock string, pencil push-ups, barrel card), 5–10 minutes each.`,
                    },
                    {
                        ro: `Stai la 50–70 cm de ecran (distanța din <a href="/calibrare">calibrare</a>), într-o cameră luminată normal, cu luminozitatea ecranului medie spre mare.`,
                        en: `Sit 50–70 cm from the screen (the distance set in the <a href="/calibrare">calibration</a>), in a normally lit room, with the screen brightness medium to high.`,
                    },
                    {
                        ro: `Primele schimbări apar de obicei după 4–12 săptămâni de lucru constant. Creierul adult se adaptează mai încet decât al unui copil, dar studiile arată că se poate adapta.`,
                        en: `The first changes usually show after 4–12 weeks of steady work. An adult brain adapts more slowly than a child's, but studies show that it can adapt.`,
                    },
                    {
                        ro: `Mergi la control la oftalmolog la 2–3 luni și arată-i <a href="/rapoarte">rapoartele</a> de aici (le poți exporta).`,
                        en: `See your ophthalmologist every 2–3 months and show them the <a href="/rapoarte">reports</a> from here (you can export them).`,
                    },
                ],
            },
        ],
    },
    {
        id: 'strabismus',
        title: { ro: 'Ambliopie și strabism', en: 'Amblyopia and strabismus' },
        blocks: [
            {
                p: {
                    ro: `Cele două sunt legate. <b>Strabismul</b> (un ochi deviat) este una dintre cauzele cele mai frecvente ale ambliopiei: creierul ignoră imaginea ochiului deviat ca să nu vadă dublu, iar ochiul acela rămâne „leneș”. O altă cauză frecventă este <b>anizometropia</b>: un ochi are nevoie de o corecție (dioptrii) mult diferită de a celuilalt.`,
                    en: `The two are linked. <b>Strabismus</b> (a misaligned eye) is one of the most common causes of amblyopia: the brain ignores the image of the turned eye to avoid seeing double, and that eye stays "lazy". Another common cause is <b>anisometropia</b>: one eye needs a very different prescription from the other.`,
                },
            },
            {
                ul: [
                    {
                        ro: `Exercițiile de aici antrenează <b>vederea</b> ochiului leneș și <b>colaborarea dintre ochi</b>. Ele nu îndreaptă un ochi deviat.`,
                        en: `The exercises here train the <b>vision</b> of the lazy eye and the <b>teamwork between the eyes</b>. They do not straighten a turned eye.`,
                    },
                    {
                        ro: `Unele forme de strabism (de exemplu insuficiența de convergență sau o deviere intermitentă spre exterior) se tratează și cu exerciții ortoptice de vergență. Antrenamentul de convergență și exercițiile fizice din aplicație sunt de acest tip, dar fă-le după indicația medicului.`,
                        en: `Some forms of strabismus (for example convergence insufficiency or an intermittent outward turn) are also treated with orthoptic vergence exercises. The convergence training and the physical exercises in the app are of this kind, but do them as your doctor advises.`,
                    },
                    {
                        ro: `Strabismul constant se tratează cu ochelari, uneori cu prisme sau cu operație. Recuperarea ambliopiei rămâne importantă și după operație.`,
                        en: `Constant strabismus is treated with glasses, sometimes with prisms or surgery. Treating the amblyopia still matters after surgery.`,
                    },
                    {
                        ro: `Dacă ai strabism sau la testul Worth vezi 5 puncte, întreabă medicul înainte de jocurile cu ochelari roșu-cyan: pot provoca vedere dublă.`,
                        en: `If you have strabismus or see 5 dots in the Worth test, ask your doctor before the games with red-cyan glasses: they can cause double vision.`,
                    },
                ],
            },
        ],
    },
    {
        id: 'safety',
        title: { ro: 'Siguranță', en: 'Safety' },
        blocks: [
            {
                ul: [
                    {
                        ro: `Oprește-te dacă apare vedere dublă care nu trece, durere de cap, greață sau amețeală.`,
                        en: `Stop if you get double vision that does not go away, a headache, nausea or dizziness.`,
                    },
                    {
                        ro: `Nu exersa când ești foarte obosit. Clipește des și respectă pauzele.`,
                        en: `Do not practise when you are very tired. Blink often and take the breaks.`,
                    },
                    {
                        ro: `Exercițiile de convergență obosesc ochii mai repede: fă reprize scurte și oprește-te dacă te doare.`,
                        en: `Convergence exercises tire the eyes faster: keep the rounds short and stop if it hurts.`,
                    },
                    {
                        ro: `Poartă ochelarii de vedere prescriși (pe sub ochelarii roșu-cyan). Exercițiile completează tratamentul, nu îl înlocuiesc.`,
                        en: `Wear your prescribed glasses (under the red-cyan glasses). The exercises complement the treatment, they do not replace it.`,
                    },
                    {
                        ro: `Jocurile nu au lumini intermitente rapide. Dacă ai epilepsie fotosensibilă, întreabă totuși medicul.`,
                        en: `The games have no fast flashing lights. If you have photosensitive epilepsy, ask your doctor anyway.`,
                    },
                    {
                        ro: `Pentru copii, exercițiile se fac doar cu acordul și sub supravegherea medicului.`,
                        en: `Children should do the exercises only with the doctor's approval and supervision.`,
                    },
                ],
            },
        ],
    },
    {
        id: 'how',
        title: { ro: 'Cum funcționează', en: 'How it works' },
        blocks: [
            {
                p: {
                    ro: `Ambliopia este în primul rând o problemă a creierului: ochiul poate fi sănătos, dar creierul a învățat să îi suprime imaginea.`,
                    en: `Amblyopia is first of all a problem of the brain: the eye can be healthy, but the brain has learnt to suppress its image.`,
                },
            },
            {
                ul: [
                    {
                        ro: `<b>Jocurile dihoptice</b> trimit piese diferite fiecărui ochi. Ca să joci, creierul trebuie să combine imaginile ambilor ochi. Ochiul bun primește un contrast redus, ca să nu-l mai „acopere” pe cel leneș, iar contrastul crește pe măsură ce progresezi. Principiul a fost studiat de cercetători precum Hess, Thompson și colaboratorii lor, iar dispozitive aprobate medical pentru copii folosesc aceeași idee.`,
                        en: `<b>Dichoptic games</b> send different pieces to each eye. To play, the brain has to combine the images of both eyes. The good eye gets a reduced contrast so it no longer "covers" the lazy one, and the contrast rises as you progress. The principle was studied by researchers such as Hess, Thompson and their colleagues, and medically approved devices for children use the same idea.`,
                    },
                    {
                        ro: `<b>Învățarea perceptuală</b> înseamnă exersarea repetată a unei sarcini fine, la limita capacității. Dificultatea se adaptează singură, ca să lucrezi mereu la prag.`,
                        en: `<b>Perceptual learning</b> means practising a fine task again and again, at the limit of what you can see. The difficulty adapts by itself, so you always work at your threshold.`,
                    },
                    {
                        ro: `<b>Aglomerarea</b> (crowding) este o problemă tipică a ochiului leneș: literele apropiate se amestecă. Litera E cu vecini, Inelul deschis și Citirea o antrenează direct.`,
                        en: `<b>Crowding</b> is a typical problem of the lazy eye: letters close together run into each other. Letter E with neighbours, Open ring and Reading train it directly.`,
                    },
                    {
                        ro: `<b>Vederea în relief</b> (stereopsis) are nevoie de ambii ochi. Relief 3D o exersează cu puncte aleatorii.`,
                        en: `<b>Depth vision</b> (stereopsis) needs both eyes. 3D relief trains it with random dots.`,
                    },
                    {
                        ro: `<b>Convergența</b> este capacitatea ochilor de a se întoarce împreună spre un obiect apropiat. Antrenamentul de convergență arată câte o imagine fiecărui ochi, pe care le ții într-una singură în timp ce se depărtează.`,
                        en: `<b>Convergence</b> is the ability of the eyes to turn in together towards a near object. The convergence training shows each eye its own picture, and you keep them as one while they move apart.`,
                    },
                    {
                        ro: `<b>Testele de vedere</b> măsoară fiecare ochi separat, cu un tabel de litere în trepte logMAR, ca la cabinet. O schimbare mai mică de aproximativ 2 rânduri poate fi doar variația obișnuită de la o zi la alta, de aceea aplicația compară mai multe teste aflate la o lună distanță.`,
                        en: `<b>Vision tests</b> measure each eye separately, with a letter chart in logMAR steps, as at the clinic. A change of less than about 2 lines can be just the usual day-to-day variation, which is why the app compares several tests a month apart.`,
                    },
                ],
            },
        ],
    },
    {
        id: 'studies',
        title: { ro: 'Ce spun studiile', en: 'What the studies say' },
        blocks: [
            {
                p: {
                    ro: `Pe scurt și cinstit: exercițiile ajută mulți oameni, dar nu pe toți, iar la adulți efectele sunt de obicei modeste.`,
                    en: `Briefly and honestly: the exercises help many people, but not everyone, and in adults the effects are usually modest.`,
                },
            },
            {
                ul: [
                    {
                        ro: `<b>La copii</b>, tratamentul de bază rămâne corecția cu ochelari și ocluzia (sau picăturile de atropină) (Academia Americană de Oftalmologie, 2022). O analiză Cochrane din 2022 a comparat tratamentul binocular (jocuri dihoptice) cu ocluzia: rezultatele au fost asemănătoare, fără un avantaj clar pentru jocuri, iar dovezile nu sunt încă puternice.`,
                        en: `<b>In children</b>, the standard treatment is still glasses and patching (or atropine drops) (American Academy of Ophthalmology, 2022). A 2022 Cochrane review compared binocular treatment (dichoptic games) with patching: the results were similar, with no clear advantage for the games, and the evidence is not yet strong.`,
                    },
                    {
                        ro: `<b>La adulți</b>, ambliopia nu mai este considerată „definitivă”. Studiile de învățare perceptuală (rezumate de Levi și Li, 2009) au găsit îmbunătățiri ale acuității și ale sensibilității la contrast, de obicei modeste, după zeci de ore de antrenament. Studiile sunt mici, iar rezultatele diferă mult de la om la om.`,
                        en: `<b>In adults</b>, amblyopia is no longer seen as "permanent". Perceptual learning studies (reviewed by Levi and Li, 2009) found improvements in acuity and contrast sensitivity, usually modest, after tens of hours of training. The studies are small and the results vary a lot from person to person.`,
                    },
                    {
                        ro: `<b>Vederea în relief:</b> Ding și Levi (2011) au arătat că unii adulți cu ambliopie sau strabism, fără vedere stereo sau cu vedere stereo slabă, au recăpătat-o parțial după un antrenament perceptual specific. Este un studiu mic, dar arată că și această funcție se poate antrena.`,
                        en: `<b>Depth vision:</b> Ding and Levi (2011) showed that some adults with amblyopia or strabismus and absent or weak stereo vision partly regained it after specific perceptual training. It is a small study, but it shows that this function can be trained too.`,
                    },
                    {
                        ro: `<b>Insuficiența de convergență:</b> în studiile CITT, rezumate de Cochrane, terapia la cabinet împreună cu exerciții acasă a ajutat cel mai mult; exercițiile făcute doar acasă (creionul, programe pe calculator) au avut efecte mai mici. La adulți există mai puține dovezi.`,
                        en: `<b>Convergence insufficiency:</b> in the CITT trials, summarised by Cochrane, office-based therapy together with home exercises helped most; exercises done only at home (pencil push-ups, computer programs) had smaller effects. There is less evidence in adults.`,
                    },
                    {
                        ro: `<b>Exotropia intermitentă</b> (un ochi care fuge uneori spre exterior): o analiză Cochrane din 2013 nu a găsit destule studii bune ca să se poată spune care tratament este cel mai bun.`,
                        en: `<b>Intermittent exotropia</b> (an eye that sometimes drifts outward): a 2013 Cochrane review did not find enough good studies to say which treatment works best.`,
                    },
                    {
                        ro: `<b>Ce înseamnă pentru tine:</b> folosește aplicația ca antrenament în plus față de tratamentul recomandat de medic, măsoară-ți vederea regulat și judecă după tendința pe mai multe săptămâni. O schimbare mai mică de 2 rânduri poate fi întâmplătoare (Rosser și colaboratorii, 2003).`,
                        en: `<b>What it means for you:</b> use the app as training in addition to the treatment your doctor recommends, measure your vision regularly and judge by the trend over several weeks. A change of less than 2 lines can be due to chance (Rosser and colleagues, 2003).`,
                    },
                ],
            },
        ],
    },
    {
        id: 'needs',
        title: { ro: 'De ce ai nevoie', en: 'What you need' },
        blocks: [
            {
                ul: [
                    {
                        ro: `<b>Ochelari 3D roșu-cyan</b> (anaglifi), din carton sau plastic. Se găsesc ieftin online. Există și variante clip-on care se pun peste ochelarii de vedere.`,
                        en: `<b>Red-cyan 3D glasses</b> (anaglyph), cardboard or plastic. They are cheap online. There are also clip-on versions that go over prescription glasses.`,
                    },
                    {
                        ro: `<b>Un ocluzor</b> (petic pentru ochi) pentru exercițiile de precizie, dacă nu folosești ochelarii roșu-cyan.`,
                        en: `<b>An eye patch</b> for the precision exercises, if you do not use the red-cyan glasses.`,
                    },
                    {
                        ro: `<b>Un card</b> de mărimea unui card bancar, pentru calibrarea mărimii ecranului, și <b>un metru</b> pentru distanța de la ochi la ecran la testul de vedere.`,
                        en: `<b>A card</b> the size of a bank card, to calibrate the screen size, and <b>a tape measure</b> for the distance from the eyes to the screen in the vision test.`,
                    },
                    {
                        ro: `Pentru <a href="/exercitii-fizice">exercițiile fizice</a>: o sfoară cu câteva mărgele colorate (sfoara Brock), un creion și un cartonaș; pagina lor explică totul.`,
                        en: `For the <a href="/exercitii-fizice">physical exercises</a>: a string with a few coloured beads (Brock string), a pencil and a card; their page explains everything.`,
                    },
                    {
                        ro: `<b>Contul tău</b> din aplicație: setările, timpul de exercițiu, rezultatele și testele de vedere se salvează pe server, în cont, așa că nu se pierd și le vezi de pe orice dispozitiv.`,
                        en: `<b>Your account</b> in the app: the settings, practice time, results and vision tests are saved on the server, in your account, so they are not lost and you can see them from any device.`,
                    },
                    {
                        ro: `Un browser modern (Chrome, Edge, Firefox sau Safari) pe un calculator sau o tabletă; un ecran mare e mai bun pentru exercițiile de precizie.`,
                        en: `A modern browser (Chrome, Edge, Firefox or Safari) on a computer or tablet; a large screen is better for the precision exercises.`,
                    },
                ],
            },
        ],
    },
];

const SOURCES: Source[] = [
    {
        title: {
            ro: 'NEI: Ambliopia (ochiul leneș)',
            en: 'NEI: Amblyopia (lazy eye)',
        },
        note: {
            ro: 'Informații generale de la Institutul Național pentru Ochi (SUA).',
            en: 'General information from the US National Eye Institute.',
        },
        url: 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/amblyopia-lazy-eye',
    },
    {
        title: {
            ro: 'AAO: ghidul de practică pentru ambliopie (2022)',
            en: 'AAO: Amblyopia Preferred Practice Pattern (2022)',
        },
        note: {
            ro: 'Ghidul Academiei Americane de Oftalmologie.',
            en: 'Guideline of the American Academy of Ophthalmology.',
        },
        url: 'https://www.aao.org/preferred-practice-pattern/amblyopia-ppp-2022',
    },
    {
        title: {
            ro: 'Cochrane (2022): tratament binocular față de ocluzie, la copii',
            en: 'Cochrane (2022): binocular treatment versus patching in children',
        },
        note: {
            ro: 'Analiză sistematică a studiilor cu jocuri și filme dihoptice.',
            en: 'Systematic review of the studies with dichoptic games and films.',
        },
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD011347.pub3/information',
    },
    {
        title: {
            ro: 'Ding și Levi (2011), PNAS: recuperarea vederii în relief la adulți',
            en: 'Ding & Levi (2011), PNAS: recovery of stereopsis in adults',
        },
        note: {
            ro: 'Adulți cu ambliopie care au recăpătat parțial vederea stereo prin învățare perceptuală.',
            en: 'Adults with amblyopia who partly regained stereo vision through perceptual learning.',
        },
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3174650/',
    },
    {
        title: {
            ro: 'Levi și Li (2009): învățarea perceptuală în ambliopie',
            en: 'Levi & Li (2009): perceptual learning in amblyopia',
        },
        note: {
            ro: 'Sinteză a studiilor de învățare perceptuală la copii și adulți.',
            en: 'Review of the perceptual learning studies in children and adults.',
        },
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2764839/',
    },
    {
        title: {
            ro: 'Rosser și colaboratorii (2003), BJO: cât variază testul cu litere',
            en: 'Rosser et al. (2003), BJO: test-retest variability of letter charts',
        },
        note: {
            ro: 'De ce o schimbare de cel puțin 2 rânduri (ETDRS) e mai sigur reală.',
            en: 'Why a change of at least 2 lines (ETDRS) is more likely to be real.',
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/12882770/',
    },
    {
        title: {
            ro: 'Cochrane: tratamentele insuficienței de convergență (studiile CITT)',
            en: 'Cochrane: treatments for convergence insufficiency (CITT trials)',
        },
        note: {
            ro: 'Compară terapia la cabinet, exercițiile acasă și programele pe calculator.',
            en: 'Compares office-based therapy, home exercises and computer programs.',
        },
        url: 'https://www.cochrane.org/evidence/CD006768_how-do-different-treatments-vision-disorder-convergence-insufficiency-compare-effectiveness',
    },
    {
        title: {
            ro: 'Cochrane (2013): tratamentele exotropiei intermitente',
            en: 'Cochrane (2013): interventions for intermittent exotropia',
        },
        note: {
            ro: 'Arată că lipsesc încă studiile bune pentru această formă de strabism.',
            en: 'Shows that good studies for this form of strabismus are still missing.',
        },
        url: 'https://pubmed.ncbi.nlm.nih.gov/23728647/',
    },
];

/** The guide: program, amblyopia and strabismus, safety, how it works, studies, sources. */
export default defineComponent({
    name: 'GuidePage',

    components: { ChevronDown, ExternalLink, Head, PageHeader },

    data() {
        return {
            sections: SECTIONS,
            sources: SOURCES,
        };
    },

    methods: {
        pick(text: Text): string {
            return getLocale() === 'en' ? text.en : text.ro;
        },

        /** Links to app pages inside the texts open without reloading. */
        openAppLink(event: MouseEvent): void {
            const link = (event.target as Element).closest('a');
            const href = link?.getAttribute('href');

            if (link && href?.startsWith('/') && !link.target) {
                event.preventDefault();
                router.visit(href);
            }
        },
    },
});
</script>
