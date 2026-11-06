<?php

namespace Tests\Feature;

use App\Http\Middleware\SetLocale;
use App\Support\ExerciseCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_romanian_is_the_default(): void
    {
        $this->signIn();

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('locale', 'ro'));
    }

    public function test_choosing_english_is_kept_in_the_session_and_a_cookie(): void
    {
        $this->signIn();

        $response = $this->from('/exercitii')->put('/locale', ['locale' => 'en']);

        $response->assertRedirect('/exercitii')
            ->assertSessionHas('locale', 'en')
            ->assertPlainCookie(SetLocale::COOKIE, 'en');

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_switching_back_to_romanian(): void
    {
        $this->signIn();
        $this->put('/locale', ['locale' => 'en']);

        $this->put('/locale', ['locale' => 'ro'])->assertSessionHas('locale', 'ro');

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('locale', 'ro'));
    }

    public function test_the_cookie_alone_sets_the_language(): void
    {
        // e.g. after a logout the session is new, the one-year cookie stays
        $this->signIn();

        $this->withUnencryptedCookie(SetLocale::COOKIE, 'en')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_the_session_wins_over_the_cookie(): void
    {
        $this->signIn();

        $this->withSession(['locale' => 'ro'])
            ->withUnencryptedCookie(SetLocale::COOKIE, 'en')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'ro'));
    }

    public function test_a_guest_can_switch_the_language_on_the_login_page(): void
    {
        $this->from('/login')->put('/locale', ['locale' => 'en'])->assertRedirect('/login');

        $this->get('/login')->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_an_unknown_language_is_rejected(): void
    {
        $this->signIn();

        $this->from('/')->put('/locale', ['locale' => 'fr'])
            ->assertRedirect('/')
            ->assertSessionHasErrors('locale')
            ->assertSessionMissing('locale');
        $this->putJson('/locale', ['locale' => 'de'])->assertUnprocessable();
        $this->putJson('/locale', [])->assertUnprocessable();

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('locale', 'ro'));
    }

    public function test_an_unknown_language_in_the_cookie_falls_back_to_romanian(): void
    {
        $this->signIn();

        $this->withUnencryptedCookie(SetLocale::COOKIE, 'xx')
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'ro'));
    }

    public function test_catalog_titles_are_translated(): void
    {
        $this->signIn();
        $tetris = fn (Assert $page) => $page->component('exercises/Index');

        $this->get('/exercitii')->assertInertia(fn (Assert $page) => $tetris($page)
            ->where('exercises.0.slug', 'tetris')
            ->where('exercises.0.title', 'Tetris dihoptic'));

        $this->put('/locale', ['locale' => 'en']);

        $this->get('/exercitii')->assertInertia(fn (Assert $page) => $tetris($page)
            ->where('exercises.0.title', 'Dichoptic Tetris'));
    }

    public function test_every_catalog_text_has_a_romanian_translation(): void
    {
        $ro = json_decode((string) file_get_contents(lang_path('ro.json')), true);
        $missing = [];

        app()->setLocale('en');

        foreach (ExerciseCatalog::all() as $slug => $exercise) {
            foreach (['title', 'description', 'trains'] as $field) {
                if (! array_key_exists($exercise[$field], $ro)) {
                    $missing[] = "{$slug}.{$field}: {$exercise[$field]}";
                }
            }
        }

        $this->assertSame([], $missing);
    }

    public function test_server_messages_follow_the_language(): void
    {
        $this->signIn();
        $this->put('/locale', ['locale' => 'en']);

        $this->from('/setari')->put('/setari', ['lazyEye' => 'left'])
            ->assertSessionHas('success', 'Settings saved.');
    }
}
