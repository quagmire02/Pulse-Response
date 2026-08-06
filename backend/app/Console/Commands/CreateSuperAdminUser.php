<?php

namespace App\Console\Commands;

use Illuminate\Console\Command as NewCommand;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\Console\Command\Command;
use App\Models\User;
use App\Models\Cart;

class CreateSuperAdminUser extends NewCommand
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:superadmin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new super admin user.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating a new Super Admin User...');

        // User Input
        $email = $this->ask('Enter the email address for the Super Admin:');
        $password = $this->secret('Enter the password for the Super Admin:');
        $password_confirmation = $this->secret('Confirm the password:');

        // Basic Validation
        $validator = Validator::make([
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password_confirmation,
        ], [
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }

        // Prepare data for user creation
        $data = [
            'email' => $email,
            'password' => $password,
            'username' => $email,
            'is_admin' => true,
            'is_super_admin' => true,
            'is_active' => true,
        ];

        // Create the User
        try {
            DB::transaction(function () use ($data) {
                $user = User::create($data);

                Cart::create([
                    'user_id' => $user->id
                ]);
            });

            $this->info('Super Admin User created successfully!');
            return Command::SUCCESS;

        } catch (ValidationException $e) {
            $this->error('Password strength validation failed:');
            foreach ($e->errors()['password'] ?? [] as $error) {
                $this->error("- " . $error);
            }
            return Command::FAILURE;
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'for key \'users_email_unique\'')) {
                $this->error('The email address is already in use by another user.');
            } elseif (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'for key \'users_username_unique\'')) {
                $this->error('The username is already in use by another user.');
            } elseif (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'for key \'users_slug_unique\'')) {
                 $this->error('A user with that email already exists, causing a duplicate slug. Please use a different email.');
            } else {
                $this->error('An unexpected database error occurred: ' . $e->getMessage());
            }
            return Command::FAILURE;
        } catch (\Exception $e) {
            $this->error('An error occurred: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}