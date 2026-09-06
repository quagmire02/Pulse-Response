<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbulanceTrip extends Model
{
    use HasFactory;
    /**
     * Callout fare, charged the moment a vehicle is assigned.
     *
     * The revenue column existed from the first migration but nothing ever
     * wrote to it, so every ambulance dashboard reported zero earnings no
     * matter how many runs the fleet did. A flat callout plus a distance rate
     * is the simplest model that produces a defensible number.
     */
    public const BASE_FARE = 20.00;
    public const PER_KM_RATE = 2.50;

    public static function calculateFare(?float $distanceKm): float
    {
        return round(self::BASE_FARE + (max(0.0, (float) $distanceKm) * self::PER_KM_RATE), 2);
    }


    protected $fillable = [
        'ambulance_company_id',
        'vehicle_id',
        'emergency_alert_id',
        'patient_name',
        'dispatch_time',
        'arrival_time',
        'completion_time',
        'revenue',
        'response_delay_minutes',
    ];

    protected $casts = [
        'dispatch_time' => 'datetime',
        'arrival_time' => 'datetime',
        'completion_time' => 'datetime',
        'revenue' => 'decimal:2',
        'response_delay_minutes' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(AmbulanceCompany::class, 'ambulance_company_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(AmbulanceVehicle::class, 'vehicle_id');
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(EmergencyAlert::class, 'emergency_alert_id');
    }
}
