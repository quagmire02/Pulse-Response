<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return "Welcome";
});

/**
 * Fallback for uploaded images.
 *
 * Normally `php artisan storage:link` puts a symlink at public/storage and the
 * web server serves these files directly, never reaching PHP. Symlinks do not
 * survive being zipped and extracted though, which silently breaks every image
 * on the site. This route serves the same files when the symlink is missing, so
 * a fresh copy of the project shows images before anyone remembers to relink.
 */
Route::get('/storage/{path}', function (string $path) {
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*')->name('storage.fallback');
