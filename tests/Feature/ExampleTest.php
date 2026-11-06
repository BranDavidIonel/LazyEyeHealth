<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_home_page_renders_for_a_signed_in_user(): void
    {
        $this->signIn();

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Dashboard'));
    }

    public function test_a_guest_is_sent_to_the_login_page(): void
    {
        $this->get(route('home'))->assertRedirect(route('login'));
    }
}
