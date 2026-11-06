// Display helpers in the format of the current language (ro: 1.234,5 / 6 nov. 2026, en: 1,234.5 / 6 Nov 2026).
import { getLocale, intlLocale } from '@/i18n';

export function formatNumber(value: number | null | undefined, decimals = 0): string {
    return new Intl.NumberFormat(intlLocale(), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value ?? 0);
}

/** "2 h 05 min" / "35 min" / "0 min". */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${h} h ${String(m).padStart(2, '0')} min`;
}

function parseDay(value: string): Date {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);

    return new Date(y, m - 1, d);
}

/** 6 nov. 2026 */
export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(intlLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(parseDay(value));
}

/** 6 nov. */
export function formatShortDate(value: string): string {
    return new Intl.DateTimeFormat(intlLocale(), {
        day: 'numeric',
        month: 'short',
    }).format(parseDay(value));
}

/** "Lu", "Ma" ... for the 7/14 day bars. */
export function weekdayShort(value: string): string {
    const names =
        getLocale() === 'ro'
            ? ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']
            : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return names[parseDay(value).getDay()];
}

export function daysBetween(from: string, to: string): number {
    return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 864e5);
}

/* ---------- vision units ---------- */

/** logMAR → decimal acuity (1,0 = normal). */
export function logmarToDecimal(logmar: number): number {
    return Math.pow(10, -logmar);
}

/** logMAR → Snellen at 6 m ("6/12"). */
export function logmarToSnellen(logmar: number): string {
    return `6/${Math.round(6 * Math.pow(10, logmar))}`;
}

/**
 * logMAR → percent of normal vision, the way eye doctors usually say it:
 * decimal acuity × 100 (0.0 logMAR = 100%, 0.3 = 50%, 1.0 = 10%; over 100% = better than normal).
 */
export function logmarToPercent(logmar: number): number {
    return Math.round(Math.pow(10, -logmar) * 100);
}

/** "26%" */
export function formatVisionPercent(logmar: number): string {
    return `${formatNumber(logmarToPercent(logmar))}%`;
}

/** "0,30 logMAR" */
export function formatLogmar(logmar: number): string {
    return `${formatNumber(logmar, 2)} logMAR`;
}

/** Signed with + / −: "+1,5". */
export function signed(value: number, decimals = 1): string {
    const text = formatNumber(Math.abs(value), decimals);

    return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}
