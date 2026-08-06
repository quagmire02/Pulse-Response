<?php

namespace App\Http\Requests\Misc;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\ValidationException;

class RegisterConsultationRequest extends BaseRequest
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
     *
     * @return void
     */
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

        // Convert 12-hour time to 24-hour time
        if ($start_period === 'PM' && $start_time !== 12) {
            $start_time += 12;
        } elseif ($start_period === 'AM' && $start_time === 12) {
            $start_time = 0; // 12 AM (midnight)
        }

        // Merge the transformed data back into the request
        $this->merge([
            'start_time' => $start_time,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pharmacist_id' => ['required', 'exists:pharmacists,id'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time' => ['required', 'integer', 'between:9,17'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_time.between' => 'The start time must be between 9 AM and 5 PM.',
        ];
    }
}
