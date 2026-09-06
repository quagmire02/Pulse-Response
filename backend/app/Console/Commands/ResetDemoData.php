<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDemoData extends Command
{
    protected $signature = 'demo:reset
                            {--categories : Also wipe the medicine categories}
                            {--force : Skip the confirmation prompt}';

    protected $description = 'Wipe all data except admin and super admin accounts.';

        private const TABLES = [
        'cart_items',
        'carts',
        'order_items',
        'orders',
        'prescriptions',
        'payments',
        'payment_transactions',
        'deliveries',
        'medicine_categories',
        'medicines',
        'equipment',
        'equipments',
        'equipment_rentals',
        'equipment_fulfillments',
        'slots',
        'consultations',
        'doctor_reviews',
        'vendor_reviews',
        'emergency_alerts',
        'ambulance_trips',
        'ambulance_vehicles',
        'ambulance_companies',
        'volunteer_alerts',
        'volunteers',
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

                $driver === 'pgsql'
                    ? DB::statement("TRUNCATE TABLE \"{$table}\" RESTART IDENTITY CASCADE")
                    : DB::table($table)->truncate();

                $this->line("  cleared {$table}");
            }

            $removed = DB::table('users')
                ->where('is_admin', false)
                ->where('is_super_admin', false)
                ->delete();

            $this->line("  removed {$removed} non admin user(s)");
        });

        // The carts table was truncated, so the surviving admins lost theirs.
        // Checkout assumes every account has one.
        $adminIds = DB::table('users')
            ->where(fn ($q) => $q->where('is_admin', true)->orWhere('is_super_admin', true))
            ->pluck('id');

        foreach ($adminIds as $adminId) {
            DB::table('carts')->insert(['user_id' => $adminId]);
        }

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
