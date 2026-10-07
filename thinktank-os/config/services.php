<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'contextforge' => [
        'driver' => env('CONTEXTFORGE_LLM_DRIVER', 'fake'),
        'lmstudio_base_url' => env('LMSTUDIO_BASE_URL', 'http://127.0.0.1:1234/v1'),
        'lmstudio_model' => env('LMSTUDIO_MODEL', 'default'),
        'ollama_base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'ollama_model' => env('OLLAMA_MODEL', 'gdisney/mixtral-uncensored:latest'),
        'anthropic_api_key' => env('ANTHROPIC_API_KEY'),
        'anthropic_model' => env('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
        'openai_api_key' => env('OPENAI_API_KEY'),
        'openai_base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'openai_model' => env('OPENAI_MODEL', 'gpt-4o'),
        'timeout' => (int) env('CONTEXTFORGE_LLM_TIMEOUT', 120),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

];
