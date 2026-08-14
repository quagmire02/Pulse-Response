<?php

namespace App\Http\Requests\User;

use App\Http\Requests\User\RegisterUserRequest;

class RegisterVendorRequest extends RegisterUserRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $parentRules = parent::rules();

        $vendorRules = [
            'company_name' => ['required', 'string', 'max:255'],
            'license_num'  => ['required', 'string', 'max:255', 'unique:vendors,license_num'],
            'description'  => ['nullable', 'string'],
            'contact_phone'=> ['nullable', 'string', 'max:50'],
        ];

        return array_merge($parentRules, $vendorRules);
    }
}
