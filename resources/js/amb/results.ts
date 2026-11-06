// Results of the exercises. The page gets the previous results from the
// server (prop "results"), new ones are added here and sent to the server.
import { sendOrQueue } from '@/lib/http';
import { dayKey } from './time';

/** One result: { g: exercise, t: time in ms, d: 'YYYY-MM-DD', ...what the exercise measured }. */
export type AmbResult = {
    g: string;
    t: number;
    d: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

const cache = new Map<string, AmbResult[]>();

/** Called by the exercise shell with the "results" prop of the page. */
export function seedResults(map: Record<string, AmbResult[]>): void {
    for (const [key, list] of Object.entries(map)) {
        cache.set(key, [...list]);
    }
}

/** Previous results of an exercise, oldest first (a copy: pop() / filter() are safe). */
export function results(game: string): AmbResult[] {
    return [...(cache.get(game) ?? [])];
}

export function saveResult(
    game: string,
    data: Record<string, unknown>,
): AmbResult {
    const result: AmbResult = { ...data, g: game, t: Date.now(), d: dayKey() };

    cache.set(game, [...(cache.get(game) ?? []), result].slice(-3000));
    void sendOrQueue('POST', '/api/results', { exercise: game, data });

    return result;
}
