<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Equipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'name',
        'description',
        'category',
        'price_per_day',
        'size',
        'quantity',
        'safety_rules',
        'condition',
        'is_available',
        'image',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'price_per_day' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('name', 'ilike', "%{$search}%")
            ->orWhere('category', 'ilike', "%{$search}%")
            ->orWhere('description', 'ilike', "%{$search}%");
    }

    public function scopeFilterByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', 'ilike', "%{$category}%");
    }

    public function scopeFilterByCondition(Builder $query, string $condition): Builder
    {
        return $query->where('condition', $condition);
    }

    public function scopeAvailableOnly(Builder $query): Builder
    {
        return $query->where('is_available', true)->where('quantity', '>', 0);
    }
}
