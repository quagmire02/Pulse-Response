<?php

namespace App\Services;

use App\Models\Pharmacist;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The assistant behind the AI Assistance page.
 *
 * Every message is matched against local rules before any model is consulted.
 * The two things that actually matter clinically, spotting an emergency and
 * routing a symptom to the right specialist, are deterministic keyword lookups
 * so they cannot be affected by a model hallucinating, rate limiting, or an
 * expired API key. The language model only handles small talk that falls
 * through both, and the assistant still works with no key configured at all.
 */
class ChatbotService
{
    public const INTENT_EMERGENCY = 'emergency';
    public const INTENT_SYMPTOM = 'symptom';
    public const INTENT_CHAT = 'chat';

    /**
     * Phrases that mean "this needs an ambulance, not a doctor's appointment".
     * Checked first so nothing else can swallow them.
     *
     * @var array<int, string>
     */
    private const EMERGENCY_KEYWORDS = [
        'heart attack', 'cardiac arrest', 'stroke', 'unconscious', 'not breathing',
        "can't breathe", 'cannot breathe', 'choking', 'severe bleeding', 'bleeding heavily',
        'heavy bleeding', 'overdose', 'poisoned', 'poisoning', 'severe chest pain',
        'chest pain', 'collapsed', 'seizure', 'convulsion', 'accident', 'drowning',
        'severe burn', 'suicidal', 'emergency', 'ambulance',
    ];

    /**
     * Symptom wording mapped to the speciality that treats it. Longer phrases
     * are listed before the single words they contain so the more specific
     * match wins.
     *
     * @var array<string, string>
     */
    private const SYMPTOM_MAP = [
        // Gastro
        'gastric' => 'Gastroenterology',
        'acidity' => 'Gastroenterology',
        'acid reflux' => 'Gastroenterology',
        'heartburn' => 'Gastroenterology',
        'indigestion' => 'Gastroenterology',
        'ulcer' => 'Gastroenterology',
        'stomach pain' => 'Gastroenterology',
        'stomach ache' => 'Gastroenterology',
        'diarrhea' => 'Gastroenterology',
        'constipation' => 'Gastroenterology',
        'vomiting' => 'Gastroenterology',
        'nausea' => 'Gastroenterology',

        // Neuro
        'migraine' => 'Neurology',
        'headache' => 'Neurology',
        'dizziness' => 'Neurology',
        'vertigo' => 'Neurology',
        'numbness' => 'Neurology',
        'memory loss' => 'Neurology',

        // Cardio
        'palpitation' => 'Cardiology',
        'high blood pressure' => 'Cardiology',
        'blood pressure' => 'Cardiology',
        'cholesterol' => 'Cardiology',

        // Derm
        'rash' => 'Dermatology',
        'acne' => 'Dermatology',
        'eczema' => 'Dermatology',
        'itching' => 'Dermatology',
        'skin' => 'Dermatology',
        'hair fall' => 'Dermatology',

        // ENT
        'sore throat' => 'ENT',
        'sinus' => 'ENT',
        'ear pain' => 'ENT',
        'earache' => 'ENT',
        'hearing' => 'ENT',
        'tonsil' => 'ENT',

        // Respiratory
        'asthma' => 'Pulmonology',
        'wheezing' => 'Pulmonology',
        'shortness of breath' => 'Pulmonology',
        'bronchitis' => 'Pulmonology',

        // Ortho
        'back pain' => 'Orthopedics',
        'joint pain' => 'Orthopedics',
        'knee pain' => 'Orthopedics',
        'fracture' => 'Orthopedics',
        'arthritis' => 'Orthopedics',
        'sprain' => 'Orthopedics',

        // Eyes and teeth
        'blurry vision' => 'Ophthalmology',
        'eye pain' => 'Ophthalmology',
        'red eye' => 'Ophthalmology',
        'toothache' => 'Dentistry',
        'tooth pain' => 'Dentistry',
        'gum' => 'Dentistry',
        'cavity' => 'Dentistry',

        // Endocrine and renal
        'diabetes' => 'Endocrinology',
        'blood sugar' => 'Endocrinology',
        'thyroid' => 'Endocrinology',
        'kidney' => 'Nephrology',
        'urine' => 'Urology',
        'urination' => 'Urology',

        // Mental health
        'anxiety' => 'Psychiatry',
        'depression' => 'Psychiatry',
        'panic attack' => 'Psychiatry',
        'insomnia' => 'Psychiatry',
        'stress' => 'Psychiatry',

        // Women's and children's health
        'pregnancy' => 'Gynecology',
        'pregnant' => 'Gynecology',
        'period pain' => 'Gynecology',
        'menstrual' => 'Gynecology',
        'my child' => 'Pediatrics',
        'my baby' => 'Pediatrics',
        'infant' => 'Pediatrics',

        // General, kept last so specific phrases match first
        'fever' => 'General Medicine',
        'flu' => 'General Medicine',
        'cold' => 'General Medicine',
        'cough' => 'General Medicine',
        'body ache' => 'General Medicine',
        'weakness' => 'General Medicine',
        'fatigue' => 'General Medicine',
    ];

