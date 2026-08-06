<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// App/Models/Pharmacist.php
class Pharmacist extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'license_num',
        'speciality',
        'bio',
        'is_consultation',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'license_num' => 'integer',
        'is_consultation' => 'boolean',
    ];

    /**
     * Get the user that owns the pharmacist profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the slots for the pharmacist.
     */
    public function slots(): HasMany
    {
        return $this->hasMany(Slot::class);
    }

    public function userWithUsername()
    {
        return $this->belongsTo(User::class)->select('id', 'username');
    }
}