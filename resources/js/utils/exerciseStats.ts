// One line of statistics per exercise card ("Best score: 1200 · 8 games").
import type { AmbResult } from '@/amb';
import { t } from '@/i18n';
import { formatNumber } from '@/utils/format';

export type ExerciseSummary = {
    count: number;
    last: AmbResult | null;
    best: number | null;
    minutes: number;
};

const num = (value: unknown, decimals = 0): string =>
    formatNumber(Number(value), decimals);

export function exerciseStatLine(
    slug: string,
    summary: ExerciseSummary | undefined,
): string {
    const last = summary?.last;

    if (!summary || (!summary.count && !summary.minutes)) {
        return t('Not practised yet');
    }

    const games = t(':count rounds', { count: summary.count });

    if (!last) {
        return t(':min min in total', { min: summary.minutes });
    }

    switch (slug) {
        case 'tetris':
        case 'breakout':
        case 'sarpe':
        case 'inel':
            return `${t('Best score: :score', { score: num(summary.best ?? 0) })} · ${games}`;
        case 'contrast':
            return last.thr != null
                ? t('Last threshold: :pct% at :sf c/deg', {
                      pct: num(Number(last.thr) * 100, Number(last.thr) < 0.1 ? 1 : 0),
                      sf: num(last.sf, 1),
                  })
                : games;
        case 'litera-e':
            return last.decimal != null
                ? t('Last estimated acuity: :value', { value: num(last.decimal, 2) })
                : games;
        case 'vernier':
        case 'relief':
            return last.arcsec != null
                ? t('Last threshold: :value″', { value: num(last.arcsec) })
                : games;
        case 'citire': {
            const size = last.logmar_easy ?? last.logmar_min;

            return size != null
                ? t('Smallest easy print: :value logMAR', { value: num(size, 1) })
                : games;
        }
        case 'convergenta':
            return last.bo_break != null
                ? t('Last convergence break: :value Δ', { value: num(last.bo_break) })
                : last.max_bo != null
                  ? t('Last training: up to :value Δ', { value: num(last.max_bo) })
                  : games;
        case 'fara-ecran':
            return last.break_cm != null
                ? t('Near point of convergence: :value cm', { value: num(last.break_cm) })
                : t(':min min in total', { min: summary.minutes });
        default:
            return games;
    }
}
