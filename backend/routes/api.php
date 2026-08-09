<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\PharmacistController;
use App\Http\Controllers\Medicine\CategoryController;
use App\Http\Controllers\Medicine\MedicineController;
use App\Http\Controllers\Shop\CartItemController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\PaymentController;
use App\Http\Controllers\Shop\DeliveryController;
use App\Http\Controllers\Misc\NotificationController;
use App\Http\Controllers\Misc\ConsultationController;


Route::post('/login', [AuthController::class, 'login'])
    ->name('api.login');

Route::post('/users', [UserController::class, 'createUser'])
->name('api.createUser');

Route::get('/medicines', [MedicineController::class, 'index'])
        ->name('api.getMedicines');

Route::get('/medicines/{id}', [MedicineController::class, 'show'])
    ->name('api.getMedicine');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('api.logout');

    Route::get('/users', [UserController::class, 'index'])
        ->name('api.getUsers');

    Route::get('/users/{user}', [UserController::class, 'show'])
        ->name('api.getUser');

    Route::patch('/users/{user}', [UserController::class, 'update'])
        ->name('api.updateUser');

    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->name('api.deleteUser');

    Route::get('/pharmacists', [PharmacistController::class, 'index'])
        ->name('api.getPharmacists');

    Route::get('/pharmacists/{user}', [PharmacistController::class, 'show'])
        ->name('api.getPharmacist');

    Route::post('/pharmacists', [PharmacistController::class, 'create'])
        ->name('api.createPharmacist');

    Route::patch('/pharmacists/{user}', [PharmacistController::class, 'update'])
        ->name('api.updatePharmacist');

    Route::get('/categories', [CategoryController::class, 'index'])
        ->name('api.getCategories');

    Route::get('/categories/{category}', [CategoryController::class, 'show'])
        ->name('api.getCategory');

    Route::post('/categories', [CategoryController::class, 'create'])
        ->name('api.createCategory');

    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
        ->name('api.deleteCategory');

    Route::post('/medicines', [MedicineController::class, 'create'])
        ->name('api.createMedicine');

    Route::patch('/medicines/{id}', [MedicineController::class, 'update'])
        ->name('api.updateMedicine');

    Route::delete('/medicines/{id}', [MedicineController::class, 'destroy'])
        ->name('api.deleteMedicine');
        
    Route::get('/cart-items/{user_id}', [CartItemController::class, 'show'])
        ->name('api.getCartItems');

    Route::put('/cart-items/{cart_id}', [CartItemController::class, 'update'])
        ->name('api.updateCart');

    Route::delete('/cart-items/{cart_id}', [CartItemController::class, 'destroy'])
        ->name('api.deleteFromCart');

    Route::get('/orders', [OrderController::class, 'index'])
        ->name('api.getOrders');

    Route::get('/orders/new', [OrderController::class, 'indexNewOrders'])
        ->name('api.getNewOrders');

    Route::get('/orders/{order}', [OrderController::class, 'show'])
        ->name('api.getOrder');

    Route::post('/orders', [OrderController::class, 'create'])
        ->name('api.createOrder');

    Route::patch('/orders/{order}', [OrderController::class, 'update'])
        ->name('api.updateOrder');

    Route::delete('/orders/{order}', [OrderController::class, 'destroy'])
        ->name('api.deleteOrder');

    Route::get('/payments', [PaymentController::class, 'index'])
        ->name('api.getPayments');

    Route::get('/payments/{payment}', [PaymentController::class, 'show'])
        ->name('api.getPayment');

    Route::post('/payments', [PaymentController::class, 'create'])
        ->name('api.createPayment');

    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])
        ->name('api.deletePayment');

    Route::get('/deliveries', [DeliveryController::class, 'index'])
        ->name('api.getDeliveries');
        
    Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show'])
        ->name('api.getDelivery');

    Route::delete('/deliveries/{delivery}', [DeliveryController::class, 'destroy'])
        ->name('api.deleteDelivery');

    Route::get('/notifications/available', [NotificationController::class, 'isNotiAvailable'])
        ->name('api.isNotiAvailable');

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('api.getNotifications');

    Route::get('/notifications/{notification}', [NotificationController::class, 'show'])
        ->name('api.getNotification');

    Route::put('notifications/{notification}', [NotificationController::class, 'markAsRead'])
        ->name('api.markAsRead');

    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('api.deleteNotification');

    Route::get('/consultations', [ConsultationController::class, 'index'])
        ->name('api.getConsultations');

    Route::get('/slots/{pharmacist}', [ConsultationController::class, 'allSlots'])
        ->name('api.getNewConsultations');

    Route::get('/consultations/{consultation}', [ConsultationController::class, 'show'])
        ->name('api.getConsultation');
        
    Route::post('/consultations', [ConsultationController::class, 'create'])
        ->name('api.createConsultation');

    Route::patch('/consultations/{consultation}', [ConsultationController::class, 'update'])
        ->name('api.updateConsultation');

    Route::delete('/consultations/{consultation}', [ConsultationController::class, 'destroy'])
        ->name('api.deleteConsultation');
    });
