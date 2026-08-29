<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VolunteerAlert extends Model
{
    use HasFactory;

    public const STATUS_NOTIFIED = 'notified';
    public const STATUS_RESPONDED = 'responded';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'emergency_alert_id',
        'volunteer_id',
        'distance_km',
        'status',
        'responded_at',
        'points_awarded',
    ];

    protected $casts = [
        'distance_km' => 'float',
        'responded_at' => 'datetime',
        'points_awarded' => 'integer',
    ];

    public function emergencyAlert(): BelongsTo
    {
        return $this->belongsTo(EmergencyAlert::class);
    }

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(Volunteer::class);
    }

    /**
     * Still worth turning up for: the incident has not been closed out.
     */
    public function isOngoing(): bool
    {
        return in_array($this->status, [self::STATUS_NOTIFIED, self::STATUS_RESPONDED], true);
    }
}
