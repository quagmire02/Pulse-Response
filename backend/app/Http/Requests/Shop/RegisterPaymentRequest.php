<?php

namespace App\Http\Requests\Shop;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RegisterPaymentRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'order_id' => ['required', 'exists:orders,id'],
            'payment_type' => ['required', 'string', Rule::in(['cash', 'card'])],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_type.in' => 'Payment type must be either "cash" or "card".',
        ];
    }
}
