<?php

namespace App\Services;

use App\Models\Equipment;
use App\Models\Medicine;
use App\Models\Notification;
use App\Models\PharmacistProfile;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\Log;

/**
 * The last step of the out of stock fallback.
 *
 * When a shopper searches for something that is sold out and nothing shares its
 * chemical name or category, there is no alternative left to recommend. Rather
 * than ending on a dead end, the demand is pushed back to whoever can act on
 * it: pharmacists for medicines, the owning vendor for equipment.
 */
class RestockNotifier
{
    /**
     * One request per shopper, per item, per this many hours. Without this a
     * refresh loop would bury the pharmacist in identical notifications.
     */
    public const COOLDOWN_HOURS = 24;

    /**
     * Tell the pharmacy team a medicine is being asked for while out of stock.
     *
     * @return array{notified: int, throttled: bool}
     */
    public function medicineOutOfStock(Medicine $medicine, User $requester): array
    {
        $subject = 'Restock request';
        $label = trim($medicine->name . ' ' . ($medicine->dosage ?? ''));
        $message = "{$requester->username} looked for {$label} while it was out of stock"
            . ($medicine->generic_name ? " ({$medicine->generic_name})" : '')
            . '. No in stock alternative could be recommended.';

        return $this->deliver($this->pharmacistUserIds(), $subject, $message, $requester, $medicine->id, 'medicine');
    }

    /**
     * Tell the vendor who owns a listing that it is being asked for while
     * unavailable. Falls back to every vendor when the listing has no owner.
     *
     * @return array{notified: int, throttled: bool}
     */
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

    /**
     * @return array<int, int>
     */
    private function pharmacistUserIds(): array
    {
        $ids = PharmacistProfile::pluck('user_id')->all();

        // Before any pharmacist has been approved there is nobody to tell, so
        // the request goes to the admins instead of being dropped.
        if (empty($ids)) {
            $ids = User::where('is_admin', true)->orWhere('is_super_admin', true)->pluck('id')->all();
        }

        return $ids;
    }

    /**
     * @param  array<int, int>  $userIds
     * @return array{notified: int, throttled: bool}
     */
    private function deliver(array $userIds, string $subject, string $message, User $requester, int $itemId, string $itemType): array
    {
        try {
            $userIds = array_values(array_unique(array_filter($userIds)));

            if (empty($userIds)) {
                return ['notified' => 0, 'throttled' => false];
            }

            // The message text carries the requester and the item, so an exact
            // match inside the cooldown window is the same request repeated.
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
            // A restock hint is never worth failing the shopper's request over.
            Log::error("Restock notification failed for {$itemType} {$itemId}: " . $e->getMessage());
            return ['notified' => 0, 'throttled' => false];
        }
    }
}
