<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class AmbulanceVehicle extends Model
{
    use HasFactory;

        public const PING_TIMEOUT_SECONDS = 120;

    protected $fillable = [
        'ambulance_company_id',
        'driver_user_id',
        'vehicle_number',
        'model',
        'status',
        'current_lat',
        'current_lng',
        'last_ping_at',
    ];

    protected $casts = [
        'current_lat' => 'float',
        'current_lng' => 'float',
        'last_ping_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(AmbulanceCompany::class, 'ambulance_company_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_user_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(AmbulanceTrip::class, 'vehicle_id');
    }

    public function isOnline(): bool
    {
        return $this->last_ping_at
            && $this->last_ping_at->gt(now()->subSeconds(self::PING_TIMEOUT_SECONDS));
    }

        public function scopeDispatchable(Builder $query): Builder
    {
        return $query->where('status', 'available')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->where('last_ping_at', '>=', now()->subSeconds(self::PING_TIMEOUT_SECONDS));
    }
}
