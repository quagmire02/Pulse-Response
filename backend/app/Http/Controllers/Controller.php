<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseLaravelController;

abstract class Controller extends BaseLaravelController
{
    use AuthorizesRequests, ValidatesRequests;
}
