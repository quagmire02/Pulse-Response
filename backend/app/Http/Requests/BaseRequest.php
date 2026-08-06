<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BaseRequest extends FormRequest
{
    private const FORBIDDEN_KEY = 'permission_denied';

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator)
    {
        if ($validator->errors()->has(self::FORBIDDEN_KEY)) {
            // Forbidden exception
            throw new HttpResponseException(response()->json([
                'errors' => $validator->errors()->first(self::FORBIDDEN_KEY)
            ], 403));
        }

        // Validation exception
        throw new HttpResponseException(response()->json([
            'errors' => $validator->errors()
        ], 422));
    }
}
