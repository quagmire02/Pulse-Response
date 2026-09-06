<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseRequest;

class AuthRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:users,email'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.exists' => 'Credentials are incorrect.',
        ];
    }
}
