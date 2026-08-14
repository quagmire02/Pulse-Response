<?php

namespace App\Http\Requests\Equipment;

use App\Http\Requests\BaseRequest;

class UpdateEquipmentRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_available') && is_string($this->is_available)) {
            $this->merge([
                'is_available' => filter_var($this->is_available, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'category'      => ['sometimes', 'string', 'max:255'],
            'price_per_day' => ['sometimes', 'numeric', 'min:0'],
            'size'          => ['sometimes', 'nullable', 'string', 'max:100'],
            'quantity'      => ['sometimes', 'integer', 'min:0'],
            'safety_rules'  => ['sometimes', 'nullable', 'string'],
            'condition'     => ['sometimes', 'in:new,good,fair'],
            'is_available'  => ['sometimes', 'boolean'],
            'image'         => ['sometimes', 'nullable', 'image', 'max:2048'],
        ];
    }
}
