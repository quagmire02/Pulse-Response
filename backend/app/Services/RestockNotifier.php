<?php

namespace App\Services;

use App\Models\Equipment;
use App\Models\Medicine;
use App\Models\Notification;
use App\Models\PharmacistProfile;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\Log;

class RestockNotifier
{
        public const COOLDOWN_HOURS = 24;

        public function medicineOutOfStock(Medicine $medicine, User $requester): array
    {
        $subject = 'Restock request';
        $label = trim($medicine->name . ' ' . ($medicine->dosage ?? ''));
        $message = "{$requester->username} looked for {$label} while it was out of stock"
            . ($medicine->generic_name ? " ({$medicine->generic_name})" : '')
            . '. No in stock alternative could be recommended.';

        return $this->deliver($this->pharmacistUserIds(), $subject, $message, $requester, $medicine->id, 'medicine');
    }

        public function equipmentUnavailable(Equipment $equipment, User $requester): array
    {
        $subject = 'Restock request';
        $message = "{$requester->username} looked for {$equipment->name} while it was unavailable. "
            . 'Consider restocking or marking it available again.';

        $owner = $equipment->vendor;
        $recipients = $owner && $owner->user_id
            ? [$owner->user_id]
            : Vendor::pluck('user_id')->all();

        return $this->deliver($recipients, $subject, $message, $requester, $equipment->id, 'equipment');
    }

        private function pharmacistUserIds(): array
    {
        $ids = PharmacistProfile::pluck('user_id')->all();

        if (empty($ids)) {
            $ids = User::where('is_admin', true)->orWhere('is_super_admin', true)->pluck('id')->all();
        }

        return $ids;
    }

        private function deliver(array $userIds, string $subject, string $message, User $requester, int $itemId, string $itemType): array
    {
        try {
            $userIds = array_values(array_unique(array_filter($userIds)));

            if (empty($userIds)) {
                return ['notified' => 0, 'throttled' => false];
            }

            $alreadySent = Notification::whereIn('user_id', $userIds)
                ->where('subject', $subject)
                ->where('message', $message)
                ->where('created_at', '>=', now()->subHours(self::COOLDOWN_HOURS))
                ->exists();

            if ($alreadySent) {
                return ['notified' => 0, 'throttled' => true];
            }

            $rows = [];

            foreach ($userIds as $userId) {
                $rows[] = [
                    'user_id' => $userId,
                    'subject' => $subject,
                    'message' => $message,
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            Notification::insert($rows);

            return ['notified' => count($rows), 'throttled' => false];
        } catch (\Exception $e) {
            Log::error("Restock notification failed for {$itemType} {$itemId}: " . $e->getMessage());
            return ['notified' => 0, 'throttled' => false];
        }
    }
}
