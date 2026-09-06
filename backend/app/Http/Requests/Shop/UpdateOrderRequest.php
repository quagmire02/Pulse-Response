<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'order_status' => ['sometimes', 'string', Rule::in(['delivered', 'canceled'])],
            'subscribe_type' => [
                'sometimes',
                'string',
                Rule::in(['none', 'weekly', 'monthly']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'order_status.in' => 'Invalid order status.',
            'subscribe_type.in' => 'Invalid subscribe type.',
        ];
    }
}
