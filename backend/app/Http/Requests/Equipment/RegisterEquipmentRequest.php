<?php

namespace App\Http\Requests\Equipment;

use App\Http\Requests\BaseRequest;

class RegisterEquipmentRequest extends BaseRequest
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
            'name'          => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'category'      => ['required', 'string', 'max:255'],
            'price_per_day' => ['required', 'numeric', 'min:0'],
            'size'          => ['nullable', 'string', 'max:100'],
            'quantity'      => ['required', 'integer', 'min:0'],
            'safety_rules'  => ['nullable', 'string'],
            'condition'     => ['required', 'in:new,good,fair'],
            'is_available'  => ['sometimes', 'boolean'],
            'image'         => ['nullable', 'image', 'max:2048'],
        ];
    }
}
