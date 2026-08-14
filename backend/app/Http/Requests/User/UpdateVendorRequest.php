<?php

namespace App\Http\Requests\User;

use App\Http\Requests\User\UpdateUserRequest;
use Illuminate\Validation\Rule;

class UpdateVendorRequest extends UpdateUserRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $parentRules = parent::rules();

        $vendorRules = [
            'company_name'  => ['sometimes', 'string', 'max:255'],
            'license_num'   => ['sometimes', 'string', 'max:255', Rule::unique('vendors', 'license_num')->ignore($this->route('vendor'))],
            'description'   => ['sometimes', 'nullable', 'string'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];

        return array_merge($parentRules, $vendorRules);
    }
}
