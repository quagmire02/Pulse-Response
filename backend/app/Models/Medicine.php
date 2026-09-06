<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medicine extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacist_id',
        'name',
        'generic_name',
        'description',
        'price',
        'dosage',
        'brand',
        'image_url',
        'stock',
    ];

    protected $casts = [
        'stock' => 'integer',
    ];

    /**
     * The pharmacist who listed this medicine. Null for platform listings
     * created by an admin, and for anything predating the ownership column.
     */
    public function pharmacist(): BelongsTo
    {
        return $this->belongsTo(PharmacistProfile::class, 'pharmacist_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'medicine_categories');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
