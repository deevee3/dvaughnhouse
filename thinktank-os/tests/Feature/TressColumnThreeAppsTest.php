<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TressColumnThreeAppsTest extends TestCase
{
    use RefreshDatabase;
    /**
     * Staging routes return successful Inertia responses for all 3 apps.
     */
    public function test_staging_routes_render_three_apps(): void
    {
        $response = $this->get('/staging/tress-column');
        $response->assertStatus(200);

        $response = $this->get('/staging/terminal');
        $response->assertStatus(200);

        // Ops staging is gated: signed-out requests redirect to the
        // sign-in entry (H5 / Nov 17 staging behaviour, correct).
        $response = $this->get('/staging/ops-console');
        $response->assertStatus(302);
    }

    /**
     * Dedicated domain routes render corresponding apps.
     */
    public function test_subdomain_routes_render_corresponding_apps(): void
    {
        $response = $this->get('http://tc.dvaughnhouse.com/');
        $response->assertStatus(200);

        $response = $this->get('http://trade.dvaughnhouse.com/');
        $response->assertStatus(200);

        // Ops domain is gated: signed-out requests redirect to the
        // sign-in entry (H5 / Nov 17 staging behaviour, correct).
        $response = $this->get('http://ops.dvaughnhouse.com/');
        $response->assertStatus(302);

        $response = $this->get('http://plus.dvaughnhouse.com/');
        $response->assertStatus(200);
    }
}
