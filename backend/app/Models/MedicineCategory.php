<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicineCategory extends Model
{
    use HasFactory;

    public const CREATED_AT = null;
    public const UPDATED_AT = null;

    protected $table = 'medicine_categories';

    protected $fillable = [
        'medicine_id',
        'category_id',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
