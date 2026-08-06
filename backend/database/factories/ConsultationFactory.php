<?php

namespace Database\Factories;

use App\Models\Slot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Consultation>
 */
class ConsultationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
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
