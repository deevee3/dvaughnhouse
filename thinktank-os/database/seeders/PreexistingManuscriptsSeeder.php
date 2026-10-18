<?php

namespace Database\Seeders;

use App\Models\Manuscript;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PreexistingManuscriptsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'host@centersun21.com'],
            [
                'name' => "D'Vaughn House",
                'password' => Hash::make(Str::random(32)),
                'role' => 'orchestrator',
            ]
        );

        Manuscript::firstOrCreate(
            ['title' => 'Autonomous Agentic Governance in High-Assurance Sectors'],
            [
                'id' => '01a0a000-0000-7000-8000-000000000001',
                'user_id' => $user->id,
                'abstract' => 'A strategic framework addressing the latency gap between rapid algorithmic decision-making and human moral verification across clinical trial data pipelines and defense infrastructure.',
                'raw_file_path' => 'manuscripts/raw/01a0a000.txt',
                'synthesized_brief_path' => null,
                'status' => 'published',
                'compliance_ethics_verified' => true,
                'compliance_transparency_verified' => true,
                'compliance_citations_verified' => true,
                'word_count' => 940,
                'grant_amount' => 500.00,
                'published_at' => '2026-09-15 00:00:00',
            ]
        );

        Manuscript::firstOrCreate(
            ['id' => '01a0b493-0214-7330-a3a3-4b353213e0a3'],
            [
                'user_id' => $user->id,
                'title' => 'Supply Chain Vulnerabilities in Global STEM Pipelines',
                'abstract' => 'An empirical survey quantifying single-point failure vectors in advanced manufacturing research and domestic semiconductor workforce cultivation.',
                'raw_file_path' => 'manuscripts/raw/01a0b493.txt',
                'synthesized_brief_path' => 'manuscripts/synthesized/01a0b493-0214-7330-a3a3-4b353213e0a3_vanguard_brief.md',
                'status' => 'published',
                'compliance_ethics_verified' => true,
                'compliance_transparency_verified' => true,
                'compliance_citations_verified' => true,
                'word_count' => 820,
                'grant_amount' => 500.00,
                'published_at' => '2026-09-18 12:00:00',
            ]
        );

        Manuscript::firstOrCreate(
            ['id' => '01a0bd00-28a5-7109-8d1d-b357cb42dd7a'],
            [
                'user_id' => $user->id,
                'title' => 'Decentralized Micro-Grants for Independent Think Tanks',
                'abstract' => 'Actionable policy protocols establishing localized micro-grant compensation models to rapidly mobilize independent scholars without institutional overhead.',
                'raw_file_path' => 'manuscripts/raw/01a0bd00.txt',
                'synthesized_brief_path' => 'manuscripts/synthesized/01a0bd00-28a5-7109-8d1d-b357cb42dd7a_vanguard_brief.md',
                'status' => 'published',
                'compliance_ethics_verified' => true,
                'compliance_transparency_verified' => true,
                'compliance_citations_verified' => true,
                'word_count' => 850,
                'grant_amount' => 500.00,
                'published_at' => '2026-09-20 12:00:00',
            ]
        );
    }
}
