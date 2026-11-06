// Small JSON client for the calls the exercise pages make while you play
// (practice time, results, settings). Same session as the pages, so it sends
// Laravel's CSRF token (XSRF-TOKEN cookie) with every request.
//
// If a call fails (no connection, server restarting), it is kept in
// localStorage and sent again on the next page load: no lost minutes.

const QUEUE_KEY = 'lazyeye.queue.v1';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Queued = { method: Method; url: string; body: unknown; at: number };

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export async function api<T = unknown>(
    method: Method,
    url: string,
    body?: unknown,
    options: { keepalive?: boolean } = {},
): Promise<T> {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        keepalive: options.keepalive ?? false,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`${method} ${url}: ${response.status}`);
    }

    return (await response.json()) as T;
}

function readQueue(): Queued[] {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as Queued[];
    } catch {
        return [];
    }
}

function writeQueue(items: Queued[]): void {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-200)));
    } catch {
        // storage blocked: nothing to do
    }
}

/** Sends now; if it fails, keeps it to send later (only for data that must not be lost). */
export async function sendOrQueue<T = unknown>(
    method: Method,
    url: string,
    body: unknown,
    options: { keepalive?: boolean } = {},
): Promise<T | null> {
    try {
        return await api<T>(method, url, body, options);
    } catch {
        writeQueue([...readQueue(), { method, url, body, at: Date.now() }]);

        return null;
    }
}

/** Sends what was kept from failed calls (called once when the app starts). */
export async function flushQueue(): Promise<void> {
    const items = readQueue();

    if (!items.length) {
        return;
    }

    writeQueue([]);
    const failed: Queued[] = [];

    for (const item of items) {
        // Practice time older than 2 days would land on the wrong day: drop it.
        if (
            item.url.endsWith('/practice') &&
            Date.now() - item.at > 2 * 864e5
        ) {
            continue;
        }

        try {
            await api(item.method, item.url, item.body);
        } catch {
            failed.push(item);
        }
    }

    if (failed.length) {
        writeQueue([...failed, ...readQueue()]);
    }
}
