<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use \Illuminate\Validation\ValidationException;
use \Illuminate\Support\Facades\Hash;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
        use HasFactory, Notifiable, HasSlug, HasApiTokens;

        protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'address',
        'is_active',
        'is_admin',
        'is_super_admin',
        'role',
        'is_premium',
        'premium_expires_at',
        'membership_auto_renew',
        'stripe_customer_id',
        'stripe_payment_method_id',
    ];

        protected $hidden = [
        'password',
        'remember_token',
    ];

        protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_admin' => 'boolean',
            'is_super_admin' => 'boolean',
            'is_premium' => 'boolean',
            'membership_auto_renew' => 'boolean',
            'premium_expires_at' => 'datetime',
        ];
    }

        public function setPasswordAttribute($value)
    {
        if (! Hash::isHashed($value)) {
            $this->validatePasswordStrength($value);
            $this->attributes['password'] = Hash::make($value);
        } else {
            $this->attributes['password'] = $value;
        }
    }

        protected function validatePasswordStrength($password)
    {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters.';
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter.';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter.';
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number.';
        }

        if (!preg_match('/[!@#$%^&*(),.?":{}|<>[\]~\/\']/', $password)) {
            $errors[] = 'Password must contain at least one special character.';
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages(['password' => $errors]);
        }
    }

        public function getSlugOptions(): SlugOptions {
        return SlugOptions::create()
            ->generateSlugsFrom('email')
            ->saveSlugsTo('slug');
    }

    public function isAdmin(): bool
    {
        return $this->is_admin;
    }

        public function hasActivePremium(): bool
    {
        return $this->is_premium
            && $this->premium_expires_at
            && $this->premium_expires_at->isFuture();
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin;
    }

        public function resolveRole(): string
    {
        if ($this->is_super_admin) {
            return 'super_admin';
        }

        if ($this->is_admin) {
            return 'admin';
        }

        if ($this->role && $this->role !== 'user') {
            return $this->role;
        }

        if ($this->vendor()->exists()) {
            return 'vendor';
        }

        if ($this->pharmacistProfile()->exists()) {
            return 'pharmacist';
        }

        if ($this->pharmacist()->exists()) {
            return 'doctor';
        }

        if ($this->ambulanceCompany()->exists()) {
            return 'ambulance_company';
        }

        return 'user';
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

        public function pharmacist(): HasOne
    {
        return $this->hasOne(Pharmacist::class);
    }

        public function pharmacistProfile(): HasOne
    {
        return $this->hasOne(PharmacistProfile::class);
    }

    public function isPharmacist(): bool
    {
        return $this->pharmacistProfile()->exists();
    }

    public function isDoctor(): bool
    {
        return $this->pharmacist()->exists();
    }

    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function equipmentRentals(): HasMany
    {
        return $this->hasMany(EquipmentRental::class);
    }

    public function emergencyAlerts(): HasMany
    {
        return $this->hasMany(EmergencyAlert::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function ambulanceCompany(): HasOne
    {
        return $this->hasOne(AmbulanceCompany::class);
    }

    public function vendorReviews(): HasMany
    {
        return $this->hasMany(VendorReview::class);
    }
}
