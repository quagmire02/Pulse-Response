<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SignupRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

        public const ROLES = ['user', 'pharmacist', 'doctor', 'vendor', 'ambulance_company', 'driver', 'volunteer'];

        public const PHARMACIST_ROLES = ['doctor'];

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'username',
        'address',
        'password',
        'role',
        'license_num',
        'speciality',
        'bio',
        'is_consultation',
        'company_name',
        'description',
        'contact_phone',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_consultation' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function needsPharmacistProfile(): bool
    {
        return in_array($this->role, self::PHARMACIST_ROLES, true);
    }

    public function needsAmbulanceCompanyProfile(): bool
    {
        return $this->role === 'ambulance_company';
    }

        public function isDriver(): bool
    {
        return $this->role === 'driver';
    }

    public function needsVolunteerProfile(): bool
    {
        return $this->role === 'volunteer';
    }

    public function needsVendorProfile(): bool
    {
        return $this->role === 'vendor';
    }

    public function scopeFilterByStatus(Builder $query, ?string $status): Builder
    {
        if (!$status) return $query;
        return $query->where('status', $status);
    }

    public function scopeFilterByRole(Builder $query, ?string $role): Builder
    {
        if (!$role) return $query;
        return $query->where('role', $role);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) return $query;
        $search = mb_strtolower($search);

        return $query->where(function ($q) use ($search) {
            $q->whereRaw('LOWER(email) LIKE ?', ['%' . $search . '%'])
              ->orWhereRaw('LOWER(username) LIKE ?', ['%' . $search . '%'])
              ->orWhereRaw('LOWER(first_name) LIKE ?', ['%' . $search . '%'])
              ->orWhereRaw('LOWER(last_name) LIKE ?', ['%' . $search . '%'])
              ->orWhereRaw('LOWER(company_name) LIKE ?', ['%' . $search . '%']);
        });
    }
}
