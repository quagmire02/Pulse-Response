<?php

namespace Database\Factories;

use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationFactory extends Factory
{
        public function definition(): array
    {
        $confirmed_at = fake()->optional()->dateTimeThisYear();
        $completed_at = fake()->optional()->dateTimeBetween($confirmed_at ?? '-1 year');

        return [
            'user_id' => User::factory(),
            'slot_id' => Slot::factory(),
            'status' => fake()->randomElement(['pending', 'confirmed', 'rejected', 'completed']),
            'confirmed_at' => $confirmed_at,
            'completed_at' => $completed_at,
        ];
    }
}
