<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\SignupRequestController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\PharmacistController;
use App\Http\Controllers\User\DoctorReviewController;
use App\Http\Controllers\Medicine\CategoryController;
use App\Http\Controllers\Medicine\MedicineController;
use App\Http\Controllers\Shop\CartItemController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\PaymentController;
use App\Http\Controllers\Shop\MembershipController;
use App\Http\Controllers\Shop\DeliveryController;
use App\Http\Controllers\Misc\NotificationController;
use App\Http\Controllers\Misc\ConsultationController;
use App\Http\Controllers\User\VendorController;
use App\Http\Controllers\Equipment\EquipmentController;
use App\Http\Controllers\Equipment\EquipmentRentalController;
use App\Http\Controllers\Equipment\EquipmentFulfillmentController;
use App\Http\Controllers\Misc\EmergencyAlertController;
use App\Http\Controllers\Misc\ActivityLedgerController;
use App\Http\Controllers\Misc\ChatbotController;
use App\Http\Controllers\Misc\GeocodeController;
use App\Http\Controllers\User\AmbulanceCompanyController;
use App\Http\Controllers\User\AmbulanceVehicleController;
use App\Http\Controllers\User\VolunteerController;
use App\Http\Controllers\Partner\PartnerDashboardController;

Route::post('/login', [AuthController::class, 'login'])
    ->name('api.login');

Route::post('/signup-requests', [SignupRequestController::class, 'store'])
    ->name('api.createSignupRequest');

Route::get('/medicines', [MedicineController::class, 'index'])
        ->name('api.getMedicines');

Route::get('/medicines/suggestions', [MedicineController::class, 'suggestions'])
    ->name('api.getMedicineSuggestions');

Route::get('/medicines/alternatives', [MedicineController::class, 'alternatives'])
    ->name('api.getMedicineAlternatives');

Route::get('/medicines/{id}', [MedicineController::class, 'show'])
    ->name('api.getMedicine');

Route::get('/equipment', [EquipmentController::class, 'index'])
    ->name('api.getEquipment');

Route::get('/equipment/suggestions', [EquipmentController::class, 'suggestions'])
    ->name('api.getEquipmentSuggestions');

