<?php

namespace App\Enums;

enum VisionTestType: string
{
    // Letter chart (ETDRS style, letter-by-letter score in logMAR).
    case Acuity = 'acuity';
    // Sentences in smaller and smaller print (reading acuity + reading speed).
    case Reading = 'reading';
    // Letters of lower and lower contrast (Pelli-Robson style, logCS).
    case Contrast = 'contrast';

    public function label(): string
    {
        return match ($this) {
            self::Acuity => 'Tabel cu litere',
            self::Reading => 'Test de citire',
            self::Contrast => 'Test de contrast',
        };
    }

    /** logMAR: lower = better. Contrast (logCS): higher = better. */
    public function lowerIsBetter(): bool
    {
        return $this !== self::Contrast;
    }

    /** Vue page that runs the test. */
    public function page(): string
    {
        return match ($this) {
            self::Acuity => 'vision/Acuity',
            self::Reading => 'vision/Reading',
            self::Contrast => 'vision/Contrast',
        };
    }

    /**
     * Change below which two tests cannot be told apart (test-retest variability).
     * Letter chart: about 0.1 logMAR (1 line); 0.2 logMAR (2 lines) is a sure change.
     */
    public function noise(): float
    {
        return match ($this) {
            self::Acuity, self::Reading => 0.1,
            self::Contrast => 0.15,
        };
    }
}
