<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Validation\Rule;

/**
 * Exercise settings of a user: defaults from config/eye.php, overridden by
 * what the user saved (lazy eye, glasses, calibration, daily goal...).
 */
class SettingsService
{
    /** @return array<string, mixed> */
    public function defaults(): array
    {
        return config('eye.default_settings');
    }

    /** @return array<string, mixed> */
    public function for(User $user): array
    {
        $saved = $user->settings?->data ?? [];

        return array_merge($this->defaults(), array_intersect_key($saved, $this->defaults()));
    }

    /**
     * Saves the changed keys and returns all the settings.
     *
     * @param  array<string, mixed>  $patch  already validated with rules()
     * @return array<string, mixed>
     */
    public function update(User $user, array $patch): array
    {
        $data = array_merge($this->for($user), $this->normalize($patch));

        UserSetting::query()->updateOrCreate(['user_id' => $user->id], ['data' => $data]);
        $user->unsetRelation('settings');

        return $data;
    }

    /** @return array<string, array<int, mixed>> */
    public static function rules(): array
    {
        return [
            'lazyEye' => ['sometimes', Rule::in(['left', 'right'])],
            'viewMode' => ['sometimes', Rule::in(['anaglyph', 'patch'])],
            'redSide' => ['sometimes', Rule::in(['left', 'right'])],
            'otherLens' => ['sometimes', Rule::in(['cyan', 'blue', 'green'])],
            'redLevel' => ['sometimes', 'integer', 'between:40,255'],
            'otherLevel' => ['sometimes', 'integer', 'between:40,255'],
            'fellowContrast' => ['sometimes', 'numeric', 'between:0.05,1'],
            'autoBalance' => ['sometimes', 'boolean'],
            'dailyGoalMin' => ['sometimes', 'integer', 'between:5,240'],
            'breakEveryMin' => ['sometimes', 'integer', 'between:0,120'],
            'sound' => ['sometimes', 'boolean'],
            'pxPerMm' => ['sometimes', 'numeric', 'between:1,30'],
            'distanceCm' => ['sometimes', 'integer', 'between:20,700'],
            'calibrated' => ['sometimes', 'boolean'],
            'sizeCalibrated' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Same types as the defaults (true instead of "1", 0.3 instead of "0.3").
     *
     * @param  array<string, mixed>  $patch
     * @return array<string, mixed>
     */
    private function normalize(array $patch): array
    {
        $out = [];

        foreach (array_intersect_key($patch, $this->defaults()) as $key => $value) {
            $out[$key] = match (gettype($this->defaults()[$key])) {
                'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                'integer' => (int) $value,
                'double' => round((float) $value, 4),
                default => (string) $value,
            };
        }

        return $out;
    }
}
