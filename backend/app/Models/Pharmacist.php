<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

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

    public function reviews(): HasMany
    {
        return $this->hasMany(DoctorReview::class);
    }

    public function userWithUsername()
    {
        return $this->belongsTo(User::class)->select('id', 'username');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) return $query;
        return $query->where('speciality', 'ilike', "%{$search}%")
            ->orWhereHas('user', fn($q) => $q->where('first_name', 'ilike', "%{$search}%")
                ->orWhere('last_name', 'ilike', "%{$search}%")
                ->orWhere('username', 'ilike', "%{$search}%"));
    }

    public function scopeFilterBySpeciality(Builder $query, ?string $speciality): Builder
    {
        if (!$speciality) return $query;
        return $query->where('speciality', 'ilike', "%{$speciality}%");
    }

    public function scopeFilterByLocation(Builder $query, ?string $location): Builder
    {
        if (!$location) return $query;
        return $query->whereHas('user', fn($q) => $q->where('address', 'ilike', "%{$location}%"));
    }

    public function scopeFilterByRating(Builder $query, ?float $minRating): Builder
    {
        if (!$minRating) return $query;
        return $query->has('reviews')
            ->withAvg('reviews', 'rating')
            ->orderByRaw('reviews_avg_rating DESC NULLS LAST')
            ->havingRaw('AVG(doctor_reviews.rating) >= ?', [$minRating])
            ->join('doctor_reviews', 'doctor_reviews.pharmacist_id', '=', 'pharmacists.id')
            ->groupBy('pharmacists.id');
    }
}