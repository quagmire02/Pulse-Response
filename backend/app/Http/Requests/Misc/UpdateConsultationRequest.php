<?php

namespace App\Http\Requests\Misc;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateConsultationRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(['confirmed', 'rejected', 'completed'])],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'The status must be one of confirmed, rejected, or completed.',
        ];
    }
}
