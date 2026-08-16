<?php

namespace Database\Factories;

use App\Models\EmergencyAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmergencyAlertFactory extends Factory
{
    protected $model = EmergencyAlert::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'alert_type' => $this->faker->randomElement(['general_ambulance', 'heart_attack_symptoms', 'respiratory_asthma', 'trauma_physical_injury']),
            'status' => 'pending',
            'location' => $this->faker->address(),
            'notes' => $this->faker->sentence(),
        ];
    }
}
