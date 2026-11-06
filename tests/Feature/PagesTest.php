<?php

namespace Tests\Feature;

use App\Support\ExerciseCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-06 12:00:00'));
    }

    /** @return array<string, array{string}> */
    public static function slugs(): array
    {
        $out = [];

        foreach (ExerciseCatalog::slugs() as $slug) {
            $out[$slug] = [$slug];
        }

        return $out;
    }

    public function test_dashboard(): void
    {
        $user = $this->signIn();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('auth.user.id', $user->id)
                ->where('auth.loginRequired', true)
                ->where('locale', 'ro')
                ->where('todaySeconds', 0)
                ->where('settings.lazyEye', 'right')
                ->where('today.date', '2026-11-06')
                ->where('today.seconds', 0)
                ->where('today.goal_minutes', 30)
                ->where('streak', 0)
                ->where('bestStreak', 0)
                ->has('lastDays', 14)
                ->where('lastDays.13.date', '2026-11-06')
                ->has('plan')
                ->has('exercises', count(ExerciseCatalog::exercises()))
                ->has('summaries')
                ->has('vision', 0)
                ->where('journal', null));
    }

    public function test_exercise_list(): void
    {
        $this->signIn();

        $this->get('/exercitii')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('exercises/Index')
                ->has('exercises', count(ExerciseCatalog::exercises()))
                ->has('exercises.0', fn (Assert $e) => $e
                    ->hasAll(['slug', 'title', 'group', 'page', 'description', 'trains', 'minutes'])
                    ->etc()));
    }

    public function test_the_exercise_list_has_no_setup_pages(): void
    {
        $groups = array_column(ExerciseCatalog::exercises(), 'group');

        $this->assertNotContains('setup', $groups);
        $this->assertArrayHasKey('calibrare', ExerciseCatalog::all());
    }

    #[DataProvider('slugs')]
    public function test_every_exercise_page_renders_its_catalog_component(string $slug): void
    {
        $this->signIn();
        $exercise = ExerciseCatalog::find($slug);
        $keys = [$slug, ...ExerciseCatalog::extraResultKeys($slug)];

        $this->get("/exercitii/{$slug}")
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($exercise, $slug, $keys) {
                $page->component($exercise['page'])
                    ->where('exercise.slug', $slug)
                    ->where('exercise.page', $exercise['page'])
                    ->has('results', count($keys));

                foreach ($keys as $key) {
                    $page->has("results.{$key}", 0);
                }
            });
    }

    public function test_unknown_exercise_is_404(): void
    {
        $this->signIn();

        $this->get('/exercitii/nu-exista')->assertNotFound();
    }

    public function test_calibration_page(): void
    {
        $this->signIn();

        $this->get('/calibrare')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('exercises/Calibration')
                ->where('exercise.slug', 'calibrare')
                ->has('results.calibrare')
                ->has('results.worth')
                ->has('results.balance'));
    }

    public function test_physical_exercises_page(): void
    {
        $this->signIn();

        $this->get('/exercitii-fizice')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component(ExerciseCatalog::find('fara-ecran')['page'])
                ->where('exercise.slug', 'fara-ecran'));
    }

    public function test_vision_overview(): void
    {
        $this->signIn();

        $this->get('/test-vedere')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('vision/Index')
                ->has('comparisons', 0)
                ->has('series', 0)
                ->has('tests', 0)
                ->has('types', 3)
                ->has('eyes', 3)
                ->where('types.0', ['value' => 'acuity', 'label' => 'Tabel cu litere'])
                ->where('eyes.0', ['value' => 'right', 'label' => 'Ochiul drept']));
    }

    /** @return array<string, array{string, string}> */
    public static function visionTypes(): array
    {
        return [
            'acuity' => ['acuity', 'vision/Acuity'],
            'reading' => ['reading', 'vision/Reading'],
            'contrast' => ['contrast', 'vision/Contrast'],
        ];
    }

    #[DataProvider('visionTypes')]
    public function test_vision_test_pages(string $type, string $component): void
    {
        $this->signIn();

        $this->get("/test-vedere/{$type}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component($component)
                ->where('type', $type)
                ->has('previous', 0));
    }

    public function test_unknown_vision_test_is_404(): void
    {
        $this->signIn();

        $this->get('/test-vedere/colour')->assertNotFound();
    }

    public function test_reports_default_period(): void
    {
        $this->signIn();

        $this->get('/rapoarte')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->where('period.key', '30')
                ->where('period.from', '2026-10-08')
                ->where('period.to', '2026-11-06')
                ->where('period.label', 'Ultimele 30 de zile')
                ->has('report.daily', 30)
                ->has('report.kpis')
                ->has('titles.tetris')
                ->has('titles.test-vedere'));
    }

    public function test_reports_last_7_days(): void
    {
        $this->signIn();

        $this->get('/rapoarte?perioada=7')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->where('period.key', '7')
                ->where('period.from', '2026-10-31')
                ->has('report.daily', 7));
    }

    public function test_reports_for_a_month(): void
    {
        $this->signIn();

        $this->get('/rapoarte?luna=2026-10')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->where('period.key', 'luna')
                ->where('period.month', '2026-10')
                ->where('period.from', '2026-10-01')
                ->where('period.to', '2026-10-31')
                ->has('report.daily', 31));
    }

    public function test_reports_since_the_start(): void
    {
        $this->signIn();

        $this->get('/rapoarte?perioada=toate')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('reports/Index')
                ->where('period.key', 'toate')
                ->where('period.to', '2026-11-06'));
    }

    public function test_settings_page(): void
    {
        $this->signIn();

        $this->get('/setari')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/Edit')
                ->where('canChangePassword', true)
                ->where('settings.theme', 'light'));
    }

    public function test_guide_page(): void
    {
        $this->signIn();

        $this->get('/ghid')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Guide'));
    }

    public function test_every_rendered_page_has_a_vue_file(): void
    {
        $pages = [
            'Dashboard', 'Guide', 'auth/Login', 'auth/Register', 'exercises/Index', 'settings/Edit', 'reports/Index',
            'vision/Index', 'vision/Acuity', 'vision/Reading', 'vision/Contrast',
            ...array_column(ExerciseCatalog::all(), 'page'),
        ];

        $missing = array_values(array_filter(
            array_unique($pages),
            fn (string $page) => ! file_exists(resource_path("js/pages/{$page}.vue")),
        ));

        $this->assertSame([], $missing, 'Inertia pages without a .vue file in resources/js/pages');
    }
}
