<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Volunteer extends Model
{
    use HasFactory;

        public const PING_TIMEOUT_SECONDS = 300;

        public const POINTS_PER_INCIDENT = 10;

        public const REWARDS = [
        'theme_dark' => ['name' => 'Dark mode', 'cost' => 30, 'type' => 'theme', 'value' => 'dark'],
        'theme_forest' => ['name' => 'Forest theme', 'cost' => 50, 'type' => 'theme', 'value' => 'forest'],
        'theme_sunset' => ['name' => 'Sunset theme', 'cost' => 50, 'type' => 'theme', 'value' => 'sunset'],
        'font_serif' => ['name' => 'Serif typeface', 'cost' => 20, 'type' => 'font', 'value' => 'serif'],
        'font_mono' => ['name' => 'Monospace typeface', 'cost' => 20, 'type' => 'font', 'value' => 'mono'],
    ];

    protected $fillable = [
        'user_id',
        'skills',
        'is_available',
        'current_lat',
        'current_lng',
        'last_ping_at',
        'points',
        'lifetime_points',
        'incidents_helped',
        'unlocked_rewards',
        'active_theme',
        'active_font',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'current_lat' => 'float',
        'current_lng' => 'float',
        'last_ping_at' => 'datetime',
        'points' => 'integer',
        'lifetime_points' => 'integer',
        'incidents_helped' => 'integer',
        'unlocked_rewards' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(VolunteerAlert::class);
    }

    public function isOnline(): bool
    {
        return $this->last_ping_at
            && $this->last_ping_at->gt(now()->subSeconds(self::PING_TIMEOUT_SECONDS));
    }

    public function hasUnlocked(string $rewardKey): bool
    {
        return in_array($rewardKey, $this->unlocked_rewards ?? [], true);
    }

        public function scopeReachable(Builder $query): Builder
    {
        return $query->where('is_available', true)
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->where('last_ping_at', '>=', now()->subSeconds(self::PING_TIMEOUT_SECONDS));
    }
}
