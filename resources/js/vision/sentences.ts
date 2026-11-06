// Sentences for the reading test: 10 everyday words each, similar length,
// written for this app (in the spirit of the MNREAD chart, not copied from it).
// One sentence per print size; a new random order every test.

export const SENTENCES: Record<'ro' | 'en', string[]> = {
    ro: [
        'Bunicul a plantat azi trei pomi în grădina din spate.',
        'Copiii se joacă în parc până când soarele apune complet.',
        'Am luat lapte și pâine de la magazinul din colț.',
        'Trenul de seară pleacă din gară exact la ora opt.',
        'Pisica doarme liniștită pe pernă lângă fereastra caldă din sufragerie.',
        'Vecinul nostru repară azi bicicleta fiului său în curtea blocului.',
        'Ploaia de vară a udat toate florile din grădina noastră.',
        'Sora mea citește în fiecare seară câte o carte nouă.',
        'Ne-am plimbat pe malul lacului și am văzut lebede albe.',
        'Medicul i-a spus să bea apă și să se odihnească.',
        'Fratele meu a gătit supă de legume pentru toată familia.',
        'Vântul puternic a rupt câteva crengi uscate din pădurea satului.',
        'Duminică mergem cu toții la munte să vedem cascada mare.',
        'Profesoara a scris pe tablă numele tuturor elevilor din clasă.',
        'Cafeaua de dimineață are un miros plăcut care umple bucătăria.',
        'Poștașul a adus o scrisoare de la o prietenă veche.',
        'Câinele latră de fiecare dată când trece cineva pe stradă.',
        'În weekend am vopsit gardul casei într-o culoare verde deschis.',
    ],
    en: [
        'My grandfather planted three trees in the back garden today.',
        'The children played in the park until the sun set.',
        'I bought milk and bread from the shop next door.',
        'The evening train leaves the station at exactly eight o’clock.',
        'The cat sleeps on a pillow near the warm window.',
        'Our neighbour is fixing his son’s bike in the yard.',
        'The summer rain watered all the flowers in our garden.',
        'My sister reads a new book before sleep every evening.',
        'We walked along the lake and saw two white swans.',
        'The doctor told him to drink water and rest more.',
        'My brother cooked vegetable soup for the whole family tonight.',
        'The strong wind broke a few branches in the forest.',
        'On Sunday we all go to the mountains to hike.',
        'The teacher wrote every pupil’s name on the school board.',
        'The smell of morning coffee slowly fills the whole kitchen.',
        'The postman brought a letter from an old friend yesterday.',
        'The dog barks every time someone walks down our street.',
        'At the weekend we painted the garden fence light green.',
    ],
};

export function wordCount(sentence: string): number {
    return sentence.trim().split(/\s+/).length;
}

export function shuffled<T>(items: T[]): T[] {
    const out = [...items];

    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }

    return out;
}
