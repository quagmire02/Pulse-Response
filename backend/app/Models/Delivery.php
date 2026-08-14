<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;

    protected $fillable = [
        'order_id',
        'track_num',
        'est_del_date',
        'act_del_date',
        'delivery_status',
        'delivery_type',
    ];

    protected $casts = [
        'track_num' => 'integer',
        'est_del_date' => 'date',
        'act_del_date' => 'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
