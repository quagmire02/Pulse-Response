<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
        protected static ?string $password;

        public function definition(): array
    {
        return [
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'username' => $this->faker->unique()->userName(),
            'address' => $this->faker->address(),
            'password' => Hash::make('Django@123'),
            'is_active' => true,
            'is_admin' => false,
            'is_super_admin' => false,
            'remember_token' => Str::random(10),
        ];
    }

        public function withPassword(string $password): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => $password,
        ]);
    }

        public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_admin' => true,
        ]);
    }

        public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_admin' => true,
            'is_super_admin' => true,
        ]);
    }

        public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
