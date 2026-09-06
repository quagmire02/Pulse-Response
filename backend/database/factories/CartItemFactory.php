<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\Medicine;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
        public function definition(): array
    {
        return [
            'cart_id' => Cart::factory(),
            'medicine_id' => Medicine::factory(),
            'quantity' => fake()->numberBetween(1, 10),
        ];
    }
}