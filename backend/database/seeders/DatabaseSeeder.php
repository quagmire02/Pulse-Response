<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Medicine;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Pharmacist;
use App\Models\Slot;
use App\Models\Consultation;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prescription;
use App\Models\Payment;
use App\Models\Delivery;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = User::factory(7)->create();

        User::factory()->admin()->create();

        User::factory()->superAdmin()->create();

        User::factory()->inactive()->create();

        $categories = Category::factory(5)->create();

        $medicines = Medicine::factory(20)
            ->create()
            ->each(function ($medicine) use ($categories) {
                $medicine->categories()->attach(
                    $categories->random(rand(1, 3))->pluck('id')->toArray()
                );
            });

        Cart::factory(5)
            ->has(CartItem::factory()->count(3), 'cartItems')
            ->create();

        Pharmacist::factory(5)
            ->has(Slot::factory()->count(10), 'slots')
            ->create();

        $users = User::all();
        $pharmacists = Pharmacist::all();

        foreach ($pharmacists as $pharmacist) {
            $slots = $pharmacist->slots()->where('is_available', true)->get()->shuffle()->take(3);

            foreach ($slots as $slot) {
                Consultation::factory()->create([
                    'user_id' => $users->random()->id,
                    'slot_id' => $slot->id,
                ]);

                $slot->is_available = false;
                $slot->save();
            }
        }

        foreach ($users as $user) {
            Notification::factory()->count(rand(1, 5))->create([
                'user_id' => $user->id,
            ]);
        }

        Order::factory(10)
            ->create()
            ->each(function ($order) use ($medicines, $users) {
                // Create Order Items
                OrderItem::factory(rand(1, 4))->create([
                    'order_id' => $order->id,
                    'medicine_id' => $medicines->random()->id,
                ]);

                // Create a Payment
                Payment::factory()->create(['order_id' => $order->id]);

                // Create a Delivery
                Delivery::factory()->create(['order_id' => $order->id]);

                // Create a Prescription for some orders
                if (rand(0, 1)) {
                    Prescription::factory()->create([
                        'user_id' => $order->user_id,
                        'order_id' => $order->id,
                    ]);
                }
            });
    }
}
