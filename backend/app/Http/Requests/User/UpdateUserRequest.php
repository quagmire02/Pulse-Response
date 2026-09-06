<?php

namespace App\Http\Requests\User;

use App\Http\Requests\BaseRequest;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // The route accepts an id or a slug, and the controller looks up by
        // either. Passing the raw route value into ignore() compared a slug
        // against the id column, so the row being edited was never ignored and
        // its own username came back as "already taken".
        $routeValue = $this->route('user');

        $userId = User::where('id', $routeValue)
            ->orWhere('slug', $routeValue)
            ->value('id');

        return [
            'first_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            // Email was missing entirely. The form sends it on every save, and
            // validated() drops anything without a rule, so email changes were
            // silently thrown away.
            'email' => [
                'sometimes', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'username' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed', new StrongPassword()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'That email is already registered to another account.',
            'username.unique' => 'The username is already taken by another user.',
            'password.confirmed' => 'The password confirmation does not match.',
        ];
    }
}
