// Chart.js setup shared by every chart: registered parts and colours taken
// from the current theme (CSS variables in resources/css/app.css), so the
// charts follow the light / blue / dark theme.
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import type { ChartOptions, ChartType, Plugin } from 'chart.js';
import { intlLocale, t } from '@/i18n';
import { cssColor, themeState } from '@/utils/theme';

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
);

Chart.defaults.font.family =
    "'Instrument Sans', ui-sans-serif, system-ui, sans-serif";
Chart.defaults.font.size = 12;

/**
 * Categorical colour number i (0-based), always used in this order. The
 * values per theme are validated for colour-blind readers (dataviz palette
 * validator: light on white, dark on #11151a).
 */
export function series(i: number): string {
    void themeState.theme;

    return cssColor(`--series-${(i % 6) + 1}`, '#2a78d6');
}

/** Practice time grouped by kind of exercise (stacked bars on the reports), in colour order. */
export const GROUP_ORDER = [
    'dichoptic',
    'mono',
    'stereo',
    'vergence',
    'test',
    'patch',
] as const;

export function groupColor(group: string): string {
    const index = (GROUP_ORDER as readonly string[]).indexOf(group === 'setup' ? 'mono' : group);

    return series(index < 0 ? 1 : index);
}

/** English labels (translate with t() where they are shown). */
export const GROUP_LABELS: Record<string, string> = {
    dichoptic: 'Games with both eyes',
    mono: 'Precision (lazy eye)',
    stereo: '3D relief',
    vergence: 'Strabismus / convergence',
    test: 'Vision tests',
    patch: 'Patching outside the app',
};

/** Eyes in the vision charts: right, left, both. */
export function eyeColor(eye: string): string {
    return series({ right: 0, left: 1, both: 2 }[eye] ?? 0);
}

/** Calendar colours, from "no practice" to "a lot". */
export function heatColors(): string[] {
    void themeState.theme;

    return [0, 1, 2, 3, 4].map((i) => cssColor(`--heat-${i}`));
}

/** Dashed horizontal line at the daily goal (options.plugins.goalLine.value). */
export const goalLine: Plugin = {
    id: 'goalLine',
    afterDatasetsDraw(chart, _args, options) {
        const value = (options as { value?: number }).value;
        const y = chart.scales.y;

        if (!value || !y) {
            return;
        }

        const pixel = y.getPixelForValue(value);
        const { left, right } = chart.chartArea;
        const ctx = chart.ctx;
        const ink = cssColor('--color-fg', '#111');
        ctx.save();
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, pixel);
        ctx.lineTo(right, pixel);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = ink;
        ctx.font = "11px 'Instrument Sans', sans-serif";
        ctx.textAlign = 'right';
        ctx.fillText(t('goal :min min', { min: value }), right, pixel - 4);
        ctx.restore();
    },
};

Chart.register(goalLine);

/** Base options: recessive grid, tooltips, legend at the bottom, theme colours. */
export function baseOptions<T extends ChartType>(
    format: (value: number) => string = (v) => v.toLocaleString(intlLocale()),
): ChartOptions<T> {
    // reading the theme here makes the charts redraw when it changes
    void themeState.theme;
    const muted = cssColor('--color-muted', '#5b6676');
    const grid = cssColor('--chart-grid', '#e8ecf2');
    Chart.defaults.color = muted;

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, boxWidth: 8, padding: 14, color: muted },
            },
            tooltip: {
                backgroundColor: cssColor('--color-panel', '#fff'),
                titleColor: cssColor('--color-fg', '#111'),
                bodyColor: cssColor('--color-fg', '#111'),
                borderColor: cssColor('--color-line-2', '#ccc'),
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                callbacks: {
                    label: (context) => {
                        const name = (context.dataset as { label?: string }).label;

                        return ` ${name ?? context.label}: ${format(Number(context.raw))}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { maxRotation: 0, autoSkipPadding: 10, color: muted },
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: grid },
                ticks: { color: muted, callback: (value) => format(Number(value)) },
            },
        },
    } as ChartOptions<T>;
}
