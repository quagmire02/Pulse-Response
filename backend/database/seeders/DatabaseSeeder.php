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

        // Create Vendor account
        $vendorUser = User::create([
            'first_name' => 'Vendor',
            'last_name' => 'User',
            'email' => 'vendor@example.com',
            'username' => 'vendor_user',
            'password' => 'Django@123',
            'is_active' => true,
        ]);
        $vendor = \App\Models\Vendor::create([
            'user_id' => $vendorUser->id,
            'company_name' => 'Alpha Equipment Suppliers',
            'license_num' => 'LIC-999111',
            'description' => 'Top medical equipment provider.',
            'contact_phone' => '123-456-7890',
        ]);
        // Create some equipment
        $eq1 = \App\Models\Equipment::create([
            'vendor_id' => $vendor->id,
            'name' => 'Portable Oxygen Concentrator',
            'description' => 'High flow portable oxygen concentrator.',
            'category' => 'oxygen',
            'price_per_day' => 45.00,
            'size' => 'medium',
            'quantity' => 5,
            'safety_rules' => 'Do not use near open flames.',
            'condition' => 'new',
            'is_available' => true,
        ]);
        $eq2 = \App\Models\Equipment::create([
            'vendor_id' => $vendor->id,
            'name' => 'Standard Wheelchair',
            'description' => 'Lightweight folding wheelchair.',
            'category' => 'mobility',
            'price_per_day' => 15.00,
            'size' => 'medium',
            'quantity' => 10,
            'safety_rules' => 'Always lock brakes when getting in or out.',
            'condition' => 'good',
            'is_available' => true,
        ]);
        $eq3 = \App\Models\Equipment::create([
            'vendor_id' => $vendor->id,
            'name' => 'Patient Vital Monitor',
            'description' => 'Multi-parameter patient monitor.',
            'category' => 'monitoring',
            'price_per_day' => 85.00,
            'size' => 'small',
            'quantity' => 3,
            'safety_rules' => 'Calibrate before each patient use.',
            'condition' => 'new',
            'is_available' => true,
        ]);

        // Create some equipment rentals
        \App\Models\EquipmentRental::create([
            'user_id' => $users->random()->id,
            'equipment_id' => $eq1->id,
            'vendor_id' => $vendor->id,
            'rental_start' => now()->subDays(5),
            'rental_end' => now()->addDays(5),
            'total_price' => 450.00,
            'status' => 'active',
        ]);
        \App\Models\EquipmentRental::create([
            'user_id' => $users->random()->id,
            'equipment_id' => $eq2->id,
            'vendor_id' => $vendor->id,
            'rental_start' => now()->subDays(2),
            'rental_end' => now()->addDays(3),
            'total_price' => 75.00,
            'status' => 'active',
        ]);

        // Create vendor reviews
        \App\Models\VendorReview::create([
            'user_id' => $users->random()->id,
            'vendor_id' => $vendor->id,
            'rating' => 5,
            'comment' => 'Excellent service and brand new equipment!',
        ]);
        \App\Models\VendorReview::create([
            'user_id' => $users->random()->id,
            'vendor_id' => $vendor->id,
            'rating' => 4,
            'comment' => 'Good response, wheelchair was clean.',
        ]);

        // Create Ambulance Company account
        $ambulanceUser = User::create([
            'first_name' => 'Ambulance',
            'last_name' => 'User',
            'email' => 'ambulance@example.com',
            'username' => 'ambulance_user',
            'password' => 'Django@123',
            'is_active' => true,
        ]);
        $company = \App\Models\AmbulanceCompany::create([
            'user_id' => $ambulanceUser->id,
            'company_name' => 'Rapid Response Ambulances',
            'license_num' => 'LIC-888222',
            'description' => '24/7 emergency response and patient transport services.',
            'contact_phone' => '987-654-3210',
        ]);

        // Create vehicles
        $v1 = \App\Models\AmbulanceVehicle::create([
            'ambulance_company_id' => $company->id,
            'vehicle_number' => 'AMB-101',
            'model' => 'Ford Transit Medic',
            'status' => 'available',
        ]);
        $v2 = \App\Models\AmbulanceVehicle::create([
            'ambulance_company_id' => $company->id,
            'vehicle_number' => 'AMB-102',
            'model' => 'Mercedes-Benz Sprinter ICU',
            'status' => 'busy',
        ]);
        $v3 = \App\Models\AmbulanceVehicle::create([
            'ambulance_company_id' => $company->id,
            'vehicle_number' => 'AMB-103',
            'model' => 'Chevrolet Express Lifeline',
            'status' => 'maintenance',
        ]);

        // Create completed trips
        $tripsData = [
            ['vehicle' => $v1, 'days_ago' => 10, 'delay' => 8, 'revenue' => 150.00, 'patient' => 'John Doe'],
            ['vehicle' => $v1, 'days_ago' => 8, 'delay' => 12, 'revenue' => 200.00, 'patient' => 'Jane Smith'],
            ['vehicle' => $v2, 'days_ago' => 7, 'delay' => 15, 'revenue' => 350.00, 'patient' => 'Alice Johnson'],
            ['vehicle' => $v2, 'days_ago' => 5, 'delay' => 5, 'revenue' => 180.00, 'patient' => 'Bob Brown'],
            ['vehicle' => $v1, 'days_ago' => 4, 'delay' => 10, 'revenue' => 150.00, 'patient' => 'Charlie Davis'],
            ['vehicle' => $v2, 'days_ago' => 3, 'delay' => 9, 'revenue' => 220.00, 'patient' => 'Diana Evans'],
            ['vehicle' => $v1, 'days_ago' => 2, 'delay' => 6, 'revenue' => 170.00, 'patient' => 'Frank Miller'],
            ['vehicle' => $v2, 'days_ago' => 1, 'delay' => 14, 'revenue' => 300.00, 'patient' => 'Grace Wilson'],
        ];

        foreach ($tripsData as $t) {
            $dispatch = now()->subDays($t['days_ago'])->subMinutes(60);
            $arrival = (clone $dispatch)->addMinutes($t['delay']);
            $completion = (clone $arrival)->addMinutes(45);

            \App\Models\AmbulanceTrip::create([
                'ambulance_company_id' => $company->id,
                'vehicle_id' => $t['vehicle']->id,
                'patient_name' => $t['patient'],
                'dispatch_time' => $dispatch,
                'arrival_time' => $arrival,
                'completion_time' => $completion,
                'revenue' => $t['revenue'],
                'response_delay_minutes' => $t['delay'],
            ]);
        }
    }
}
