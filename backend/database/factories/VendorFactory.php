<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company_name' => $this->faker->company(),
            'license_num' => 'LIC-' . $this->faker->unique()->numberBetween(100000, 999999),
            'description' => $this->faker->sentence(),
            'contact_phone' => $this->faker->phoneNumber(),
        ];
    }
}
