<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
        public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'total_amount' => fake()->randomFloat(2, 10, 500),
            'order_date' => fake()->date(),
            'order_status' => fake()->randomElement(['pending', 'delivered', 'canceled']),
            'payment_status' => fake()->randomElement(['pending', 'paid', 'failed']),
            'subscribe_type' => fake()->randomElement(['none', 'weekly', 'monthly']),
        ];
    }
}