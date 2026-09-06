<?php

namespace App\Http\Requests\User;

use App\Http\Requests\User\UpdateUserRequest;

class UpdatePharmacistRequest extends UpdateUserRequest
{
        public function authorize(): bool
    {
        return true;
    }

        protected function prepareForValidation(): void
    {
        if ($this->has('is_consultation') && is_string($this->is_consultation)) {
            $this->merge([
                'is_consultation' => filter_var($this->is_consultation, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

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
