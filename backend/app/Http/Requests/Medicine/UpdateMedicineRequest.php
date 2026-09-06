<?php

namespace App\Http\Requests\Medicine;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateMedicineRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string'],
            'generic_name' => ['sometimes', 'required', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'dosage' => ['sometimes', 'required', 'string'],
            'brand' => ['sometimes', 'required', 'string'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'image_url' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg',
                'max:2048',
                Rule::dimensions()->maxWidth(1000)->maxHeight(1000),
            ],
            'category_ids' => ['sometimes', 'required', 'array'],
            'category_ids.*' => ['exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'price.min' => 'The price must be at least 1.',
            'stock.min' => 'The stock must be at least 1.',
            'image_url.image' => 'The file must be an image.',
            'image_url.max' => 'The image may not be greater than 2MB.',
            'image_url.mimes' => 'The image must be a file of type: jpeg, png, jpg.',
            'image_url.dimensions' => 'The image dimensions are too large (max 1000x1000 pixels).',
        ];
    }
}
