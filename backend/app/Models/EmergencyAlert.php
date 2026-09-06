<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'alert_type',
        'status',
        'location',
        'latitude',
        'longitude',
        'notes',
        'assigned_vehicle_id',
        'assigned_distance_km',
        'assigned_eta_minutes',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'assigned_distance_km' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedVehicle(): BelongsTo
    {
        return $this->belongsTo(AmbulanceVehicle::class, 'assigned_vehicle_id');
    }
}
