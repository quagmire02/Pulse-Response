<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Medicine;
use App\Models\Category;
use App\Models\MedicineCategory;
use App\Models\Pharmacist;
use App\Models\Slot;
use App\Models\Vendor;
use App\Models\Equipment;
use App\Models\AmbulanceCompany;
use App\Models\AmbulanceVehicle;
use App\Models\AmbulanceTrip;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──────────────────────────────────────────────
        User::create([
            'first_name'     => 'Rahim',
            'last_name'      => 'Uddin',
            'email'          => 'superadmin@pulseresponse.com.bd',
            'username'       => 'rahim_superadmin',
            'password'       => 'Pulse@0000',
            'is_active'      => true,
            'is_super_admin' => true,
            'role'           => 'super_admin',
        ]);

        // ── Admin ────────────────────────────────────────────────────
        User::create([
            'first_name' => 'Nasrin',
            'last_name'  => 'Akter',
            'email'      => 'admin@pulseresponse.com.bd',
            'username'   => 'nasrin_admin',
            'password'   => 'Pulse@0000',
            'is_active'  => true,
            'is_admin'   => true,
            'role'       => 'admin',
        ]);

        // ── Regular Users ────────────────────────────────────────────
        $users = collect();
        $regularUsers = [
            ['first_name' => 'Karim',   'last_name' => 'Hossain',  'email' => 'karim.hossain@gmail.com',   'username' => 'karim_hossain',   'address' => 'Mirpur-10, Dhaka'],
            ['first_name' => 'Fatema',  'last_name' => 'Begum',    'email' => 'fatema.begum@gmail.com',    'username' => 'fatema_begum',    'address' => 'Gulshan-2, Dhaka'],
            ['first_name' => 'Sabbir',  'last_name' => 'Ahmed',    'email' => 'sabbir.ahmed@gmail.com',    'username' => 'sabbir_ahmed',    'address' => 'Agrabad, Chattogram'],
            ['first_name' => 'Sumaiya', 'last_name' => 'Islam',    'email' => 'sumaiya.islam@gmail.com',   'username' => 'sumaiya_islam',   'address' => 'Sylhet Sadar, Sylhet'],
            ['first_name' => 'Rakib',   'last_name' => 'Mia',      'email' => 'rakib.mia@gmail.com',       'username' => 'rakib_mia',       'address' => 'Rajshahi City, Rajshahi'],
        ];
        foreach ($regularUsers as $data) {
            $users->push(User::create(array_merge($data, ['password' => 'Pulse@0000', 'is_active' => true])));
        }

        // ── Medicine Categories ──────────────────────────────────────
        $catAnalgesic      = Category::create(['name' => 'Analgesic']);
        $catAntacid        = Category::create(['name' => 'Antacid']);
        $catAntihistamine  = Category::create(['name' => 'Antihistamine']);
        $catRespiratory    = Category::create(['name' => 'Respiratory']);
        $catAntibiotic     = Category::create(['name' => 'Antibiotic']);

        // ── Medicines ────────────────────────────────────────────────
        $medicines = [
            [
                'name'         => 'Napa',
                'generic_name' => 'Paracetamol',
                'brand'        => 'Beximco',
                'dosage'       => '500 mg tablet',
                'price'        => 1.20,
                'stock'        => 500,
                'description'  => 'Fever and mild to moderate pain relief. Up to 4 doses in 24 hours.',
                'category_id'  => $catAnalgesic->id,
            ],
            [
                'name'         => 'Ace',
                'generic_name' => 'Paracetamol',
                'brand'        => 'Square',
                'dosage'       => '500 mg tablet',
                'price'        => 1.50,
                'stock'        => 300,
                'description'  => 'Paracetamol tablet for fever, headache and body ache.',
                'category_id'  => $catAnalgesic->id,
            ],
            [
                'name'         => 'Seclo',
                'generic_name' => 'Omeprazole',
                'brand'        => 'Square',
                'dosage'       => '20 mg capsule',
                'price'        => 5.00,
                'stock'        => 200,
                'description'  => 'Reduces stomach acid. Taken before breakfast for gastric reflux.',
                'category_id'  => $catAntacid->id,
            ],
            [
                'name'         => 'Alatrol',
                'generic_name' => 'Cetirizine',
                'brand'        => 'Square',
                'dosage'       => '10 mg tablet',
                'price'        => 2.50,
                'stock'        => 250,
                'description'  => 'Allergy, runny nose and skin rash relief. May cause drowsiness.',
                'category_id'  => $catAntihistamine->id,
            ],
            [
                'name'         => 'Monas',
                'generic_name' => 'Montelukast',
                'brand'        => 'Square',
                'dosage'       => '10 mg tablet',
                'price'        => 9.00,
                'stock'        => 120,
                'description'  => 'Preventive control of asthma and allergic rhinitis. Taken at night.',
                'category_id'  => $catRespiratory->id,
            ],
            [
                'name'         => 'Azithro',
                'generic_name' => 'Azithromycin',
                'brand'        => 'Incepta',
                'dosage'       => '500 mg tablet',
                'price'        => 35.00,
                'stock'        => 150,
                'description'  => 'Broad-spectrum antibiotic for respiratory and skin infections. Take on empty stomach.',
                'category_id'  => $catAntibiotic->id,
            ],
            [
                'name'         => 'Napa Extra',
                'generic_name' => 'Paracetamol + Caffeine',
                'brand'        => 'Beximco',
                'dosage'       => '500/65 mg tablet',
                'price'        => 2.00,
                'stock'        => 400,
                'description'  => 'Enhanced pain relief with caffeine for headache and migraine.',
                'category_id'  => $catAnalgesic->id,
            ],
            [
                'name'         => 'Losectil',
                'generic_name' => 'Omeprazole',
                'brand'        => 'Incepta',
                'dosage'       => '20 mg capsule',
                'price'        => 4.50,
                'stock'        => 180,
                'description'  => 'Proton pump inhibitor for peptic ulcer and GERD treatment.',
                'category_id'  => $catAntacid->id,
            ],
        ];

        foreach ($medicines as $data) {
            $categoryId = $data['category_id'];
            unset($data['category_id']);
            $medicine = Medicine::create($data);
            $medicine->categories()->attach($categoryId);
        }

        // ── Doctors (stored in pharmacists table) ────────────────────
        $doctors = [
            [
                'user' => [
                    'first_name' => 'Abdul',    'last_name' => 'Kalam',
                    'email'      => 'dr.abdulkalam@gmail.com',
                    'username'   => 'dr_abdulkalam',
                    'address'    => 'Dhanmondi, Dhaka',
                    'password'   => 'Pulse@0000', 'is_active' => true, 'role' => 'doctor',
                ],
                'profile' => ['license_num' => 101234, 'speciality' => 'Cardiology',       'bio' => 'Senior cardiologist with 15 years of experience at NICVD Dhaka.',    'is_consultation' => true],
            ],
            [
                'user' => [
                    'first_name' => 'Shahnaz',  'last_name' => 'Parvin',
                    'email'      => 'dr.shahnazparvin@gmail.com',
                    'username'   => 'dr_shahnazparvin',
                    'address'    => 'Uttara, Dhaka',
                    'password'   => 'Pulse@0000', 'is_active' => true, 'role' => 'doctor',
                ],
                'profile' => ['license_num' => 102345, 'speciality' => 'Gynaecology',      'bio' => 'Consultant gynaecologist at Dhaka Medical College Hospital.',          'is_consultation' => true],
            ],
            [
                'user' => [
                    'first_name' => 'Mizanur',  'last_name' => 'Rahman',
                    'email'      => 'dr.mizanurrahman@gmail.com',
                    'username'   => 'dr_mizanurrahman',
                    'address'    => 'Agrabad, Chattogram',
                    'password'   => 'Pulse@0000', 'is_active' => true, 'role' => 'doctor',
                ],
                'profile' => ['license_num' => 103456, 'speciality' => 'Neurology',        'bio' => 'Neurologist specialising in stroke and epilepsy at Chattogram Medical.', 'is_consultation' => true],
            ],
            [
                'user' => [
                    'first_name' => 'Tahmina',  'last_name' => 'Sultana',
                    'email'      => 'dr.tahminasultana@gmail.com',
                    'username'   => 'dr_tahminasultana',
                    'address'    => 'Sylhet Sadar, Sylhet',
                    'password'   => 'Pulse@0000', 'is_active' => true, 'role' => 'doctor',
                ],
                'profile' => ['license_num' => 104567, 'speciality' => 'Paediatrics',      'bio' => 'Paediatric specialist with focus on neonatal care at Sylhet MAG Hospital.', 'is_consultation' => true],
            ],
            [
                'user' => [
                    'first_name' => 'Anisur',   'last_name' => 'Hossain',
                    'email'      => 'dr.anisur@gmail.com',
                    'username'   => 'dr_anisur',
                    'address'    => 'Rajshahi City, Rajshahi',
                    'password'   => 'Pulse@0000', 'is_active' => true, 'role' => 'doctor',
                ],
                'profile' => ['license_num' => 105678, 'speciality' => 'Dermatology',      'bio' => 'Dermatologist treating skin disorders at Rajshahi Medical College.',     'is_consultation' => true],
            ],
        ];

        // start_time and end_time are stored as minutes since midnight
        $slotTimes = [540, 600, 660, 840, 900, 960, 1020]; // 9,10,11,14,15,16,17 h
        foreach ($doctors as $d) {
            $user = User::create($d['user']);
            $pharmacist = Pharmacist::create(array_merge(['user_id' => $user->id], $d['profile']));
            foreach ($slotTimes as $start) {
                Slot::create([
                    'pharmacist_id' => $pharmacist->id,
                    'date'          => now()->addDays(rand(1, 14))->toDateString(),
                    'start_time'    => $start,
                    'end_time'      => $start + 60,
                    'is_available'  => true,
                ]);
            }
        }

        // ── Vendor ───────────────────────────────────────────────────
        $vendorUser = User::create([
            'first_name' => 'Jahangir',
            'last_name'  => 'Alam',
            'email'      => 'vendor@meditechbd.com',
            'username'   => 'jahangir_meditech',
            'password'   => 'Pulse@0000',
            'is_active'  => true,
            'role'       => 'vendor',
            'address'    => 'Tejgaon Industrial Area, Dhaka',
        ]);
        $vendor = Vendor::create([
            'user_id'       => $vendorUser->id,
            'company_name'  => 'MediTech BD Equipment Suppliers',
            'license_num'   => 'DGDA-VND-2024-0091',
            'description'   => 'Leading medical equipment supplier in Bangladesh, serving hospitals and home-care patients since 2010.',
            'contact_phone' => '01711-234567',
        ]);

        // ── Equipment ────────────────────────────────────────────────
        $equipmentData = [
            [
                'name'         => 'Standard Folding Wheelchair',
                'description'  => 'Lightweight folding frame with footrests and detachable armrests, suitable for indoor and short outdoor use.',
                'category'     => 'mobility',
                'size'         => '46 cm seat',
                'condition'    => 'good',
                'price_per_day'=> 5.00,
                'sale_price'   => 120.00,
                'quantity'     => 8,
                'is_for_rent'  => true,
                'is_for_sale'  => true,
                'safety_rules' => 'Lock both wheels before transferring. Max user weight 100 kg.',
            ],
            [
                'name'         => 'Oxygen Concentrator 5L',
                'description'  => 'Continuous flow oxygen for home therapy, includes humidifier bottle and nasal cannula.',
                'category'     => 'respiratory',
                'size'         => '5 L/min',
                'condition'    => 'new',
                'price_per_day'=> 15.00,
                'sale_price'   => null,
                'quantity'     => 4,
                'is_for_rent'  => true,
                'is_for_sale'  => false,
                'safety_rules' => 'Keep 2 m from open flame. Never adjust flow without a prescription.',
            ],
            [
                'name'         => 'Digital Blood Pressure Monitor',
                'description'  => 'Automatic upper-arm monitor storing the last 60 readings for two users.',
                'category'     => 'diagnostic',
                'size'         => 'Upper arm cuff',
                'condition'    => 'new',
                'price_per_day'=> 0.00,
                'sale_price'   => 35.00,
                'quantity'     => 25,
                'is_for_rent'  => false,
                'is_for_sale'  => true,
                'safety_rules' => 'Sit still for 5 minutes before measuring. Cuff at heart level.',
            ],
            [
                'name'         => 'Manual Hospital Bed, 2 Crank',
                'description'  => 'Two-crank adjustable bed with backrest and knee elevation, castors with brakes.',
                'category'     => 'patient care',
                'size'         => '200 x 90 cm',
                'condition'    => 'good',
                'price_per_day'=> 20.00,
                'sale_price'   => null,
                'quantity'     => 3,
                'is_for_rent'  => true,
                'is_for_sale'  => false,
                'safety_rules' => 'Raise side rails when unattended. Two people required to move.',
            ],
            [
                'name'         => 'Nebulizer Machine',
                'description'  => 'Compressor nebulizer for adult and paediatric masks, for asthma and bronchitis medication.',
                'category'     => 'respiratory',
                'size'         => 'Compact, mains powered',
                'condition'    => 'new',
                'price_per_day'=> 4.00,
                'sale_price'   => 45.00,
                'quantity'     => 12,
                'is_for_rent'  => true,
                'is_for_sale'  => true,
                'safety_rules' => 'Sterilise mask and chamber after each use. Do not run dry.',
            ],
        ];

        foreach ($equipmentData as $eq) {
            Equipment::create(array_merge($eq, [
                'vendor_id'    => $vendor->id,
                'is_available' => true,
            ]));
        }

        // ── Ambulance Company ────────────────────────────────────────
        $ambulanceUser = User::create([
            'first_name' => 'Shafiqul',
            'last_name'  => 'Islam',
            'email'      => 'dispatch@dhakaambulanace.com.bd',
            'username'   => 'shafiqul_ambulance',
            'password'   => 'Pulse@0000',
            'is_active'  => true,
            'role'       => 'ambulance_company',
            'address'    => 'Farmgate, Dhaka',
        ]);
        $company = AmbulanceCompany::create([
            'user_id'       => $ambulanceUser->id,
            'company_name'  => 'Dhaka Rapid Ambulance Service',
            'license_num'   => 'DGDA-AMB-2024-0045',
            'description'   => '24/7 emergency ambulance service covering Dhaka, Chattogram and Sylhet divisions.',
            'contact_phone' => '01911-999888',
        ]);

        $v1 = AmbulanceVehicle::create(['ambulance_company_id' => $company->id, 'vehicle_number' => 'DHK-AMB-001', 'model' => 'Toyota HiAce Medic',          'status' => 'available']);
        $v2 = AmbulanceVehicle::create(['ambulance_company_id' => $company->id, 'vehicle_number' => 'DHK-AMB-002', 'model' => 'Mitsubishi L300 ICU Van',     'status' => 'busy']);
        $v3 = AmbulanceVehicle::create(['ambulance_company_id' => $company->id, 'vehicle_number' => 'DHK-AMB-003', 'model' => 'Toyota HiAce Basic Life',     'status' => 'maintenance']);

        $trips = [
            ['vehicle' => $v1, 'days_ago' => 10, 'delay' => 8,  'revenue' => 800.00,  'patient' => 'Mohammad Rafiqul Islam'],
            ['vehicle' => $v1, 'days_ago' => 8,  'delay' => 12, 'revenue' => 1200.00, 'patient' => 'Begum Rokeya Khatun'],
            ['vehicle' => $v2, 'days_ago' => 7,  'delay' => 15, 'revenue' => 2000.00, 'patient' => 'Nurul Amin Chowdhury'],
            ['vehicle' => $v2, 'days_ago' => 5,  'delay' => 5,  'revenue' => 900.00,  'patient' => 'Salma Begum'],
            ['vehicle' => $v1, 'days_ago' => 4,  'delay' => 10, 'revenue' => 1000.00, 'patient' => 'Abul Kashem Mia'],
            ['vehicle' => $v2, 'days_ago' => 3,  'delay' => 9,  'revenue' => 1500.00, 'patient' => 'Hasina Akter'],
            ['vehicle' => $v1, 'days_ago' => 2,  'delay' => 6,  'revenue' => 850.00,  'patient' => 'Jamal Uddin Sarkar'],
            ['vehicle' => $v2, 'days_ago' => 1,  'delay' => 14, 'revenue' => 1800.00, 'patient' => 'Roksana Parvin'],
        ];

        foreach ($trips as $t) {
            $dispatch   = now()->subDays($t['days_ago'])->subMinutes(60);
            $arrival    = (clone $dispatch)->addMinutes($t['delay']);
            $completion = (clone $arrival)->addMinutes(45);
            AmbulanceTrip::create([
                'ambulance_company_id'   => $company->id,
                'vehicle_id'             => $t['vehicle']->id,
                'patient_name'           => $t['patient'],
                'dispatch_time'          => $dispatch,
                'arrival_time'           => $arrival,
                'completion_time'        => $completion,
                'revenue'                => $t['revenue'],
                'response_delay_minutes' => $t['delay'],
            ]);
        }
    }
}