    /**
     * Route one message.
     *
     * @return array<string, mixed>
     */
    public function handle(string $message): array
    {
        $text = mb_strtolower(trim($message));

        if ($emergency = $this->matchEmergency($text)) {
            return $emergency;
        }

        if ($symptom = $this->matchSymptom($text)) {
            return $symptom;
        }

        return $this->askModel($message);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function matchEmergency(string $text): ?array
    {
        foreach (self::EMERGENCY_KEYWORDS as $keyword) {
            if (str_contains($text, $keyword)) {
                return [
                    'intent' => self::INTENT_EMERGENCY,
                    'source' => 'rules',
                    'matched' => $keyword,
                    'reply' => "That sounds like it could be an emergency. If someone is in danger right now, "
                        . "trigger an emergency alert so the nearest ambulance is dispatched and volunteers "
                        . "close by are notified.\n\nI will not dispatch anything on my own, you have to confirm it.",
                    'action' => [
                        'type' => 'emergency',
                        'label' => 'Open emergency alert',
                        'href' => '/history',
                    ],
                    'doctors' => [],
                ];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function matchSymptom(string $text): ?array
    {
        foreach (self::SYMPTOM_MAP as $keyword => $speciality) {
            if (!str_contains($text, $keyword)) {
                continue;
            }

            $doctors = $this->findDoctors($speciality);

            // Plain text: the chat bubble renders literally, no markdown.
            $reply = "Symptoms like that are usually handled by {$speciality}.";

            if ($doctors->isEmpty()) {
                $reply .= " No {$speciality} specialist is registered on the platform right now, "
                    . "so browse the full list of doctors and pick whoever fits best.";
            } else {
                $reply .= " Here are " . $doctors->count() . " " . ($doctors->count() === 1 ? "doctor" : "doctors")
                    . " on the platform you can book.";
            }

            $reply .= "\n\nI am not a doctor and this is not a diagnosis, only a suggestion about who to see.";

            return [
                'intent' => self::INTENT_SYMPTOM,
                'source' => 'rules',
                'matched' => $keyword,
                'speciality' => $speciality,
                'reply' => $reply,
                'action' => [
                    'type' => 'doctors',
                    'label' => 'Browse all doctors',
                    'href' => '/pharmacist',
                ],
                'doctors' => $doctors->values(),
            ];
        }

        return null;
    }

    /**
     * Doctors on the platform for a speciality, best rated first.
     */
    private function findDoctors(string $speciality)
    {
        try {
            return Pharmacist::with('user:id,username,first_name,last_name')
                ->withAvg('reviews', 'rating')
                ->whereRaw('LOWER(speciality) LIKE ?', ['%' . mb_strtolower($speciality) . '%'])
                ->orderByDesc('is_consultation')
                ->limit(3)
                ->get()
                ->map(fn ($doctor) => [
                    'id' => $doctor->id,
                    'user_id' => $doctor->user_id,
                    'name' => trim(($doctor->user->first_name ?? '') . ' ' . ($doctor->user->last_name ?? ''))
                        ?: ($doctor->user->username ?? 'Doctor'),
                    'speciality' => $doctor->speciality,
                    'rating' => $doctor->reviews_avg_rating ? round((float) $doctor->reviews_avg_rating, 1) : null,
                    'accepts_consultation' => (bool) $doctor->is_consultation,
                ]);
        } catch (\Exception $e) {
            Log::error('Doctor lookup failed: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Small talk fallback. Any OpenAI compatible endpoint works; if none is
     * configured or the call fails, a canned reply keeps the page usable.
     *
     * @return array<string, mixed>
     */
    private function askModel(string $message): array
    {
        $key = config('services.chatbot.key');

        if (blank($key)) {
            return $this->cannedReply('No CHATBOT_API_KEY set. Add it to .env and run php artisan config:clear.');
        }

        try {
            $response = Http::withToken($key)
                ->timeout(20)
                ->post(rtrim(config('services.chatbot.base_url'), '/') . '/chat/completions', [
                    'model' => config('services.chatbot.model'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a friendly assistant for Pulse Response, a pharmacy and '
                                . 'emergency healthcare platform. Keep answers to two or three short sentences. '
                                . 'Never diagnose, never name a medicine or dosage, and never give treatment '
                                . 'advice. If the user mentions symptoms, tell them to describe the symptom so '
                                . 'the assistant can suggest a specialist.',
                        ],
                        ['role' => 'user', 'content' => $message],
                    ],
                    'max_tokens' => 200,
                    'temperature' => 0.6,
                ]);

            $reply = $response->json('choices.0.message.content');

            if (!$response->successful() || blank($reply)) {
                // Surface the provider's own words. Silently falling back here
                // made a rejected model name look identical to a missing key.
                $detail = $response->json('error.message')
                    ?? ('HTTP ' . $response->status() . ' ' . mb_substr((string) $response->body(), 0, 300));

                Log::error('Chatbot model call failed: ' . $detail);

                return $this->cannedReply($detail);
            }

            return [
                'intent' => self::INTENT_CHAT,
                'source' => 'model',
                'reply' => trim($reply),
                'action' => null,
                'doctors' => [],
            ];
        } catch (\Exception $e) {
            Log::error('Chatbot model unreachable: ' . $e->getMessage());
            return $this->cannedReply($e->getMessage());
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function cannedReply(?string $reason = null): array
    {
        return [
            'intent' => self::INTENT_CHAT,
            'source' => 'fallback',
            // Why the model was not used. Shown in the chat UI so a broken key
            // or a decommissioned model name is obvious instead of looking like
            // the assistant simply has nothing to say.
            'fallback_reason' => $reason,
            'reply' => "I can help you find the right specialist. Tell me what you are feeling, "
                . "for example \"I have had a migraine for two days\" or \"gastric pain after eating\", "
                . "and I will point you to the doctors on the platform who handle it. "
                . "If it is urgent, say so and I will show you the emergency option.",
            'action' => null,
            'doctors' => [],
        ];
    }
}
