<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\BaseRequest;
use App\Models\AmbulanceCompany;
use App\Models\SignupRequest;
use App\Models\Vendor;
use App\Rules\StrongPassword;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RegisterSignupRequest extends BaseRequest
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
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('is_consultation') && is_string($this->is_consultation)) {
            $this->merge([
                'is_consultation' => filter_var($this->is_consultation, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // A pending request holds the email/username reservation until it is reviewed.
        $pendingRule = fn (string $column) => Rule::unique('signup_requests', $column)->where(
            fn ($query) => $query->where('status', SignupRequest::STATUS_PENDING)
        );

        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email'),
                $pendingRule('email'),
            ],
            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username'),
                $pendingRule('username'),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed', new StrongPassword()],
            'address' => ['nullable', 'string', 'max:255'],
            'role' => ['required', 'string', Rule::in(SignupRequest::ROLES)],

            // Pharmacist / doctor fields. Drivers supply a driving licence and
            // ambulance companies an operating licence, so the field is shared.
            'license_num' => [
                Rule::requiredIf(fn () => in_array(
                    $this->input('role'),
                    ['pharmacist', 'doctor', 'vendor', 'ambulance_company', 'driver'],
                    true
                )),
                'nullable', 'string', 'max:255',
            ],
            'speciality' => [
                Rule::requiredIf(fn () => in_array($this->input('role'), SignupRequest::PHARMACIST_ROLES, true)),
                'nullable', 'string', 'max:255',
            ],
            'bio' => [
                Rule::requiredIf(fn () => in_array($this->input('role'), SignupRequest::PHARMACIST_ROLES, true)),
                'nullable', 'string',
            ],
            'is_consultation' => ['sometimes', 'boolean'],

            // Vendor and ambulance company fields.
            'company_name' => [
                Rule::requiredIf(fn () => in_array($this->input('role'), ['vendor', 'ambulance_company'], true)),
                'nullable', 'string', 'max:255',
            ],
            'description' => ['nullable', 'string'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Reject any attempt to self-assign privileged flags through the public form.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $request = $this->request;

            if ($request->has('is_admin') || $request->has('is_super_admin')) {
                $validator->errors()->add(
                    'permission_denied', 'You are not authorized to create admin.'
                );
            }

            if ($request->has('is_active') || $request->has('status')) {
                $validator->errors()->add(
                    'permission_denied', 'You are not authorized to set user status.'
                );
            }

            $role = $this->input('role');
            $licenseNum = $this->input('license_num');

            // pharmacists.license_num is an integer column.
            if (in_array($role, SignupRequest::PHARMACIST_ROLES, true) && filled($licenseNum) && !ctype_digit((string) $licenseNum)) {
                $validator->errors()->add('license_num', 'The license number must contain digits only.');
            }

            // vendors.license_num is unique, so catch clashes before an admin approves.
            if ($role === 'vendor' && filled($licenseNum) && Vendor::where('license_num', $licenseNum)->exists()) {
                $validator->errors()->add('license_num', 'This license number is already registered.');
            }

            // ambulance_companies.license_num is unique for the same reason.
            if ($role === 'ambulance_company' && filled($licenseNum)
                && AmbulanceCompany::where('license_num', $licenseNum)->exists()) {
                $validator->errors()->add('license_num', 'This license number is already registered.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'The email address is already in use or is awaiting approval.',
            'username.unique' => 'The username is already taken or is awaiting approval.',
            'password.confirmed' => 'The password confirmation does not match.',
            'role.in' => 'Please choose a valid account type.',
            'license_num.required' => 'A license number is required for this account type.',
            'speciality.required' => 'A speciality is required for this account type.',
            'bio.required' => 'A short bio is required for this account type.',
            'company_name.required' => 'A company name is required for vendor accounts.',
        ];
    }
}
