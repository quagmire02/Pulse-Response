<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'total_amount',
        'discount_amount',
        'order_date',
        'order_status',
        'payment_status',
        'payment_method',
        'subscribe_type',
        'next_delivery_date',
        'is_subscription_renewal',
        'parent_order_id',
        'delivery_address',
        'contact_phone',
        'delivery_notes',
        'preferred_handover_date',
        'unsubscribed_at',
        'delivery_charge',
        'premium_discount',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'next_delivery_date' => 'date',
        'preferred_handover_date' => 'date',
        'unsubscribed_at' => 'datetime',
        'is_subscription_renewal' => 'boolean',
    ];

    public const PAYMENT_CASH = 'cash';
    public const PAYMENT_CARD = 'card';

        public const DELIVERY_CHARGES = [
        'basic' => 10.00,
        'rapid' => 20.00,
        'emergency' => 35.00,
    ];

        public function isCashOnDelivery(): bool
    {
        return ($this->payment_method ?? self::PAYMENT_CASH) !== self::PAYMENT_CARD;
    }

        public const PREMIUM_CARD_DISCOUNT_RATE = 0.10;

        public const RENEWAL_DISCOUNT_RATE = 0.10;

    public static function deliveryCharge(?string $type): float
    {
        return (float) (self::DELIVERY_CHARGES[$type] ?? self::DELIVERY_CHARGES['basic']);
    }

        public const CANCELLATION_NOTICE_DAYS = 7;

        public static function getSubscriptionDiscountRate(string $subscribeType): float
    {
        return 0.0;
    }

        public static function getRenewalDiscountRate(string $subscribeType): float
    {
        return in_array($subscribeType, ['weekly', 'monthly'], true)
            ? self::RENEWAL_DISCOUNT_RATE
            : 0.0;
    }

    public function isSubscription(): bool
    {
        return in_array($this->subscribe_type, ['weekly', 'monthly'], true);
    }

        public function canCancelSubscription(): bool
    {
        if (!$this->isSubscription() || !$this->next_delivery_date) {
            return false;
        }

        return now()->startOfDay()->diffInDays($this->next_delivery_date, false)
            >= self::CANCELLATION_NOTICE_DAYS;
    }

    public function daysUntilNextDelivery(): ?int
    {
        if (!$this->next_delivery_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->next_delivery_date, false);
    }

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

    public function equipmentFulfillments()
    {
        return $this->hasMany(EquipmentFulfillment::class);
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
