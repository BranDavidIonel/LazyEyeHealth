<?php

namespace App\Enums;

enum Eye: string
{
    case Right = 'right';
    case Left = 'left';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::Right => 'Ochiul drept',
            self::Left => 'Ochiul stâng',
            self::Both => 'Ambii ochi',
        };
    }
}
