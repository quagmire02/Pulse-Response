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
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Check if the 'is_consultation' field exists and is a string
        if ($this->has('is_consultation') && is_string($this->is_consultation)) {
            // Convert the string "true" or "false" to a boolean value
            $this->merge([
                'is_consultation' => filter_var($this->is_consultation, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
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
            'is_consultation' => ['sometimes', 'boolean'],
        ];

        return array_merge($parentRules, $pharmacistRules);
    }
}
