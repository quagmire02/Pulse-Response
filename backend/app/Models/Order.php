<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'total_amount',
        'discount_amount',
        'order_date',
        'order_status',
        'payment_status',
        'subscribe_type',
        'next_delivery_date',
        'is_subscription_renewal',
        'parent_order_id',
    ];

    protected $casts = [
        'order_date' => 'date',
        'next_delivery_date' => 'date',
        'is_subscription_renewal' => 'boolean',
    ];

    /**
     * Calculate subscription discount rate.
     */
    public static function getSubscriptionDiscountRate(string $subscribeType): float
    {
        return match ($subscribeType) {
            'weekly' => 0.05,   // 5% discount
            'monthly' => 0.10,  // 10% discount
            default => 0,
        };
    }

    /**
     * Calculate next delivery date based on subscription type.
     */
    public static function calculateNextDeliveryDate(string $subscribeType): ?\Carbon\Carbon
    {
        return match ($subscribeType) {
            'weekly' => now()->addWeek(),
            'monthly' => now()->addMonth(),
            default => null,
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public function parentOrder()
    {
        return $this->belongsTo(Order::class, 'parent_order_id');
    }

    public function renewalOrders()
    {
        return $this->hasMany(Order::class, 'parent_order_id');
    }
}
