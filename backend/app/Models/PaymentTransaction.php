<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * One row per charge attempt against a payment provider. This is the accounting
 * ledger: it is append only in practice, and failures are recorded alongside
 * successes so a gap in revenue can always be explained.
 */
class PaymentTransaction extends Model
{
    use HasFactory;

    public const TYPE_MEMBERSHIP_INITIAL = 'membership_initial';
    public const TYPE_MEMBERSHIP_RENEWAL = 'membership_renewal';
    public const TYPE_ORDER_PAYMENT = 'order_payment';

    public const STATUS_SUCCEEDED = 'succeeded';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REQUIRES_ACTION = 'requires_action';

    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'provider',
        'provider_reference',
        'amount',
        'currency',
        'status',
        'description',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeSucceeded(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SUCCEEDED);
    }

    public function scopeFilterByType(Builder $query, ?string $type): Builder
    {
        if (!$type) return $query;
        return $query->where('type', $type);
    }
}
