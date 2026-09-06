<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Slot extends Model
{
    use HasFactory;

        protected $fillable = [
        'pharmacist_id',
        'date',
        'start_time',
        'end_time',
        'is_available',
    ];

        protected $casts = [
        'date' => 'date',
        'start_time' => 'integer',
        'end_time' => 'integer',
        'is_available' => 'boolean',
    ];

        public function pharmacist(): BelongsTo
    {
        return $this->belongsTo(Pharmacist::class);
    }

        public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }
}
