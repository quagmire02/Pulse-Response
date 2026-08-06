<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Medicine>
 */
class MedicineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' ' . fake()->word() . ' ' . fake()->word(),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 1, 1000),
            'dosage' => fake()->randomElement(['10mg', '20mg', '500mg', '1g']),
            'brand' => fake()->company(),
            'image_url' => fake()->imageUrl(),
            'stock' => fake()->numberBetween(0, 100),
        ];
    }
}