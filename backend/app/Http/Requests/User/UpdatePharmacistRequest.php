<?php

namespace App\Http\Requests\User;

use App\Http\Requests\User\UpdateUserRequest;

class UpdatePharmacistRequest extends UpdateUserRequest
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
            'license_num' => ['sometimes', 'integer'],
            'speciality' => ['sometimes', 'string', 'max:255'],
            'bio' => ['sometimes', 'string'],
            'is_consultation' => ['sometimes', 'boolean'],
        ];

        return array_merge($parentRules, $pharmacistRules);
    }
}
