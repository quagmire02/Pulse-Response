<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Slot extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pharmacist_id',
        'date',
        'start_time',
        'end_time',
        'is_available',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'start_time' => 'integer',
        'end_time' => 'integer',
        'is_available' => 'boolean',
    ];

    /**
     * Get the pharmacist that owns the slot.
     */
    public function pharmacist(): BelongsTo
    {
        return $this->belongsTo(Pharmacist::class);
    }

    /**
     * Get the consultation associated with the slot.
     */
    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }
}
