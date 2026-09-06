<?php

namespace App\Console\Commands;

use App\Models\AmbulanceCompany;
use App\Models\AmbulanceVehicle;
use App\Models\Cart;
use App\Models\Pharmacist;
use App\Models\PharmacistProfile;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Volunteer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Creates one ready to use account per role, already approved.
 *
 * Signing up normally leaves every licensed role sitting in the admin queue,
 * which is the right behaviour for demonstrating the approval workflow but
 * tedious when the point is simply to log in as each role and look around.
 */
class SeedDemoAccounts extends Command
{
    protected $signature = 'demo:accounts {--password= : Password given to every account created}';

    protected $description = 'Create an approved, ready to log in account for each role.';

    public function handle(): int
    {
        $password = $this->option('password') ?: 'Severus00#';

        $rows = [];

        DB::transaction(function () use ($password, &$rows) {
            $customers = [
                ['sabbir.customer@pulse.test', 'sabbir', 'Sabbir', 'Rahman'],
                ['nadia.customer@pulse.test', 'nadia', 'Nadia', 'Islam'],
                ['rakib.customer@pulse.test', 'rakib', 'Rakib', 'Hasan'],
            ];

            foreach ($customers as $row) {
                $this->makeUser($row[0], $row[1], $row[2], $row[3], 'user', $password);
                $rows[] = ['Customer', $row[0], $row[1], 'Shops, orders, emergencies'];
            }

            // Doctors. The pharmacists table holds the consultation profile.
            $doctors = [
                ['farhana.doctor@pulse.test', 'drfarhana', 'Farhana', 'Kabir', 'Cardiology', 100201],
                ['imran.doctor@pulse.test', 'drimran', 'Imran', 'Chowdhury', 'Dermatology', 100202],
            ];

            foreach ($doctors as $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'doctor', $password);

                Pharmacist::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'license_num' => $row[5],
                        'speciality' => $row[4],
                        'bio' => $row[4] . ' consultant available for online consultations.',
                        'is_consultation' => true,
                    ]
                );

                $rows[] = ['Doctor', $row[0], $row[1], $row[4]];
            }

            // Pharmacy staff, a separate table from the doctors above.
            $pharmacists = [
                ['tanvir.pharmacy@pulse.test', 'tanvirpharm', 'Tanvir', 'Ahmed', 'Lazz Pharma Gulshan', 'PH-5001'],
                ['sumaiya.pharmacy@pulse.test', 'sumaiyapharm', 'Sumaiya', 'Akter', 'Wellbeing Pharmacy', 'PH-5002'],
            ];

            foreach ($pharmacists as $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'pharmacist', $password);

                PharmacistProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'license_num' => $row[5],
                        'pharmacy_name' => $row[4],
                        'contact_phone' => '+8801711000001',
                        'bio' => 'Dispensing pharmacist managing the medicine catalogue.',
                    ]
                );

                $rows[] = ['Pharmacist', $row[0], $row[1], $row[4]];
            }

            $vendors = [
                ['medequip.vendor@pulse.test', 'medequip', 'Arif', 'Hossain', 'MedEquip Bangladesh', 'VN-3001'],
                ['carerent.vendor@pulse.test', 'carerent', 'Shirin', 'Sultana', 'CareRent Medical', 'VN-3002'],
            ];

            foreach ($vendors as $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'vendor', $password);

                Vendor::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'company_name' => $row[4],
                        'license_num' => $row[5],
                        'description' => 'Medical equipment for rent and sale.',
                        'contact_phone' => '+8801711000002',
                    ]
                );

                $rows[] = ['Vendor', $row[0], $row[1], $row[4]];
            }

            // Ambulance companies, each with a fleet the drivers attach to.
            $companyRows = [
                ['swift.ambulance@pulse.test', 'swiftambulance', 'Swift', 'Response', 'Swift Ambulance Service', 'AC-7001'],
                ['citycare.ambulance@pulse.test', 'citycareambulance', 'City', 'Care', 'City Care Ambulance', 'AC-7002'],
            ];

            $companies = [];

            foreach ($companyRows as $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'ambulance_company', $password);

                $companies[] = AmbulanceCompany::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'company_name' => $row[4],
                        'license_num' => $row[5],
                        'description' => 'Emergency ambulance dispatch across the city.',
                        'contact_phone' => '+8801711000003',
                    ]
                );

                $rows[] = ['Ambulance company', $row[0], $row[1], $row[4]];
            }

            // Drivers, already attached to a vehicle so dispatch can pick them
            // the moment they go on duty and share a position.
            $drivers = [
                ['jamal.driver@pulse.test', 'jamaldriver', 'Jamal', 'Uddin', 'DHAKA-GA-1101', 'Toyota Hiace'],
                ['babul.driver@pulse.test', 'babuldriver', 'Babul', 'Mia', 'DHAKA-GA-1102', 'Nissan Urvan'],
            ];

            foreach ($drivers as $index => $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'driver', $password);

                $company = $companies[$index] ?? ($companies[0] ?? null);

                if (!$company) {
                    $rows[] = ['Driver', $row[0], $row[1], 'no company to attach to'];
                    continue;
                }

                AmbulanceVehicle::updateOrCreate(
                    ['vehicle_number' => $row[4]],
                    [
                        'ambulance_company_id' => $company->id,
                        'driver_user_id' => $user->id,
                        'model' => $row[5],
                        // Off duty until the driver signs on and shares GPS.
                        'status' => 'maintenance',
                    ]
                );

                $rows[] = ['Driver', $row[0], $row[1], $row[4]];
            }

            $volunteers = [
                ['mahin.volunteer@pulse.test', 'mahinvol', 'Mahin', 'Sarkar', 'First aid, CPR'],
                ['ruma.volunteer@pulse.test', 'rumavol', 'Ruma', 'Begum', 'Nursing student, first aid'],
            ];

            foreach ($volunteers as $row) {
                $user = $this->makeUser($row[0], $row[1], $row[2], $row[3], 'volunteer', $password);

                Volunteer::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'skills' => $row[4],
                        'is_available' => false,
                    ]
                );

                $rows[] = ['Volunteer', $row[0], $row[1], $row[4]];
            }
        });

        $this->newLine();
        $this->table(['Role', 'Email', 'Username', 'Detail'], $rows);
        $this->info('Password for every account above: ' . $password);

        return self::SUCCESS;
    }

    /**
     * Accounts are created directly rather than through the signup queue, so
     * they are active and approved immediately. Every account gets a cart
     * because checkout assumes one exists.
     */
    private function makeUser(
        string $email,
        string $username,
        string $first,
        string $last,
        string $role,
        string $password
    ): User {
        $user = User::where('email', $email)->first();

        if ($user) {
            // Re-running should reset the password rather than fail on the
            // unique email constraint.
            $user->password = $password;
            $user->role = $role;
            $user->is_active = true;
            $user->save();
        } else {
            $user = User::create([
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'username' => $username,
                'address' => 'Dhaka, Bangladesh',
                'password' => $password,
                'role' => $role,
                'is_active' => true,
            ]);
        }

        Cart::firstOrCreate(['user_id' => $user->id]);

        return $user;
    }
}
