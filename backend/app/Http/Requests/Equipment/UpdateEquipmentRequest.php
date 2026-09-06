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
        foreach (['is_available', 'is_for_rent', 'is_for_sale'] as $flag) {
            if ($this->has($flag) && is_string($this->input($flag))) {
                $this->merge([
                    $flag => filter_var($this->input($flag), FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'description'   => ['sometimes', 'nullable', 'string'],
            'category'      => ['sometimes', 'string', 'max:255'],
            'price_per_day' => ['sometimes', 'numeric', 'min:0'],
            'sale_price'    => ['sometimes', 'nullable', 'numeric', 'min:0', 'required_if:is_for_sale,true,1'],
            'size'          => ['sometimes', 'nullable', 'string', 'max:100'],
            'quantity'      => ['sometimes', 'integer', 'min:0'],
            'safety_rules'  => ['sometimes', 'nullable', 'string'],
            'condition'     => ['sometimes', 'in:new,good,fair'],
            'is_available'  => ['sometimes', 'boolean'],
            'is_for_rent'   => ['sometimes', 'boolean'],
            'is_for_sale'   => ['sometimes', 'boolean'],
            'image'         => ['sometimes', 'nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'sale_price.required_if' => 'Set a sale price when the item is listed for sale.',
        ];
    }
}
