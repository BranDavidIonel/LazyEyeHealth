<?php

namespace Tests\Feature;

use App\Models\UserSetting;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_user_gets_the_defaults(): void
    {
        $this->signIn();

        $this->getJson('/api/settings')
            ->assertOk()
            ->assertExactJson(['settings' => config('eye.default_settings')]);
    }

    public function test_saving_merges_with_the_defaults_and_normalizes_the_types(): void
    {
        $user = $this->signIn();

        $response = $this->putJson('/api/settings', [
            'lazyEye' => 'left',
            'fellowContrast' => '0.45',
            'redLevel' => '200',
            'sound' => '0',
            'autoBalance' => 1,
            'calibrated' => true,
            'pxPerMm' => '4.25',
            'theme' => 'dark',
        ]);

        $response->assertOk();
        $settings = $response->json('settings');

        $this->assertSame([...config('eye.default_settings'), ...[
            'lazyEye' => 'left',
            'fellowContrast' => 0.45,
            'redLevel' => 200,
            'sound' => false,
            'autoBalance' => true,
            'calibrated' => true,
            'pxPerMm' => 4.25,
            'theme' => 'dark',
        ]], $settings);

        $stored = UserSetting::query()->where('user_id', $user->id)->firstOrFail()->data;
        $this->assertSame(0.45, $stored['fellowContrast']);
        $this->assertSame(200, $stored['redLevel']);
        $this->assertFalse($stored['sound']);
        $this->assertSame(4.25, $stored['pxPerMm']);
        $this->assertSame('right', $stored['redSide']);
    }

    public function test_later_changes_keep_the_earlier_ones(): void
    {
        $this->signIn();

        $this->putJson('/api/settings', ['lazyEye' => 'left'])->assertOk();
        $this->putJson('/api/settings', ['dailyGoalMin' => 45])->assertOk();

        $this->getJson('/api/settings')
            ->assertJsonPath('settings.lazyEye', 'left')
            ->assertJsonPath('settings.dailyGoalMin', 45);
        $this->assertSame(1, UserSetting::query()->count());
    }

    public function test_unknown_keys_are_ignored(): void
    {
        $user = $this->signIn();

        $this->putJson('/api/settings', ['lazyEye' => 'left', 'isAdmin' => true])->assertOk()
            ->assertJsonMissingPath('settings.isAdmin');

        $this->assertArrayNotHasKey('isAdmin', UserSetting::query()->where('user_id', $user->id)->firstOrFail()->data);
    }

    public function test_settings_are_validated(): void
    {
        $this->signIn();

        $invalid = [
            ['lazyEye' => 'middle'],
            ['viewMode' => 'vr'],
            ['otherLens' => 'red'],
            ['theme' => 'pink'],
            ['fellowContrast' => 1.5],
            ['fellowContrast' => 0.01],
            ['fellowContrast' => 'half'],
            ['redLevel' => 300],
            ['dailyGoalMin' => 1],
            ['distanceCm' => 5],
            ['sound' => 'maybe'],
        ];

        foreach ($invalid as $patch) {
            $this->putJson('/api/settings', $patch)
                ->assertUnprocessable()
                ->assertJsonValidationErrors(array_keys($patch));
        }

        $this->assertSame(0, UserSetting::query()->count());
    }

    public function test_valid_edge_values(): void
    {
        $this->signIn();

        $this->putJson('/api/settings', ['fellowContrast' => 1, 'theme' => 'blue', 'breakEveryMin' => 0])
            ->assertOk()
            // JSON has no 1.0: a whole float comes back as 1
            ->assertJsonPath('settings.fellowContrast', 1)
            ->assertJsonPath('settings.theme', 'blue')
            ->assertJsonPath('settings.breakEveryMin', 0);

        $this->assertEquals(1.0, UserSetting::query()->firstOrFail()->data['fellowContrast']);
    }

    public function test_the_settings_page_saves_with_a_redirect(): void
    {
        $this->signIn();

        $this->from('/setari')
            ->put('/setari', ['lazyEye' => 'left', 'viewMode' => 'patch'])
            ->assertRedirect('/setari')
            ->assertSessionHas('success', 'Setările au fost salvate.');

        $this->get('/setari')->assertInertia(fn (Assert $page) => $page
            ->where('settings.lazyEye', 'left')
            ->where('settings.viewMode', 'patch')
            // the message is shown once, on the page after the redirect
            ->where('flash.success', 'Setările au fost salvate.'));
    }

    public function test_saved_settings_are_shared_with_every_page(): void
    {
        $this->signIn();
        $this->putJson('/api/settings', ['lazyEye' => 'left', 'theme' => 'dark']);

        $this->get('/exercitii/tetris')->assertInertia(fn (Assert $page) => $page
            ->where('settings.lazyEye', 'left')
            ->where('settings.theme', 'dark'));
    }

    public function test_stored_keys_that_are_no_longer_settings_are_dropped(): void
    {
        $user = $this->signIn();
        UserSetting::query()->create(['user_id' => $user->id, 'data' => ['lazyEye' => 'left', 'oldKey' => 1]]);

        $settings = app(SettingsService::class)->for($user->fresh());

        $this->assertSame('left', $settings['lazyEye']);
        $this->assertArrayNotHasKey('oldKey', $settings);
        $this->assertSame(array_keys(config('eye.default_settings')), array_keys($settings));
    }

    public function test_the_password_change_checks_the_current_password(): void
    {
        $user = $this->signIn(['password' => 'old-password']);

        $this->from('/setari')
            ->put('/setari/parola', [
                'current_password' => 'not-it',
                'password' => 'new-password-1',
                'password_confirmation' => 'new-password-1',
            ])
            ->assertRedirect('/setari')
            ->assertSessionHasErrors(['current_password' => 'Parola actuală nu este corectă.']);

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_the_password_change_validates_the_new_password(): void
    {
        $this->signIn(['password' => 'old-password']);

        $this->from('/setari')
            ->put('/setari/parola', [
                'current_password' => 'old-password',
                'password' => 'short',
                'password_confirmation' => 'different',
            ])
            ->assertSessionHasErrors('password');
    }

    public function test_the_password_change(): void
    {
        $user = $this->signIn(['password' => 'old-password']);

        $this->from('/setari')
            ->put('/setari/parola', [
                'current_password' => 'old-password',
                'password' => 'new-password-1',
                'password_confirmation' => 'new-password-1',
            ])
            ->assertRedirect('/setari')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Parola a fost schimbată.');

        $this->assertTrue(Hash::check('new-password-1', $user->fresh()->password));
    }
}
