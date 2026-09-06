<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Equipment;
use App\Models\Medicine;
use App\Models\PharmacistProfile;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Replaces the factory generated demo data with a small, readable catalogue.
 *
 * The database seeder fills the catalogue with faker output: medicines called
 * "molestias consequatur et" priced at $438.97. That is fine for testing a
 * paginator and useless for showing the product to anyone. This wipes it and
 * writes a handful of real looking rows instead, then recreates every login
 * including the admins, so nothing is left with an unknown password.
 */
class SeedDemoFresh extends Command
{
    protected $signature = 'demo:fresh
                            {--password= : Password for every account created}
                            {--force : Skip the confirmation prompt}';

    protected $description = 'Wipe the demo data and rebuild a clean catalogue and one login per role.';

    /**
     * Cleared before rebuilding. Users are handled separately because the
     * admins are recreated here rather than preserved.
     *
     * @var array<int, string>
     */
    private const TABLES = [
        'cart_items', 'carts', 'order_items', 'orders', 'prescriptions',
        'payments', 'payment_transactions', 'deliveries',
        'medicine_categories', 'medicines', 'categories',
        'equipment', 'equipments', 'equipment_rentals', 'equipment_fulfillments',
        'slots', 'consultations', 'doctor_reviews', 'vendor_reviews',
        'emergency_alerts', 'ambulance_trips', 'ambulance_vehicles', 'ambulance_companies',
        'volunteer_alerts', 'volunteers',
        'signup_requests', 'pharmacists', 'pharmacist_profiles', 'vendors',
        'notifications', 'personal_access_tokens', 'users',
    ];

    /**
     * Real products rather than faker strings. Napa and Ace deliberately share
     * a generic name so the out of stock alternative suggestion can be shown.
     *
     * @var array<int, array<int, mixed>>
     */
    private const MEDICINES = [
        ['Napa', 'Paracetamol', 'Beximco', '500 mg tablet', 1.20, 500, 'Analgesic', 'Fever and mild to moderate pain relief. Up to four doses in 24 hours.'],
        ['Ace', 'Paracetamol', 'Square', '500 mg tablet', 1.50, 300, 'Analgesic', 'Paracetamol tablet for fever, headache and body ache.'],
        ['Seclo', 'Omeprazole', 'Square', '20 mg capsule', 5.00, 200, 'Antacid', 'Reduces stomach acid. Taken before breakfast for gastric reflux.'],
        ['Alatrol', 'Cetirizine', 'Square', '10 mg tablet', 2.50, 250, 'Antihistamine', 'Allergy, runny nose and skin rash relief. May cause drowsiness.'],
        ['Monas', 'Montelukast', 'Square', '10 mg tablet', 9.00, 120, 'Respiratory', 'Preventive control of asthma and allergic rhinitis. Taken at night.'],
    ];

    /**
     * A deliberate mix of rent only, sale only and both, so a cart can hold a
     * rental and a purchase at the same time.
     *
     * @var array<int, array<string, mixed>>
     */
    private const EQUIPMENT = [
        [
            'name' => 'Standard Folding Wheelchair', 'category' => 'mobility', 'size' => '46 cm seat',
            'condition' => 'good', 'price_per_day' => 5.00, 'sale_price' => 120.00, 'quantity' => 8,
            'is_for_rent' => true, 'is_for_sale' => true,
            'description' => 'Lightweight folding frame with footrests and detachable armrests.',
            'safety_rules' => 'Lock both wheels before transferring. Maximum user weight 100 kg.',
        ],
        [
            'name' => 'Oxygen Concentrator 5L', 'category' => 'respiratory', 'size' => '5 L/min',
            'condition' => 'new', 'price_per_day' => 15.00, 'sale_price' => null, 'quantity' => 4,
            'is_for_rent' => true, 'is_for_sale' => false,
            'description' => 'Continuous flow oxygen for home therapy, with humidifier and cannula.',
            'safety_rules' => 'Keep two metres from open flame. Never change flow without a prescription.',
        ],
        [
            'name' => 'Digital Blood Pressure Monitor', 'category' => 'diagnostic', 'size' => 'Upper arm cuff',
            'condition' => 'new', 'price_per_day' => 0.00, 'sale_price' => 35.00, 'quantity' => 25,
            'is_for_rent' => false, 'is_for_sale' => true,
            'description' => 'Automatic upper arm monitor storing the last 60 readings for two users.',
            'safety_rules' => 'Sit still for five minutes before measuring. Keep the cuff at heart level.',
        ],
        [
            'name' => 'Manual Hospital Bed', 'category' => 'patient care', 'size' => '200 x 90 cm',
            'condition' => 'good', 'price_per_day' => 20.00, 'sale_price' => null, 'quantity' => 3,
            'is_for_rent' => true, 'is_for_sale' => false,
            'description' => 'Two crank adjustable bed with backrest and knee elevation, braked castors.',
            'safety_rules' => 'Raise the side rails when unattended. Two people required to move it.',
        ],
        [
            'name' => 'Nebulizer Machine', 'category' => 'respiratory', 'size' => 'Compact, mains powered',
            'condition' => 'new', 'price_per_day' => 4.00, 'sale_price' => 45.00, 'quantity' => 12,
            'is_for_rent' => true, 'is_for_sale' => true,
            'description' => 'Compressor nebulizer with adult and paediatric masks.',
            'safety_rules' => 'Sterilise the mask and chamber after each use. Do not run dry.',
        ],
    ];

