<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;

    public const TYPE_MEDICINE = 'medicine';
    public const TYPE_EQUIPMENT_PURCHASE = 'equipment_purchase';
    public const TYPE_EQUIPMENT_RENTAL = 'equipment_rental';

    protected $fillable = [
        'order_id',
        'item_type',
        'medicine_id',
        'equipment_id',
        'quantity',
        'rental_start',
        'rental_end',
        'unit_price',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rental_start' => 'date',
        'rental_end' => 'date',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function fulfillment()
    {
        return $this->hasOne(EquipmentFulfillment::class);
    }

    public function isMedicine(): bool
    {
        return $this->item_type === self::TYPE_MEDICINE;
    }

    public function isEquipment(): bool
    {
        return in_array($this->item_type, [self::TYPE_EQUIPMENT_PURCHASE, self::TYPE_EQUIPMENT_RENTAL], true);
    }
}
