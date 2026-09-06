<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineFactory extends Factory
{
        public function definition(): array
    {
        return [
            'name' => fake()->unique()->word() . ' ' . fake()->word() . ' ' . fake()->word(),
            'generic_name' => fake()->randomElement(['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Omeprazole', 'Lisinopril', 'Albuterol', 'Amlodipine', 'Levothyroxine']),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 1, 1000),
            'dosage' => fake()->randomElement(['10mg', '20mg', '500mg', '1g']),
            'brand' => fake()->company(),
            'image_url' => fake()->imageUrl(),
            'stock' => fake()->numberBetween(0, 100),
        ];
    }
}