<?php

namespace Database\Factories;

use App\Models\Medicine;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
        public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'medicine_id' => Medicine::factory(),
            'quantity' => fake()->numberBetween(1, 5),
        ];
    }
}
