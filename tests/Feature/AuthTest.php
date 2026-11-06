<?php

namespace Tests\Feature;

use App\Http\Middleware\SetLocale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $password = 'correct-horse'): User
    {
        return User::factory()->create(['email' => 'ana@example.test', 'password' => $password]);
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        foreach (['/', '/exercitii', '/exercitii/tetris', '/test-vedere', '/rapoarte', '/setari', '/ghid'] as $url) {
            $this->get($url)->assertRedirect('/login');
        }
    }

    public function test_guests_get_401_from_the_json_api(): void
    {
        $this->postJson('/api/practice', ['exercise' => 'tetris', 'seconds' => 10])->assertUnauthorized();
        $this->getJson('/api/settings')->assertUnauthorized();
    }

    public function test_the_login_page_renders(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/Login')
                ->where('canRegister', false)
                ->where('auth.user', null)
                ->where('auth.loginRequired', true));
    }

    public function test_login_with_the_right_password(): void
    {
        $user = $this->user();

        $this->post('/login', ['email' => 'ana@example.test', 'password' => 'correct-horse'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_goes_back_to_the_page_asked_for(): void
    {
        $this->user();
        $this->get('/rapoarte')->assertRedirect('/login');

        $this->post('/login', ['email' => 'ana@example.test', 'password' => 'correct-horse'])
            ->assertRedirect('/rapoarte');
    }

    public function test_wrong_password_shows_a_romanian_error_by_default(): void
    {
        $this->user();

        $this->from('/login')
            ->post('/login', ['email' => 'ana@example.test', 'password' => 'wrong'])
            ->assertRedirect('/login')
            ->assertSessionHasErrors(['email' => 'Emailul sau parola nu sunt corecte.']);

        $this->assertGuest();
    }

    public function test_wrong_password_shows_an_english_error_with_the_english_locale(): void
    {
        $this->user();

        $this->withUnencryptedCookie(SetLocale::COOKIE, 'en')
            ->from('/login')
            ->post('/login', ['email' => 'ana@example.test', 'password' => 'wrong'])
            ->assertSessionHasErrors(['email' => 'The email or the password is not correct.']);

        $this->assertGuest();
    }

    public function test_unknown_email_gets_the_same_error(): void
    {
        $this->from('/login')
            ->post('/login', ['email' => 'nobody@example.test', 'password' => 'whatever'])
            ->assertSessionHasErrors(['email' => 'Emailul sau parola nu sunt corecte.']);
    }

    public function test_login_validates_the_fields(): void
    {
        $this->from('/login')
            ->post('/login', ['email' => 'not-an-email', 'password' => ''])
            ->assertSessionHasErrors(['email', 'password']);
    }

    public function test_after_five_wrong_tries_even_the_right_password_waits(): void
    {
        $user = $this->user();

        for ($i = 0; $i < 5; $i++) {
            $this->from('/login')->post('/login', ['email' => 'ana@example.test', 'password' => 'wrong']);
        }

        $response = $this->from('/login')
            ->post('/login', ['email' => 'ana@example.test', 'password' => 'correct-horse']);

        $response->assertSessionHasErrors('email');
        $this->assertStringStartsWith('Prea multe încercări.', session('errors')->first('email'));
        $this->assertGuest();
        $this->assertNotNull($user->fresh());
    }

    public function test_a_successful_login_clears_the_failed_tries(): void
    {
        $user = $this->user();

        for ($i = 0; $i < 4; $i++) {
            $this->from('/login')->post('/login', ['email' => 'ana@example.test', 'password' => 'wrong']);
        }

        $this->post('/login', ['email' => 'ana@example.test', 'password' => 'correct-horse'])->assertRedirect('/');
        $this->post('/logout');

        // the counter starts again: 4 more wrong tries are still allowed before the lock
        for ($i = 0; $i < 4; $i++) {
            $this->from('/login')->post('/login', ['email' => 'ana@example.test', 'password' => 'wrong']);
        }

        $this->post('/login', ['email' => 'ana@example.test', 'password' => 'correct-horse'])->assertRedirect('/');
        $this->assertAuthenticatedAs($user);
    }

    public function test_logout(): void
    {
        $this->signIn();

        $this->post('/logout')->assertRedirect('/login');

        $this->assertGuest();
        $this->get('/')->assertRedirect('/login');
    }

    public function test_a_signed_in_user_is_sent_home_from_the_login_page(): void
    {
        $this->signIn();

        $this->get('/login')->assertRedirect('/');
    }

    public function test_local_mode_signs_in_the_admin_and_creates_it_if_missing(): void
    {
        $this->bypassLogin();
        config(['eye.admin' => ['name' => 'Local Admin', 'email' => 'admin@example.test', 'password' => 'local-pass']]);

        $this->assertDatabaseMissing('users', ['email' => 'admin@example.test']);

        // the login page is skipped: the visitor is signed in and sent home
        $this->get('/login')->assertRedirect('/');

        $admin = User::query()->where('email', 'admin@example.test')->firstOrFail();
        $this->assertSame('Local Admin', $admin->name);
        $this->assertTrue(Hash::check('local-pass', $admin->password));
        $this->assertAuthenticatedAs($admin);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('auth.user.email', 'admin@example.test')
                ->where('auth.loginRequired', false));
    }

    /**
     * Known bug (reported): the "auth" middleware runs before AutoLoginLocally
     * (Laravel's middleware priority puts Authenticate before SubstituteBindings,
     * i.e. before the appended web middleware), so the first request of a new
     * session is sent to /login, signed in there and redirected to the home page
     * instead of the page that was asked for. JSON calls get 401 the same way.
     */
    public function test_local_mode_opens_the_requested_page_on_the_first_visit(): void
    {
        $this->bypassLogin();

        $this->get('/rapoarte')->assertOk();
    }

    public function test_local_mode_reuses_an_existing_admin(): void
    {
        $this->bypassLogin();
        $existing = User::factory()->create(['email' => 'admin@example.test']);
        config(['eye.admin' => ['name' => 'Admin', 'email' => 'admin@example.test', 'password' => null]]);

        $this->get('/login')->assertRedirect('/');

        $this->assertSame(1, User::query()->where('email', 'admin@example.test')->count());
        $this->assertAuthenticatedAs($existing);
    }

    public function test_local_mode_admin_without_a_password_gets_a_random_one(): void
    {
        $this->bypassLogin();
        config(['eye.admin' => ['name' => 'Admin', 'email' => 'admin@example.test', 'password' => null]]);

        $this->get('/login')->assertRedirect('/');

        $admin = User::query()->where('email', 'admin@example.test')->firstOrFail();
        $this->assertNotEmpty($admin->password);
        $this->assertFalse(Hash::check('', $admin->password));
    }

    public function test_local_mode_logout_goes_home(): void
    {
        $this->bypassLogin();
        $this->get('/login');

        $this->post('/logout')->assertRedirect('/');
    }

    public function test_local_mode_has_no_password_change(): void
    {
        $this->bypassLogin();
        $this->get('/login');

        $this->get('/setari')->assertInertia(fn (Assert $page) => $page
            ->component('settings/Edit')
            ->where('canChangePassword', false));
    }

    public function test_auth_enabled_false_outside_local_still_requires_login(): void
    {
        // APP_ENV is "testing" here, not "local": the bypass must stay off.
        config(['eye.auth_enabled' => false]);

        $this->get('/')->assertRedirect('/login');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_is_404_unless_enabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Ana',
            'email' => 'new@example.test',
            'password' => 'long-enough-1',
            'password_confirmation' => 'long-enough-1',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'new@example.test']);
    }

    public function test_registration_when_enabled(): void
    {
        config(['eye.registration_enabled' => true]);

        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/Register'));
        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('canRegister', true));

        $this->post('/register', [
            'name' => 'Ana',
            'email' => 'new@example.test',
            'password' => 'long-enough-1',
            'password_confirmation' => 'long-enough-1',
        ])->assertRedirect('/');

        $user = User::query()->where('email', 'new@example.test')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('long-enough-1', $user->password));
    }

    public function test_registration_validates_the_fields(): void
    {
        config(['eye.registration_enabled' => true]);
        User::factory()->create(['email' => 'taken@example.test']);

        $this->from('/register')->post('/register', [
            'name' => '',
            'email' => 'taken@example.test',
            'password' => 'short',
            'password_confirmation' => 'other',
        ])->assertSessionHasErrors(['name', 'email', 'password']);

        $this->assertGuest();
    }
}
