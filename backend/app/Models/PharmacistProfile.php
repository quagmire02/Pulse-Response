<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pharmacy staff.
 *
 * Distinct from the Pharmacist model, which despite its name holds the doctor
 * profile that slots, consultations and reviews hang off. A pharmacist manages
 * the medicine catalogue and never takes consultations.
 */
class PharmacistProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_num',
        'pharmacy_name',
        'contact_phone',
        'bio',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
