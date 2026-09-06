<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RegisterOrderRequest extends BaseRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subscribe_type' => ['required', 'string', Rule::in(['none', 'weekly', 'monthly'])],
            'delivery_type' => ['required', 'string', Rule::in(['basic', 'rapid', 'emergency'])],

            // Where the courier delivers and where the vendor meets the customer
            // for any equipment on the same order.
            'delivery_address' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            // Needed at order time because the premium discount only applies
            // to card payments, and the total is calculated here.
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'card'])],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],
            'preferred_handover_date' => ['nullable', 'date', 'after_or_equal:today'],

            'prescription_images' => ['sometimes', 'array'],
            'prescription_images.*' => [
                'image',
                'mimes:jpeg,png,jpg', // Allowed MIME types
                'max:2048', // Max File Size in KB
                Rule::dimensions()->maxWidth(1000)->maxHeight(1000), // Optional: Max dimensi
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