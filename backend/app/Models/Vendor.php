<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'license_num',
        'description',
        'contact_phone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(Equipment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(VendorReview::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(EquipmentRental::class);
    }

    public function fulfillments(): HasMany
    {
        return $this->hasMany(EquipmentFulfillment::class);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('company_name', 'ilike', "%{$search}%")
            ->orWhereHas('user', fn($q) => $q->where('first_name', 'ilike', "%{$search}%")
                ->orWhere('last_name', 'ilike', "%{$search}%")
                ->orWhere('username', 'ilike', "%{$search}%"));
    }
}
