<?php

namespace App\Http\Requests\Equipment;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateEquipmentRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['sometimes', 'required', 'string'],
            'description'    => ['sometimes', 'nullable', 'string'],
            'price'          => ['sometimes', 'required', 'numeric', 'min:0'],
            'size'           => ['sometimes', 'required', 'string'],
            'safety_rules'   => ['sometimes', 'nullable', 'string'],
            'condition_notes'=> ['sometimes', 'nullable', 'string'],
            'rental_status'  => ['sometimes', Rule::in(['available', 'rented', 'maintenance'])],
            'stock'          => ['sometimes', 'required', 'integer', 'min:0'],
            'image_url'      => [
                'nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048',
                Rule::dimensions()->maxWidth(1000)->maxHeight(1000),
            ],
        ];
    }
}
