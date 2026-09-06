<?php

namespace App\Http\Requests\User;

use Illuminate\Validation\Rule;
use App\Http\Requests\BaseRequest;
use App\Rules\StrongPassword;
use \Illuminate\Validation\Validator;

class RegisterUserRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')],
            'password' => ['required', 'string', 'min:8', 'confirmed', new StrongPassword()],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }

        public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $request = $this->request;
            if ($request->has('is_admin')) {
                $validator->errors()->add(
                    'permission_denied', 'You are not authorized to create admin.'
                );
            }

            if ($request->has('is_active') || $request->has('role')) {
                $validator->errors()->add(
                    'permission_denied', 'You are not authorized to set user status.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'The email address is already in use.',
            'username.unique' => 'The username is already taken.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
