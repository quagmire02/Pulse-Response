<?php

namespace Database\Factories;

use App\Models\Pharmacist;
use Illuminate\Database\Eloquent\Factories\Factory;

class SlotFactory extends Factory
{
        public function definition(): array
    {
        $start_time = fake()->numberBetween(9, 17);

        $end_time = $start_time + 1;

        return [
            'pharmacist_id' => Pharmacist::factory(),
            'date' => fake()->date(),
            'start_time' => $start_time,
            'end_time' => $end_time,
            'is_available' => fake()->boolean(),
        ];
    }
}