<?php

namespace App\Http\Resources\Misc;

use Illuminate\Http\Resources\Json\JsonResource;

class SlotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        $startHour12 = ($this->start_time > 12) ? $this->start_time - 12 : $this->start_time;
        $startPeriod = ($this->start_time >= 12) ? 'PM' : 'AM';

        $endHour12 = ($this->end_time > 12) ? $this->end_time - 12 : $this->end_time;
        $endPeriod = ($this->end_time >= 12) ? 'PM' : 'AM';

        return [
            'id' => $this->id,
            'pharmacist_id' => $this->pharmacist_id,
            'date' => $this->date,
            'start_time' => $startHour12,
            'start_period' => $startPeriod,
            'end_time' => $endHour12,
            'end_period' => $endPeriod,
            'is_available' => $this->is_available,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

