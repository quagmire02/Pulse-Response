<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * Coordination record between a customer and a vendor for one equipment line
 * on an order: where to hand it over, when, and what each side wants to say
 * about it. Mirrors what the delivery record does for medicines.
 */
class EquipmentFulfillment extends Model
{
    use HasFactory;

    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_RENTAL = 'rental';

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_HANDED_OVER = 'handed_over';
    public const STATUS_RETURNED = 'returned';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @var array<int, string>
     */
    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_SCHEDULED,
        self::STATUS_HANDED_OVER,
        self::STATUS_RETURNED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'order_id',
        'order_item_id',
        'equipment_id',
        'vendor_id',
        'user_id',
        'equipment_rental_id',
        'type',
        'quantity',
        'rental_start',
        'rental_end',
        'total_price',
        'status',
        'handover_address',
        'customer_phone',
        'handover_scheduled_at',
        'customer_note',
        'vendor_note',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rental_start' => 'date',
        'rental_end' => 'date',
        'total_price' => 'decimal:2',
        'handover_scheduled_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(EquipmentRental::class, 'equipment_rental_id');
    }

    public function isOpen(): bool
    {
        return !in_array($this->status, [
            self::STATUS_HANDED_OVER,
            self::STATUS_RETURNED,
            self::STATUS_CANCELLED,
        ], true);
    }

    public function scopeFilterByStatus(Builder $query, ?string $status): Builder
    {
        if (!$status) return $query;
        return $query->where('status', $status);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNotIn('status', [
            self::STATUS_HANDED_OVER,
            self::STATUS_RETURNED,
            self::STATUS_CANCELLED,
        ]);
    }
}
