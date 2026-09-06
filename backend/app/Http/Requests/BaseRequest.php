<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BaseRequest extends FormRequest
{
    private const FORBIDDEN_KEY = 'permission_denied';

        protected function failedValidation(Validator $validator)
    {
        if ($validator->errors()->has(self::FORBIDDEN_KEY)) {
            throw new HttpResponseException(response()->json([
                'errors' => $validator->errors()->first(self::FORBIDDEN_KEY)
            ], 403));
        }

        throw new HttpResponseException(response()->json([
            'errors' => $validator->errors()
        ], 422));
    }
}
