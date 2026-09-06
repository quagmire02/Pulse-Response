<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Empties every operational table so a demo can be recorded from a clean start,
 * while keeping the admin and super admin accounts that have to approve the new
 * signups.
 *
 * Categories are kept by default: a medicine cannot be created without one, so
 * wiping them turns the very first form into a dead end. Pass --categories to
 * clear them too.
 */
class ResetDemoData extends Command
{
    protected $signature = 'demo:reset
                            {--categories : Also wipe the medicine categories}
                            {--force : Skip the confirmation prompt}';

    protected $description = 'Wipe all data except admin and super admin accounts.';

    /**
     * Emptied wholesale. Order does not matter because the truncate is done
     * with foreign key checks suspended.
     *
     * @var array<int, string>
     */
    private const TABLES = [
        // Shop
        'cart_items',
        'carts',
        'order_items',
        'orders',
        'prescriptions',
        'payments',
        'payment_transactions',
        'deliveries',
        // Catalogue
        'medicine_categories',
        'medicines',
        'equipment',
        'equipments',
        'equipment_rentals',
        'equipment_fulfillments',
        // Consultations
        'slots',
        'consultations',
        'doctor_reviews',
        'vendor_reviews',
        // Emergency response
        'emergency_alerts',
        'ambulance_trips',
        'ambulance_vehicles',
        'ambulance_companies',
        'volunteer_alerts',
        'volunteers',
        // Accounts other than the admins
        'signup_requests',
        'pharmacists',
        'pharmacist_profiles',
        'vendors',
        'notifications',
        'personal_access_tokens',
    ];

    public function handle(): int
    {
        if (!$this->option('force') && !$this->confirm('This deletes all data except admin accounts. Continue?')) {
            $this->warn('Cancelled.');
            return self::SUCCESS;
        }

        $tables = self::TABLES;

        if ($this->option('categories')) {
            $tables[] = 'categories';
        }

        $driver = DB::getDriverName();

        $this->withoutForeignKeys($driver, function () use ($tables, $driver) {
            foreach ($tables as $table) {
                if (!Schema::hasTable($table)) {
                    continue;
                }

                // RESTART IDENTITY so the new records start at #1 rather than
                // continuing from whatever the test data reached.
                $driver === 'pgsql'
                    ? DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE")
                    : DB::table($table)->truncate();

                $this->line("  cleared {$table}");
            }

            // Everyone except the people who approve the new signups.
            $removed = DB::table('users')
                ->where('is_admin', false)
                ->where('is_super_admin', false)
                ->delete();

            $this->line("  removed {$removed} non admin user(s)");
        });

        $kept = DB::table('users')
            ->where(fn ($q) => $q->where('is_admin', true)->orWhere('is_super_admin', true))
            ->count();

        $this->newLine();
        $this->info("Done. {$kept} admin account(s) kept.");

        if (!$this->option('categories')) {
            $this->comment('Medicine categories were kept. Add --categories to wipe those too.');
        }

        return self::SUCCESS;
    }

    /**
     * Truncating a table another table points at fails while the constraints
     * are live, so they come off for the duration and go straight back on.
     */
    private function withoutForeignKeys(string $driver, callable $callback): void
    {
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        try {
            $callback();
        } finally {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
        }
    }
}
