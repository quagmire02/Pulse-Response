<?php

namespace Database\Factories;

use App\Models\Pharmacist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Slot>
 */
class SlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Generate a random integer for the start time, from 9 to 17
        $start_time = fake()->numberBetween(9, 17);

        // Calculate the end time, which is always one hour after the start time
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