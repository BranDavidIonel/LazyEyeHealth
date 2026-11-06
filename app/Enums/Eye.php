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
            self::Right => __('Right eye'),
            self::Left => __('Left eye'),
            self::Both => __('Both eyes'),
        };
    }
}
