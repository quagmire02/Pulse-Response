<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AmbulanceVehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'ambulance_company_id',
        'vehicle_number',
        'model',
        'status',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(AmbulanceCompany::class, 'ambulance_company_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(AmbulanceTrip::class, 'vehicle_id');
    }
}
