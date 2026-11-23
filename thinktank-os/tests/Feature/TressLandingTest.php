<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TressLandingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Signed-out, tc root serves the restored landing page: hero,
     * waitlist, and a sign-in link. Not the logged-in Launches page.
     *
     * The landing is a BinaryFileResponse, whose body streams on send
     * and is empty under the test client, so the copy is asserted on
     * the served file itself; the response asserts status + type.
     */
    public function test_tc_root_signed_out_serves_landing(): void
    {
        $response = $this->get('http://tc.dvaughnhouse.com/');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=utf-8');
        $landing = file_get_contents(resource_path('tress-landing/index.html'));
        $this->assertStringContainsString('Tress Column', $landing);
        $this->assertStringContainsString('Join the waitlist', $landing);
        $this->assertStringContainsString('Sign in', $landing);
        $this->assertStringContainsString('https://trade.dvaughnhouse.com/', $landing);
        $this->assertStringContainsString('https://ops.dvaughnhouse.com/', $landing);
        $this->assertStringContainsString('https://plus.dvaughnhouse.com/', $landing);
        // Brand Guidelines 2026-11-20 (canonical): boilerplate, functional
        // tagline, and editorial indexing on the landing page.
        $this->assertStringContainsString('Every term set at inception. Never changed after.', $landing);
        $this->assertStringContainsString('every launch parameter is configured, locked, and printed in plain language at inception', $landing);
        $this->assertStringContainsString('//01', $landing);
        $this->assertStringNotContainsString('Prices and fees are subject to change without notice', $landing);
    }

    /**
     * The landing stylesheet carries the Brand Guidelines palette.
     */
    public function test_landing_stylesheet_uses_brand_guidelines_palette(): void
    {
        $css = file_get_contents(public_path('tress-column-assets/site.css'));

        $this->assertStringContainsString('#EAE9E5', $css);
        $this->assertStringContainsString('#B85D43', $css);
        $this->assertStringNotContainsString('#D4AF37', $css);
        $this->assertStringNotContainsString('#E97451', $css);
    }

    /**
     * Signed-in, the same URL serves Launches (PRD §3).
     */
    public function test_tc_root_signed_in_serves_launches(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('http://tc.dvaughnhouse.com/');

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page->component('TressColumn/LoggedIn/Index'));
    }

    /**
     * Each landing sub-page serves on the tc host.
     */
    public function test_tc_subpages_serve(): void
    {
        foreach (['how-it-works', 'certificate', 'fees', 'passes', 'terminal', 'console', 'security'] as $page) {
            $this->get("http://tc.dvaughnhouse.com/{$page}")->assertStatus(200);
        }
    }

    /**
     * The landing markdown serves on the tc host.
     */
    public function test_tc_markdown_serves(): void
    {
        $response = $this->get('http://tc.dvaughnhouse.com/fees.md');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/markdown; charset=utf-8');
    }

    /**
     * The waitlist form posts here and the signup is proxied to the
     * live Pages function, whose answer comes back unchanged.
     */
    public function test_waitlist_proxy_forwards_to_pages_function(): void
    {
        Http::fake([
            'tc-7bi.pages.dev/api/waitlist' => Http::response(['ok' => true], 200),
        ]);

        $response = $this->postJson('http://tc.dvaughnhouse.com/api/waitlist', [
            'email' => 'test@example.com',
            'name' => 'Test',
            'interest' => 'both',
            'company' => '',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
        Http::assertSent(function ($request) {
            return $request->url() === 'https://tc-7bi.pages.dev/api/waitlist'
                && $request->data()['email'] === 'test@example.com';
        });
    }

    /**
     * When the Pages function is down, the form gets an honest 503,
     * not a silent drop.
     */
    public function test_waitlist_proxy_returns_503_when_function_down(): void
    {
        Http::fake([
            'tc-7bi.pages.dev/*' => Http::response(['ok' => false], 503),
        ]);

        $response = $this->postJson('http://tc.dvaughnhouse.com/api/waitlist', [
            'email' => 'test@example.com',
            'name' => '',
            'interest' => 'both',
            'company' => '',
        ]);

        $response->assertStatus(503);
        $response->assertJson(['ok' => false]);
    }
}
