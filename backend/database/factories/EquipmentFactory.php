<?php

namespace Database\Factories;

use App\Models\Equipment;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipmentFactory extends Factory
{
    protected $model = Equipment::class;

    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['mobility', 'oxygen', 'vaccine', 'monitoring']),
            'price_per_day' => $this->faker->randomFloat(2, 5, 200),
            'size' => $this->faker->randomElement(['small', 'medium', 'large']),
            'quantity' => $this->faker->numberBetween(1, 10),
            'safety_rules' => $this->faker->sentence(),
            'condition' => $this->faker->randomElement(['new', 'good', 'fair']),
            'is_available' => true,
            'image' => null,
        ];
    }
}
