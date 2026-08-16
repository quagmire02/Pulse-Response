<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AmbulanceTrip extends Model
{
    use HasFactory;

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
