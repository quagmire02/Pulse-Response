<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class CartItem extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;

    public const TYPE_MEDICINE = 'medicine';
    public const TYPE_EQUIPMENT_PURCHASE = 'equipment_purchase';
    public const TYPE_EQUIPMENT_RENTAL = 'equipment_rental';

        public const TYPES = [
        self::TYPE_MEDICINE,
        self::TYPE_EQUIPMENT_PURCHASE,
        self::TYPE_EQUIPMENT_RENTAL,
    ];

    protected $fillable = [
        'cart_id',
        'item_type',
        'medicine_id',
        'equipment_id',
        'quantity',
        'rental_start',
        'rental_end',
        'unit_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rental_start' => 'date',
        'rental_end' => 'date',
        'unit_price' => 'decimal:2',
    ];

    protected $appends = ['rental_days', 'line_total'];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function isMedicine(): bool
    {
        return $this->item_type === self::TYPE_MEDICINE;
    }

    public function isRental(): bool
    {
        return $this->item_type === self::TYPE_EQUIPMENT_RENTAL;
    }

    public function isEquipment(): bool
    {
        return $this->item_type !== self::TYPE_MEDICINE;
    }

        public function getRentalDaysAttribute(): int
    {
        if (!$this->isRental() || !$this->rental_start || !$this->rental_end) {
            return 0;
        }

        return Carbon::parse($this->rental_start)->diffInDays(Carbon::parse($this->rental_end)) + 1;
    }

        public function resolveUnitPrice(): float
    {
        if ($this->unit_price !== null) {
            return (float) $this->unit_price;
        }

        return match ($this->item_type) {
            self::TYPE_MEDICINE => (float) ($this->medicine->price ?? 0),
            self::TYPE_EQUIPMENT_PURCHASE => (float) ($this->equipment->sale_price ?? 0),
            self::TYPE_EQUIPMENT_RENTAL => (float) ($this->equipment->price_per_day ?? 0),
            default => 0.0,
        };
    }

    public function getLineTotalAttribute(): float
    {
        $unit = $this->resolveUnitPrice();

        if ($this->isRental()) {
            return round($unit * max(1, $this->rental_days) * max(1, (int) $this->quantity), 2);
        }

        return round($unit * max(1, (int) $this->quantity), 2);
    }
}
