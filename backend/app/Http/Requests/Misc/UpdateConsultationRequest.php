<?php

namespace App\Http\Requests\Misc;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateConsultationRequest extends BaseRequest
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
