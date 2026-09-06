<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use App\Models\CartItem;
use Illuminate\Validation\Rule;

class UpdateCartItemRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        protected function prepareForValidation(): void
    {
        $items = $this->input('items');

        if (!is_array($items)) {
            return;
        }

        foreach ($items as $index => $item) {
            if (is_array($item) && empty($item['item_type'])) {
                $items[$index]['item_type'] = CartItem::TYPE_MEDICINE;
            }
        }

        $this->merge(['items' => $items]);
    }

        public function rules(): array
    {
        return [
            'items' => ['present', 'array'],
            'items.*.item_type' => ['required', Rule::in(CartItem::TYPES)],
            'items.*.quantity' => ['required', 'integer', 'min:1'],

            'items.*.medicine_id' => [
                'nullable',
                'exists:medicines,id',
            ],
            'items.*.equipment_id' => [
                'nullable',
                'exists:equipment,id',
            ],
            'items.*.rental_start' => ['nullable', 'date'],
            'items.*.rental_end' => ['nullable', 'date'],
        ];
    }

        public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ((array) $this->input('items', []) as $index => $item) {
                $type = $item['item_type'] ?? null;

                if ($type === CartItem::TYPE_MEDICINE) {
                    if (empty($item['medicine_id'])) {
                        $validator->errors()->add("items.$index.medicine_id", 'Each medicine line needs a medicine ID.');
                    }
                    continue;
                }

                if (empty($item['equipment_id'])) {
                    $validator->errors()->add("items.$index.equipment_id", 'Each equipment line needs an equipment ID.');
                }

                if ($type === CartItem::TYPE_EQUIPMENT_RENTAL) {
                    if (empty($item['rental_start']) || empty($item['rental_end'])) {
                        $validator->errors()->add("items.$index.rental_start", 'Rentals need a start and end date.');
                        continue;
                    }

                    if (strtotime($item['rental_end']) < strtotime($item['rental_start'])) {
                        $validator->errors()->add(
                            "items.$index.rental_end",
                            'The rental end date must not be before the start date.'
                        );
                    }
                }
            }
        });
    }

        public function messages(): array
    {
        return [
            'items.present' => 'The items list is required.',
            'items.array' => 'The items must be an array.',
            'items.*.item_type.in' => 'One or more cart lines have an unknown item type.',
            'items.*.medicine_id.exists' => 'One or more medicine IDs do not exist.',
            'items.*.equipment_id.exists' => 'One or more equipment IDs do not exist.',
            'items.*.quantity.required' => 'Each cart item must have a quantity.',
            'items.*.quantity.integer' => 'The quantity must be an integer.',
            'items.*.quantity.min' => 'The quantity must be at least 1.',
        ];
    }
}
