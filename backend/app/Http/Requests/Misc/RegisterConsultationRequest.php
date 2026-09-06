<?php

namespace App\Http\Requests\Misc;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\ValidationException;

class RegisterConsultationRequest extends BaseRequest
{
        public function authorize(): bool
    {
        return true;
    }

        protected function prepareForValidation()
    {
        $start_time = $this->input('start_time');
        $start_period = $this->input('start_period');

        if (!is_int($start_time) || !is_string($start_period)) {
            throw ValidationException::withMessages([
                'start_time' => 'The start time must be an integer.',
                'start_period' => 'The start period must be a string (AM or PM).'
            ]);
        }

        $start_period = strtoupper($start_period);

        if (!in_array($start_period, ['AM', 'PM'])) {
            throw ValidationException::withMessages([
                'start_period' => 'The start period must be AM or PM.'
            ]);
        }

        if ($start_period === 'PM' && $start_time !== 12) {
            $start_time += 12;
        } elseif ($start_period === 'AM' && $start_time === 12) {
            $start_time = 0;
        }

        $this->merge([
            'start_time' => $start_time,
        ]);
    }

        public function rules(): array
    {
        return [
            'pharmacist_id' => ['required', 'exists:pharmacists,id'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'integer', 'between:9,23'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_time.between' => 'The start time must be between 9 AM and 12 AM.',
        ];
    }
}
