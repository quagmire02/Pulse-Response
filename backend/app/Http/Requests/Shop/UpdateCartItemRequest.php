<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use App\Models\CartItem;
use Illuminate\Validation\Rule;

class UpdateCartItemRequest extends BaseRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Older clients sent bare medicine lines with no item_type, so default it
     * here rather than breaking them.
     */
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

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
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

    /**
     * Enforce the per-type shape: medicines need a medicine, equipment needs a
     * piece of equipment, and rentals need a date range.
     */
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

                    // Checked here rather than with after_or_equal, which does not
                    // resolve reliably against a wildcard sibling.
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

    /**
     * Get the error messages for the defined validation rules.
     */
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
