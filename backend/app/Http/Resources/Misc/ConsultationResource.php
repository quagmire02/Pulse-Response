<?php

namespace App\Http\Resources\Misc;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Misc\SlotResource;

class ConsultationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'slot_id' => $this->slot_id,
            'status' => $this->status,
            'confirmed_at' => $this->confirmed_at,
            'completed_at' => $this->completed_at,
            'user' => $this->whenLoaded('userWithUsername', function () {
                return [
                    'id' => $this->userWithUsername->id,
                    'username' => $this->userWithUsername->username,
                ];
            }),
            'slot' => new SlotResource($this->whenLoaded('slot')),
        ];
    }
}
