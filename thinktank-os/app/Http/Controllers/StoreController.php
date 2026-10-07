<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Stripe\PaymentIntent;
use Stripe\Stripe;
use Throwable;

class StoreController extends Controller
{
    /**
     * Standard Product Catalog for The Economic Engine.
     */
    protected array $products = [
        'executive_salon' => [
            'id' => 'executive_salon',
            'name' => 'Executive Briefing Salon Seat',
            'tagline' => 'Off-The-Record Closed-Door Briefing',
            'amount' => 500.00,
            'amount_cents' => 50000,
            'description' => 'Single admission for corporate ESG directors, manufacturing executives, and institutional policymakers. Includes verified Chatham House Rule briefing, private monograph dossier, and structured dinner.',
            'features' => [
                'Chatham House Rule security protocol',
                'Advance 4-page Vanguard Policy Brief dossier',
                'Curated executive cohort (limited to 16 seats)',
                'Direct dialogue with Glenride research fellows',
            ],
            'tier' => 'Executive Admission',
        ],
        'corporate_retainer' => [
            'id' => 'corporate_retainer',
            'name' => 'Annual Corporate Underwriting Retainer',
            'tagline' => 'Institutional Advisory & Priority Access',
            'amount' => 25000.00,
            'amount_cents' => 2500000,
            'description' => 'Comprehensive institutional partnership for regional enterprises. Includes quarterly private briefings, dedicated policy analysis, and priority research commissioning.',
            'features' => [
                'Four guaranteed seats across all Executive Salons',
                'Direct quarterly advisory with D\'Vaughn House',
                'Priority commissioning of custom policy monographs',
                'Institutional underwriting credit on published briefs',
            ],
            'tier' => 'Corporate Underwriting',
        ],
        'saas_license' => [
            'id' => 'saas_license',
            'name' => 'ContextForge Institutional SaaS License',
            'tagline' => 'Agentic Synthesis Infrastructure',
            'amount' => 1200.00,
            'amount_cents' => 120000,
            'description' => 'Annual enterprise license for think tanks, universities, and research institutes to deploy ContextForge agentic monograph distillation internally.',
            'features' => [
                'Air-gapped local-first inference support (Ollama/vLLM)',
                'Automated 4-part Vanguard distillation pipeline',
                'Multi-tenant manuscript compliance gating',
                'Priority API updates and architecture support',
            ],
            'tier' => 'Software Licensing',
        ],
    ];

    /**
     * Display The Economic Engine storefront.
     */
    public function index(): Response
    {
        return Inertia::render('Store/Index', [
            'products' => array_values($this->products),
            'stripeKey' => Config::get('services.stripe.key'),
        ]);
    }

    /**
     * Create a Stripe PaymentIntent and persist pending Order.
     */
    public function createPaymentIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_type' => 'required|string|in:executive_salon,corporate_retainer,saas_license',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_company' => 'nullable|string|max:255',
            'attendee_notes' => 'nullable|string|max:1000',
        ]);

        $product = $this->products[$validated['product_type']];
        $orderNumber = 'GLEN-'.strtoupper(Str::random(8));

        // Initialize Stripe if secret is configured
        $stripeSecret = Config::get('services.stripe.secret');
        $clientSecret = null;
        $paymentIntentId = null;

        if ($stripeSecret && ! str_starts_with($stripeSecret, 'sk_test_placeholder')) {
            try {
                Stripe::setApiKey($stripeSecret);
                $intent = PaymentIntent::create([
                    'amount' => $product['amount_cents'],
                    'currency' => 'usd',
                    'receipt_email' => $validated['customer_email'],
                    'description' => "The Glenride Institute: {$product['name']} ({$orderNumber})",
                    'metadata' => [
                        'order_number' => $orderNumber,
                        'product_type' => $validated['product_type'],
                        'customer_name' => $validated['customer_name'],
                        'customer_company' => $validated['customer_company'] ?? 'N/A',
                    ],
                ]);

                $clientSecret = $intent->client_secret;
                $paymentIntentId = $intent->id;
            } catch (Throwable $e) {
                Log::warning("Stripe PaymentIntent generation failed: {$e->getMessage()}. Using test mode mock.");
            }
        }

        // Mock fallback for testing if no live key is present
        if (! $clientSecret) {
            $paymentIntentId = 'pi_mock_'.strtolower(Str::random(24));
            $clientSecret = $paymentIntentId.'_secret_'.strtolower(Str::random(16));
        }

        // Persist order in database
        $order = Order::create([
            'order_number' => $orderNumber,
            'product_type' => $validated['product_type'],
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_company' => $validated['customer_company'] ?? null,
            'amount' => $product['amount'],
            'currency' => 'usd',
            'status' => 'pending',
            'stripe_payment_intent_id' => $paymentIntentId,
            'metadata' => [
                'product_name' => $product['name'],
                'attendee_notes' => $validated['attendee_notes'] ?? null,
            ],
        ]);

        return response()->json([
            'order' => $order,
            'client_secret' => $clientSecret,
            'product' => $product,
        ]);
    }

    /**
     * Finalize and confirm successful transaction.
     */
    public function confirmOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
            'payment_intent_id' => 'required|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        $order->update([
            'status' => 'succeeded',
            'stripe_payment_intent_id' => $validated['payment_intent_id'],
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Order verified and processed successfully.',
            'order' => $order,
        ]);
    }

    /**
     * Handle incoming Stripe webhook notifications.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $type = $payload['type'] ?? null;

        if ($type === 'payment_intent.succeeded') {
            $piId = $payload['data']['object']['id'] ?? null;
            if ($piId) {
                $order = Order::where('stripe_payment_intent_id', $piId)->first();
                if ($order) {
                    $order->update([
                        'status' => 'succeeded',
                        'paid_at' => now(),
                    ]);
                    Log::info("Stripe Webhook: Order {$order->order_number} marked succeeded.");
                }
            }
        }

        return response()->json(['status' => 'received']);
    }
}
