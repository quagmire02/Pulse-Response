<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RegisterOrderRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'subscribe_type' => ['required', 'string', Rule::in(['none', 'weekly', 'monthly'])],
            'delivery_type' => ['required', 'string', Rule::in(['basic', 'rapid', 'emergency'])],

            'delivery_address' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'card'])],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],
            'preferred_handover_date' => ['nullable', 'date', 'after_or_equal:today'],

            'prescription_images' => ['sometimes', 'array'],
            'prescription_images.*' => [
                'image',
                'mimes:jpeg,png,jpg',
                'max:2048',
                Rule::dimensions()->maxWidth(1000)->maxHeight(1000),
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'subscribe_type.in' => 'Invalid subscribe type.',
            'delivery_type.in' => 'Invalid delivery type.',
            'delivery_address.required' => 'A delivery or handover address is required.',
            'contact_phone.required' => 'A contact phone number is required so the vendor can reach you.',
            'preferred_handover_date.after_or_equal' => 'The preferred handover date cannot be in the past.',
            'prescription_images.*.image' => 'The file must be an image.',
            'prescription_images.*.max' => 'The image may not be greater than 2MB.',
            'prescription_images.*.mimes' => 'The image must be a file of type: jpeg, png, jpg.',
            'prescription_images.*.dimensions' => 'The image dimensions are too large (max 1000x1000 pixels).',
        ];
    }
}