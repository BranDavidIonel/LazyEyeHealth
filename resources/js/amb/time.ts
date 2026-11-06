function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' of a date in the browser's time zone (today by default). */
export function dayKey(d: Date = new Date()): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
