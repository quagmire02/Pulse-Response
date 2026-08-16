<?php

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Medicine;
use App\Models\EquipmentRental;
use App\Models\EmergencyAlert;
use App\Models\Payment;
use App\Models\Consultation;
use App\Models\Slot;
use App\Models\Pharmacist;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('a user can view their own ledger timeline and summary', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Seed activities
    $medicine = Medicine::factory()->create(['name' => 'Aspirin']);
    $order = Order::factory()->create(['user_id' => $user->id, 'order_date' => now(), 'total_amount' => 50.00]);
    OrderItem::factory()->create(['order_id' => $order->id, 'medicine_id' => $medicine->id, 'quantity' => 2]);
    Payment::factory()->create(['order_id' => $order->id, 'user_id' => $user->id, 'payment_date' => now()]);
    
    EquipmentRental::factory()->create(['user_id' => $user->id, 'rental_start' => now(), 'total_price' => 120.00]);
    EmergencyAlert::factory()->create(['user_id' => $user->id, 'alert_type' => 'heart_attack_symptoms', 'location' => 'Home']);

    // Test timeline endpoint
    $response = $this->getJson('/api/ledger/timeline');
    $response->assertStatus(200);
    $data = $response->json('data');

    expect($data)->toHaveCount(4); // purchase, payment, equipment rental, emergency alert. (Consultation is 0)

    // Verify properties
    $types = collect($data)->pluck('type')->toArray();
    expect($types)->toContain('purchase');
    expect($types)->toContain('payment');
    expect($types)->toContain('equipment');
    expect($types)->toContain('emergency');

    // Test summary endpoint
    $summaryResponse = $this->getJson('/api/ledger/summary');
    $summaryResponse->assertStatus(200)
        ->assertJson([
            'total_purchases' => 1,
            'total_rentals' => 1,
            'total_consultations' => 0,
            'total_alerts' => 1,
        ]);
});

test('a doctor can only view patient ledger if they have a booked consultation with the patient', function () {
    $doctorUser = User::factory()->create();
    $pharmacist = Pharmacist::factory()->create(['user_id' => $doctorUser->id]);
    
    $patientUser = User::factory()->create();

    // 1. Authenticate as doctor, try to access before consultation booked -> should get 403
    Sanctum::actingAs($doctorUser);
    $response = $this->getJson("/api/ledger/patient/{$patientUser->id}");
    $response->assertStatus(403);

    $summaryResponse = $this->getJson("/api/ledger/patient/{$patientUser->id}/summary");
    $summaryResponse->assertStatus(403);

    // 2. Book a consultation between this pharmacist and patient
    $slot = Slot::factory()->create(['pharmacist_id' => $pharmacist->id, 'is_available' => false]);
    Consultation::factory()->create([
        'user_id' => $patientUser->id,
        'slot_id' => $slot->id,
        'status' => 'confirmed'
    ]);

    // 3. Authenticate as doctor, request timeline again -> should succeed
    $response = $this->getJson("/api/ledger/patient/{$patientUser->id}");
    $response->assertStatus(200);

    $summaryResponse = $this->getJson("/api/ledger/patient/{$patientUser->id}/summary");
    $summaryResponse->assertStatus(200);
});

test('admins and super admins can view any patient ledger without a consultation check', function () {
    $admin = User::factory()->admin()->create();
    $patientUser = User::factory()->create();

    Sanctum::actingAs($admin);

    $response = $this->getJson("/api/ledger/patient/{$patientUser->id}");
    $response->assertStatus(200);

    $summaryResponse = $this->getJson("/api/ledger/patient/{$patientUser->id}/summary");
    $summaryResponse->assertStatus(200);
});

test('ledger timeline supports date range and type filtering', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Seed a purchase from last month
    Order::factory()->create([
        'user_id' => $user->id,
        'order_date' => now()->subMonth(),
        'total_amount' => 10.00
    ]);

    // Seed a purchase from today
    Order::factory()->create([
        'user_id' => $user->id,
        'order_date' => now(),
        'total_amount' => 20.00
    ]);

    // Filter type = purchase, and date = today onwards
    $response = $this->getJson('/api/ledger/timeline?type=purchase&from=' . now()->format('Y-m-d'));
    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.amount'))->toEqual(20.00);
});
