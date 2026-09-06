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
        // datetime, not date: the ledger needs the actual time of day.
        'order_date' => 'datetime',
        'next_delivery_date' => 'date',
        'preferred_handover_date' => 'date',
        'unsubscribed_at' => 'datetime',
        'is_subscription_renewal' => 'boolean',
    ];

    public const PAYMENT_CASH = 'cash';
    public const PAYMENT_CARD = 'card';

    /**
     * Delivery charges, the single source of truth.
     *
     * The checkout summary and the order total used to read from two different
     * tables, so basic delivery displayed a charge that was never added and the
     * faster options were billed at half what was shown.
     */
    public const DELIVERY_CHARGES = [
        'basic' => 10.00,
        'rapid' => 20.00,
        'emergency' => 35.00,
    ];

    /**
     * Cash orders are settled by the courier, not in the app. Nothing should
     * ask the customer to confirm a payment they have not handed over yet.
     */
    public function isCashOnDelivery(): bool
    {
        return ($this->payment_method ?? self::PAYMENT_CASH) !== self::PAYMENT_CARD;
    }

    /** Discount premium members get when paying by card. */
    public const PREMIUM_CARD_DISCOUNT_RATE = 0.10;

    /** Loyalty discount applied to every automatic renewal. */
    public const RENEWAL_DISCOUNT_RATE = 0.10;

    public static function deliveryCharge(?string $type): float
    {
        return (float) (self::DELIVERY_CHARGES[$type] ?? self::DELIVERY_CHARGES['basic']);
    }

    /** How far ahead of the next delivery a subscription may be cancelled. */
    public const CANCELLATION_NOTICE_DAYS = 7;

    /**
     * Discount on the very first order of a subscription.
     *
     * Deliberately zero. Paying the reward up front let a shopper subscribe,
     * take the discount and immediately unsubscribe, so the discount now only
     * arrives once they actually stay subscribed through a renewal.
     */
    public static function getSubscriptionDiscountRate(string $subscribeType): float
    {
        return 0.0;
    }

    /**
     * Discount on an automatic renewal. This is the loyalty reward.
     */
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

    /**
     * A subscription may only be cancelled while the next delivery is still at
     * least CANCELLATION_NOTICE_DAYS away, so an imminent shipment is not
     * pulled out from under the pharmacy.
     */
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
