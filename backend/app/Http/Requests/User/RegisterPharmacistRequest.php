<?php

namespace App\Http\Requests\User;

use App\Http\Requests\User\RegisterUserRequest;

class RegisterPharmacistRequest extends RegisterUserRequest
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
        $parentRules = parent::rules();

        $pharmacistRules = [
            'license_num' => ['required', 'integer'],
            'speciality' => ['required', 'string', 'max:255'],
            'bio' => ['required', 'string'],
            'is_consultation' => ['required', 'boolean'],
        ];

        return array_merge($parentRules, $pharmacistRules);
    }
}
