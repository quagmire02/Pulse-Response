<?php

namespace App\Http\Requests\Medicine;

use App\Http\Requests\BaseRequest;

class RegisterCategoryRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'unique:categories,name'],
        ];
    }
}
