<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseRequest;

class UpdateVendorRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'required', 'string'],
            'email'       => ['sometimes', 'required', 'email', 'unique:vendors,email,' . $this->route('id')],
            'phone'       => ['sometimes', 'required', 'string'],
            'address'     => ['sometimes', 'required', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ];
    }
}
