<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseRequest;

class RegisterVendorRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string'],
            'email'       => ['required', 'email', 'unique:vendors,email'],
            'phone'       => ['required', 'string'],
            'address'     => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ];
    }
}
