<?php

namespace Database\Factories;

use App\Models\Equipment;
use App\Models\EquipmentRental;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipmentRentalFactory extends Factory
{
    protected $model = EquipmentRental::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'equipment_id' => Equipment::factory(),
            'vendor_id' => Vendor::factory(),
            'rental_start' => now()->subDays(5),
            'rental_end' => now()->addDays(5),
            'total_price' => $this->faker->randomFloat(2, 50, 500),
            'status' => 'active',
        ];
    }
}
