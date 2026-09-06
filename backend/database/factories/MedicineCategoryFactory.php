<?php

namespace Database\Factories;

use App\Models\MedicineCategory;
use App\Models\Medicine;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineCategoryFactory extends Factory
{
        protected $model = MedicineCategory::class;

        public function definition(): array
    {
        return [
            'medicine_id' => Medicine::factory(),
            'category_id' => Category::factory(),
        ];
    }
}