Route::get('/equipment/{id}', [EquipmentController::class, 'show'])
    ->name('api.getEquipmentItem');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('api.logout');

    Route::get('/signup-requests', [SignupRequestController::class, 'index'])
        ->name('api.getSignupRequests');

    Route::get('/signup-requests/pending-count', [SignupRequestController::class, 'pendingCount'])
        ->name('api.getPendingSignupRequestCount');

    Route::post('/signup-requests/{signupRequest}/approve', [SignupRequestController::class, 'approve'])
        ->name('api.approveSignupRequest');

    Route::post('/signup-requests/{signupRequest}/reject', [SignupRequestController::class, 'reject'])
        ->name('api.rejectSignupRequest');

    Route::delete('/signup-requests/{signupRequest}', [SignupRequestController::class, 'destroy'])
        ->name('api.deleteSignupRequest');

    Route::post('/users', [UserController::class, 'createUser'])
        ->name('api.createUser');

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

    Route::get('/subscriptions', [OrderController::class, 'getSubscriptions'])
        ->name('api.getSubscriptions');

    Route::post('/subscriptions/{order}/cancel', [OrderController::class, 'cancelSubscription'])
        ->name('api.cancelSubscription');

    Route::patch('/subscriptions/{order}/items', [OrderController::class, 'updateSubscriptionItems'])
        ->name('api.updateSubscriptionItems');

    Route::get('/orders/{order}', [OrderController::class, 'show'])
        ->name('api.getOrder');

    Route::post('/orders', [OrderController::class, 'create'])
        ->name('api.createOrder');

    Route::patch('/orders/{order}', [OrderController::class, 'update'])
        ->name('api.updateOrder');

    Route::delete('/orders/{order}', [OrderController::class, 'destroy'])
        ->name('api.deleteOrder');

    Route::get('/membership', [MembershipController::class, 'status'])
        ->name('api.getMembership');
    Route::post('/membership/subscribe', [MembershipController::class, 'subscribe'])
        ->name('api.subscribeMembership');
    Route::post('/membership/renew', [MembershipController::class, 'renew'])
        ->name('api.renewMembership');
    Route::post('/membership/cancel', [MembershipController::class, 'cancel'])
        ->name('api.cancelMembership');
    Route::get('/ledger/transactions', [MembershipController::class, 'ledger'])
        ->name('api.getPaymentLedger');

    Route::get('/payments', [PaymentController::class, 'index'])
        ->name('api.getPayments');

    Route::get('/payments/{payment}', [PaymentController::class, 'show'])
        ->name('api.getPayment');

    Route::post('/payments', [PaymentController::class, 'create'])
        ->name('api.createPayment');

    Route::post('/orders/{order}/pay-card', [PaymentController::class, 'payWithCard'])
        ->name('api.payOrderWithCard');

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

    Route::post('/slots', [ConsultationController::class, 'createSlot'])
        ->name('api.createSlot');

    Route::delete('/slots/{slot}', [ConsultationController::class, 'deleteSlot'])
        ->name('api.deleteSlot');

    Route::get('/pharmacists/{pharmacist}/reviews', [DoctorReviewController::class, 'index'])
        ->name('api.getReviews');

    Route::get('/pharmacists/{pharmacist}/reviews/eligibility', [DoctorReviewController::class, 'eligibility'])
        ->name('api.getReviewEligibility');

    Route::post('/pharmacists/{pharmacist}/reviews', [DoctorReviewController::class, 'create'])
        ->name('api.createReview');

    Route::delete('/pharmacists/{pharmacist}/reviews', [DoctorReviewController::class, 'destroy'])
        ->name('api.deleteReview');

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

    Route::get('/vendors', [VendorController::class, 'index'])
        ->name('api.getVendors');

    Route::get('/vendors/{user}', [VendorController::class, 'show'])
        ->name('api.getVendor');

    Route::post('/vendors', [VendorController::class, 'create'])
        ->name('api.createVendor');

    Route::patch('/vendors/{user}', [VendorController::class, 'update'])
        ->name('api.updateVendor');

    Route::get('/vendors/{user}/equipment', [EquipmentController::class, 'byVendor'])
        ->name('api.getVendorEquipment');

    Route::post('/equipment', [EquipmentController::class, 'create'])
        ->name('api.createEquipment');

    Route::post('/equipment/{id}', [EquipmentController::class, 'update'])
        ->name('api.updateEquipment');

    Route::delete('/equipment/{id}', [EquipmentController::class, 'destroy'])
        ->name('api.deleteEquipment');

    Route::post('/equipment-rentals', [EquipmentRentalController::class, 'store'])
        ->name('api.rentEquipment');

    Route::post('/emergency-alerts', [EmergencyAlertController::class, 'store'])
        ->name('api.triggerEmergencyAlert');

    Route::get('/emergency-alerts/tracking', [EmergencyAlertController::class, 'tracking'])
        ->name('api.getEmergencyTracking');
    Route::get('/emergency-alerts/{alert}/tracking', [EmergencyAlertController::class, 'tracking'])
        ->name('api.getEmergencyAlertTracking');

    Route::post('/medicines/{id}/restock-request', [MedicineController::class, 'requestRestock'])
        ->name('api.requestMedicineRestock');
    Route::post('/equipment/{id}/restock-request', [EquipmentController::class, 'requestRestock'])
        ->name('api.requestEquipmentRestock');

    Route::get('/ledger/timeline', [ActivityLedgerController::class, 'timeline'])
        ->name('api.getLedgerTimeline');
    Route::get('/ledger/summary', [ActivityLedgerController::class, 'summary'])
        ->name('api.getLedgerSummary');
    Route::get('/ledger/entry/{type}/{id}', [ActivityLedgerController::class, 'entry'])
        ->name('api.getLedgerEntry');
    Route::get('/ledger/patient/{userId}', [ActivityLedgerController::class, 'patientTimeline'])
        ->name('api.getPatientTimeline');
    Route::get('/ledger/patient/{userId}/summary', [ActivityLedgerController::class, 'patientSummary'])
        ->name('api.getPatientSummary');

    Route::get('/geocode/reverse', [GeocodeController::class, 'reverse'])
        ->name('api.reverseGeocode');

    Route::post('/chatbot/message', [ChatbotController::class, 'message'])
        ->name('api.chatbotMessage');

    Route::get('/volunteer/me', [VolunteerController::class, 'me'])
        ->name('api.getMyVolunteerProfile');
    Route::get('/volunteer/appearance', [VolunteerController::class, 'appearance'])
        ->name('api.getVolunteerAppearance');
    Route::get('/volunteer/stats', [VolunteerController::class, 'stats'])
        ->name('api.getVolunteerStats');
    Route::patch('/volunteer/location', [VolunteerController::class, 'updateLocation'])
        ->name('api.updateVolunteerLocation');
    Route::patch('/volunteer/availability', [VolunteerController::class, 'setAvailability'])
        ->name('api.setVolunteerAvailability');
    Route::post('/volunteer/alerts/{volunteerAlert}/respond', [VolunteerController::class, 'respond'])
        ->name('api.respondToVolunteerAlert');
    Route::post('/volunteer/redeem', [VolunteerController::class, 'redeem'])
        ->name('api.redeemVolunteerReward');
    Route::post('/volunteer/appearance', [VolunteerController::class, 'applyReward'])
        ->name('api.applyVolunteerReward');

    Route::get('/ambulance/my-vehicle', [AmbulanceVehicleController::class, 'myVehicle'])
        ->name('api.getMyAmbulance');
    Route::patch('/ambulance/location', [AmbulanceVehicleController::class, 'updateLocation'])
        ->name('api.updateAmbulanceLocation');
    Route::patch('/ambulance/status', [AmbulanceVehicleController::class, 'setStatus'])
        ->name('api.setAmbulanceStatus');
    Route::post('/ambulance/assignments/{alert}/complete', [AmbulanceVehicleController::class, 'completeAssignment'])
        ->name('api.completeAmbulanceAssignment');
    Route::get('/ambulance/fleet', [AmbulanceVehicleController::class, 'fleet'])
        ->name('api.getAmbulanceFleet');

    Route::get('/ambulance/unassigned', [AmbulanceVehicleController::class, 'unassigned'])
        ->name('api.getUnassignedAmbulances');
    Route::post('/ambulance/vehicles', [AmbulanceVehicleController::class, 'store'])
        ->name('api.createAmbulanceVehicle');
    Route::patch('/ambulance/vehicles/{vehicle}', [AmbulanceVehicleController::class, 'update'])
        ->name('api.updateAmbulanceVehicle');
    Route::delete('/ambulance/vehicles/{vehicle}', [AmbulanceVehicleController::class, 'destroy'])
        ->name('api.deleteAmbulanceVehicle');

    Route::get('/ambulance-companies', [AmbulanceCompanyController::class, 'index'])
        ->name('api.getAmbulanceCompanies');

    Route::get('/ambulance-companies/{user}', [AmbulanceCompanyController::class, 'show'])
        ->name('api.getAmbulanceCompany');

    Route::get('/equipment-fulfillments', [EquipmentFulfillmentController::class, 'index'])
        ->name('api.getEquipmentFulfillments');
    Route::patch('/equipment-fulfillments/{fulfillment}', [EquipmentFulfillmentController::class, 'update'])
        ->name('api.updateEquipmentFulfillment');
    Route::patch('/equipment-fulfillments/{fulfillment}/handover', [EquipmentFulfillmentController::class, 'updateByCustomer'])
        ->name('api.updateEquipmentHandover');

    Route::get('/partner/vendor-dashboard', [PartnerDashboardController::class, 'vendorDashboard'])
        ->name('api.getVendorDashboard');
    Route::get('/partner/ambulance-dashboard', [PartnerDashboardController::class, 'ambulanceDashboard'])
        ->name('api.getAmbulanceDashboard');
    Route::get('/partner/customer-dashboard', [PartnerDashboardController::class, 'customerDashboard'])
        ->name('api.getCustomerDashboard');
    Route::get('/partner/pharmacy-dashboard', [PartnerDashboardController::class, 'pharmacyDashboard'])
        ->name('api.getPharmacyDashboard');
    });
