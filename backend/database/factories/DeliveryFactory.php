<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Delivery>
 */
class DeliveryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $deliveryStatus = fake()->randomElement(['processing', 'delivered', 'failed']);
        $estDelDate = fake()->date();
        $actDelDate = null;
        if ($deliveryStatus === 'delivered') {
            $actDelDate = fake()->dateTimeBetween($estDelDate, '+7 days');
        }

        return [
            'order_id' => Order::factory(),
            'track_num' => fake()->unique()->numerify('##########'),
            'est_del_date' => $estDelDate,
            'act_del_date' => $actDelDate,
            'delivery_status' => $deliveryStatus,
            'delivery_type' => fake()->randomElement(['basic', 'rapid', 'emergency']),
        ];
    }
}
