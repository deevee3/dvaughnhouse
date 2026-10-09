<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_storefront(): void
    {
        $response = $this->get(route('store.index'));
        $response->assertOk();
    }

    public function test_can_create_payment_intent_and_order_record(): void
    {
        $response = $this->postJson(route('store.intent'), [
            'product_type' => 'executive_salon',
            'customer_name' => 'John Henderson',
            'customer_email' => 'esg.director@industrial.com',
            'customer_company' => 'Apex Manufacturing Base',
            'attendee_notes' => 'Dietary restriction: vegetarian.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('order.product_type', 'executive_salon');
        $response->assertJsonPath('order.amount', '500.00');
        $response->assertJsonPath('order.status', 'pending');
        $this->assertNotEmpty($response->json('client_secret'));

        $this->assertDatabaseHas('orders', [
            'customer_email' => 'esg.director@industrial.com',
            'product_type' => 'executive_salon',
            'status' => 'pending',
        ]);
    }

    public function test_can_confirm_order_and_mark_succeeded(): void
    {
        $order = Order::create([
            'order_number' => 'GLEN-TEST1234',
            'product_type' => 'corporate_retainer',
            'customer_name' => 'Elena Rostova',
            'customer_email' => 'elena@enterprise.org',
            'amount' => 25000.00,
            'status' => 'pending',
        ]);

        $response = $this->postJson(route('store.confirm'), [
            'order_id' => $order->id,
            'payment_intent_id' => 'pi_mock_confirmed_test',
        ]);

        $response->assertOk();
        $order->refresh();

        $this->assertEquals('succeeded', $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertEquals('pi_mock_confirmed_test', $order->stripe_payment_intent_id);
    }

    public function test_stripe_webhook_marks_order_succeeded(): void
    {
        $order = Order::create([
            'order_number' => 'GLEN-WEBHOOK1',
            'product_type' => 'saas_license',
            'customer_name' => 'Policy Director',
            'customer_email' => 'director@thinktank.org',
            'amount' => 1200.00,
            'status' => 'pending',
            'stripe_payment_intent_id' => 'pi_test_webhook_123',
        ]);

        $response = $this->postJson(route('store.webhook'), [
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_webhook_123',
                ],
            ],
        ]);

        $response->assertOk();
        $order->refresh();
        $this->assertEquals('succeeded', $order->status);
        $this->assertNotNull($order->paid_at);
    }
}

    public function test_storefront_exposes_all_three_categories(): void
    {
        $response = $this->get(route('store.index'));
        $response->assertOk();
        // Inertia page receives grouped categories
        $page = $response->viewData('page');
        $categories = $page['props']['categories'];
        $ids = array_column($categories, 'id');
        $this->assertContains('reynards', $ids);
        $this->assertContains('glenride', $ids);
        $this->assertContains('executive', $ids);

        // Reynard's has the Ruck Reset guide; Glenride has 11 apps
        $byId = array_column($categories, null, 'id');
        $reynardsIds = array_column($byId['reynards']['products'], 'id');
        $this->assertContains('ruck_reset_guide', $reynardsIds);
        $this->assertCount(11, $byId['glenride']['products']);
    }

    public function test_can_purchase_reynards_guide(): void
    {
        $response = $this->postJson(route('store.intent'), [
            'product_type' => 'ruck_reset_guide',
            'customer_name' => 'Alex Carter',
            'customer_email' => 'alex@example.com',
        ]);

        $response->assertOk();
        $response->assertJsonPath('order.product_type', 'ruck_reset_guide');
        $response->assertJsonPath('order.amount', '19.00');
        $this->assertDatabaseHas('orders', [
            'customer_email' => 'alex@example.com',
            'product_type' => 'ruck_reset_guide',
            'status' => 'pending',
        ]);
    }

    public function test_cannot_purchase_coming_soon_product(): void
    {
        $response = $this->postJson(route('store.intent'), [
            'product_type' => 'app_job_digest',
            'customer_name' => 'Sam Lee',
            'customer_email' => 'sam@example.com',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('orders', ['customer_email' => 'sam@example.com']);
    }

    public function test_cannot_purchase_external_product(): void
    {
        $response = $this->postJson(route('store.intent'), [
            'product_type' => 'app_spinwave',
            'customer_name' => 'Sam Lee',
            'customer_email' => 'sam2@example.com',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('orders', ['customer_email' => 'sam2@example.com']);
    }

    public function test_cannot_purchase_custom_setup_product(): void
    {
        $response = $this->postJson(route('store.intent'), [
            'product_type' => 'app_vapor_wire_bot',
            'customer_name' => 'Sam Lee',
            'customer_email' => 'sam3@example.com',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('orders', ['customer_email' => 'sam3@example.com']);
    }
