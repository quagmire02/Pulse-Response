<?php

namespace App\Http\Requests\Equipment;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RegisterEquipmentRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string'],
            'description'    => ['nullable', 'string'],
            'price'          => ['required', 'numeric', 'min:1'],
            'size'           => ['required', 'string'],
            'safety_rules'   => ['nullable', 'string'],
            'condition_notes'=> ['nullable', 'string'],
            'rental_status'  => ['sometimes', Rule::in(['available', 'rented', 'maintenance'])],
            'stock'          => ['required', 'integer', 'min:0'],
            'image_url'      => [
                'nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048',
                Rule::dimensions()->maxWidth(1000)->maxHeight(1000),
            ],
        ];
    }
}
