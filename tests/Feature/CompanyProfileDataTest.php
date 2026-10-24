<?php

namespace Tests\Feature;

use App\Models\ClientCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyProfileDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_dashboard_uses_the_real_company_profile_from_database(): void
    {
        $user = User::create([
            'id' => '11111111-1111-4111-8111-111111111111',
            'user_name' => 'Real Company Owner',
            'email' => 'company@example.com',
            'password' => bcrypt('password'),
            'phone_number' => '777000000',
            'country' => 'Yemen',
            'city' => 'Sanaa',
            'role' => 'client_company',
            'account_state' => 'active',
        ]);

        ClientCompany::create([
            'user_id' => $user->id,
            'business_name' => 'Real Company',
            'industry' => 'التسويق الرقمي',
            'company_description' => 'This is the real company description.',
            'commercial_register_path' => 'docs/register.pdf',
        ]);

        $response = $this->actingAs($user)->get('/company');

        $response->assertOk();
        $response->assertSee('Real Company');
        $response->assertDontSee('شركة الرواد');
    }
}