    public function handle(): int
    {
        $password = $this->option('password') ?: 'Severus00#';

        if (!$this->option('force') && !$this->confirm('This deletes ALL data including every account. Continue?')) {
            $this->warn('Cancelled.');
            return self::SUCCESS;
        }

        $this->wipe();
        $this->info('Cleared the old data.');

        $this->call('demo:accounts', ['--password' => $password]);

        $this->makeAdmins($password);
        $this->makeCatalogue();

        $this->newLine();
        $this->info('Catalogue: ' . Medicine::count() . ' medicines, ' . Equipment::count() . ' equipment, ' . Category::count() . ' categories.');
        $this->info('Accounts:  ' . User::count() . ' total, password ' . $password);

        return self::SUCCESS;
    }

    private function wipe(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        try {
            foreach (self::TABLES as $table) {
                if (!Schema::hasTable($table)) {
                    continue;
                }

                $driver === 'pgsql'
                    ? DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE")
                    : DB::table($table)->truncate();
            }
        } finally {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
        }
    }

    /**
     * The seeder's admins are faker accounts whose passwords nobody knows,
     * which is why the deployed site could not be administered at all.
     */
    private function makeAdmins(string $password): void
    {
        $admins = [
            ['superadmin@pulse.test', 'superadmin', 'Super', 'Admin', true, true],
            ['admin@pulse.test', 'admin', 'Site', 'Admin', true, false],
        ];

        foreach ($admins as [$email, $username, $first, $last, $isAdmin, $isSuper]) {
            $user = User::where('email', $email)->first() ?: new User();

            $user->fill([
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'username' => $username,
                'address' => 'Dhaka, Bangladesh',
                'role' => 'admin',
                'is_active' => true,
                'is_admin' => $isAdmin,
                'is_super_admin' => $isSuper,
            ]);

            $user->password = $password;
            $user->save();
        }
    }

    private function makeCatalogue(): void
    {
        // Owned by the first seeded pharmacist and vendor, so the per-account
        // dashboards have something of their own to report on.
        $pharmacistId = PharmacistProfile::orderBy('id')->value('id');
        $vendorId = Vendor::orderBy('id')->value('id');

        $categories = [];
        foreach (['Analgesic', 'Antacid', 'Antihistamine', 'Respiratory', 'Antibiotic'] as $name) {
            $categories[$name] = Category::firstOrCreate(['name' => $name])->id;
        }

        foreach (self::MEDICINES as [$name, $generic, $brand, $dosage, $price, $stock, $category, $description]) {
            $medicine = Medicine::create([
                'pharmacist_id' => $pharmacistId,
                'name' => $name,
                'generic_name' => $generic,
                'brand' => $brand,
                'dosage' => $dosage,
                'price' => $price,
                'stock' => $stock,
                'description' => $description,
            ]);

            $medicine->categories()->attach($categories[$category]);
        }

        foreach (self::EQUIPMENT as $row) {
            Equipment::create(array_merge($row, [
                'vendor_id' => $vendorId,
                'is_available' => true,
            ]));
        }
    }
}
