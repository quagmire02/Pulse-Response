<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends BaseRequest
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
