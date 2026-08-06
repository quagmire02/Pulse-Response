<?php

namespace App\Http\OpenApi;

use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 * version="1.0.0",
 * title="Pharma Flow API",
 * description="API documentation for the Pharma Flow project",
 * @OA\Contact(
 * email="support@example.com"
 * )
 * )
 *
 * @OA\SecurityScheme(
 * securityScheme="sanctum",
 * type="http",
 * scheme="bearer"
 * )
 *
 * @OA\Tag(
 * name="Users",
 * description="API Endpoints for User Management"
 * )
 * 
 * @OA\Tag(
 * name="Categories",
 * description="API Endpoints for Category Management"
 * )
 * 
 * @OA\Tag(
 * name="Medicines",
 * description="API Endpoints for Medicine Management"
 * )
 * 
 * @OA\Tag(
 * name="Carts",
 * description="API Endpoints for Cart Management"
 * )
 * 
 * @OA\Tag(
 * name="Orders",
 * description="API Endpoints for Order Management"
 * )
 * 
 * @OA\Tag(
 * name="Payments",
 * description="API Endpoints for Payment Item Management"     
 * )
 * 
 * @OA\Tag(
 * name="Deliveries",
 * description="API Endpoints for Delivery Item Management"     
 * )
 * 
 * @OA\Tag(
 * name="Pharmacists",
 * description="API Endpoints for Pharmacist Item Management"     
 * )
 * 
 * @OA\Tag(
 * name="Notifications",
 * description="API Endpoints for Notifications"
 * )
 * 
 * @OA\Tag(
 * name="Consultations",
 * description="API endpoints for managing consultations and slots."
 * )
 *
 * @OA\Schema(
 * schema="ErrorResponse",
 * title="Error Response",
 * description="Standard error response format for generic errors (e.g., 401, 403, 404, 500)",
 * @OA\Property(property="errors", type="string", description="Error message"),
 * example={"errors": "Something went wrong."}
 * )
 * 
 * @OA\Schema(
 * schema="SuccessResponse",
 * title="Success Response",
 * description="Standard success response format for updates and deletes",
 * @OA\Property(property="success", type="string", description="Success message"),
 * example={"success": "Operation successful."}
 * )
 * 
 * @OA\Schema(
 * schema="User",
 * title="User",
 * description="User model",
 * @OA\Property(property="id", type="integer", format="int64", description="User ID"),
 * @OA\Property(property="first_name", type="string", description="User's first name"),
 * @OA\Property(property="last_name", type="string", description="User's last name"),
 * @OA\Property(property="email", type="string", format="email", description="User's email address"),
 * @OA\Property(property="username", type="string", description="User's unique username"),
 * @OA\Property(property="address", type="string", nullable=true, description="User's address"),
 * @OA\Property(property="is_admin", type="boolean", description="Indicates if the user has admin privileges"),
 * @OA\Property(property="is_active", type="boolean", description="Indicates if the user account is active"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of user creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={
 * "id": 1, "first_name": "John", "last_name": "Doe", "email": "john.doe@example.com",
 * "username": "johndoe", "address": "123 Main St", "is_admin": false, "is_active": true,
 * "created_at": "2023-01-01T12:00:00.000000Z", "updated_at": "2023-01-01T12:00:00.000000Z"
 * }
 * )
 * 
 * @OA\Schema(
 * schema="UserUsername",
 * title="User with ID and Username",
 * description="A simple schema for a user with only ID and username.",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="username", type="string", example="johndoe")
 * )
 *
 * @OA\Schema(
 * schema="UserPagination",
 * title="User Pagination",
 * description="Paginated list of users",
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/User")),
 * @OA\Property(property="links", type="object", description="Pagination links"),
 * @OA\Property(property="meta", type="object", description="Pagination meta information")
 * )
 * 
 * @OA\Schema(
 * schema="Category",
 * title="Category",
 * description="Category model",
 * @OA\Property(property="id", type="integer", format="int64", description="Category ID"),
 * @OA\Property(property="name", type="string", description="Category name"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={"id": 1, "name": "Painkillers", "created_at": "2023-01-01T12:00:00.000000Z", "updated_at": "2023-01-01T12:00:00.000000Z"}
 * )
 * 
 * @OA\Schema(
 * schema="CategoryPagination",
 * title="Category Pagination",
 * description="Paginated list of categories",
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Category")),
 * @OA\Property(property="links", type="object", description="Pagination links"),
 * @OA\Property(property="meta", type="object", description="Pagination meta information")
 * )
 * 
 * @OA\Schema(
 * schema="Medicine",
 * title="Medicine",
 * description="Medicine model",
 * @OA\Property(property="id", type="integer", format="int64", description="Medicine ID"),
 * @OA\Property(property="name", type="string", description="Medicine name"),
 * @OA\Property(property="description", type="string", nullable=true, description="Medicine description"),
 * @OA\Property(property="price", type="number", format="float", description="Medicine price"),
 * @OA\Property(property="dosage", type="string", description="Medicine dosage"),
 * @OA\Property(property="brand", type="string", description="Medicine brand"),
 * @OA\Property(property="image_url", type="string", nullable=true, description="URL of the medicine image"),
 * @OA\Property(property="stock", type="integer", description="Current stock quantity"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * @OA\Property(property="categories", type="array", @OA\Items(ref="#/components/schemas/Category"), description="Categories associated with the medicine"),
 * example={"id": 1, "name": "Aspirin", "description": "Painkiller", "price": 5.99, "dosage": "500mg", "brand": "Bayer", "image_url": "http://example.com/images/aspirin.jpg", "stock": 100, "created_at": "2023-01-01T12:00:00.000000Z", "updated_at": "2023-01-01T12:00:00.000000Z", "categories": {{"id": 1, "name": "Painkillers"}}}
 * )
 *
 * @OA\Schema(
 * schema="MedicineName",
 * title="Medicine Name and ID",
 * description="A simple schema for a medicine with only ID and name.",
 * @OA\Property(property="id", type="integer", example=101),
 * @OA\Property(property="name", type="string", example="Aspirin")
 * )
 * 
 * @OA\Schema(
 * schema="MedicinePagination",
 * title="Medicine Pagination",
 * description="Paginated list of medicines",
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Medicine")),
 * @OA\Property(property="links", type="object", description="Pagination links"),
 * @OA\Property(property="meta", type="object", description="Pagination meta information")
 * )
 * 
 * @OA\Schema(
 * schema="CartItem",
 * title="CartItem",
 * description="Cart item model",
 * @OA\Property(property="id", type="integer", format="int64", description="Cart item ID"),
 * @OA\Property(property="cart_id", type="integer", format="int64", description="ID of the associated cart"),
 * @OA\Property(property="medicine_id", type="integer", format="int64", description="ID of the associated medicine item"),
 * @OA\Property(property="quantity", type="integer", description="Quantity of the medicine item"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={
 * "id": 1,
 * "cart_id": 1,
 * "medicine_id": 101,
 * "quantity": 2,
 * "created_at": "2023-01-01T12:00:00.000000Z",
 * "updated_at": "2023-01-01T12:00:00.000000Z"
 * }
 * )
 *
 * @OA\Schema(
 * schema="CartItemList",
 * title="CartItemList",
 * description="List of cart items",
 * @OA\Property(
 * property="cartItems",
 * type="array",
 * @OA\Items(ref="#/components/schemas/CartItem")
 * )
 * )
 *
 * @OA\Schema(
 * schema="UpdateCartItemRequest",
 * title="UpdateCartItemRequest",
 * description="Request body for updating cart items",
 * required={"cart_id", "items"},
 * @OA\Property(
 * property="items",
 * type="array",
 * @OA\Items(
 * @OA\Property(property="medicine_id", type="integer", description="ID of the medicine item"),
 * @OA\Property(property="quantity", type="integer", description="Quantity of the medicine item")
 * ),
 * description="List of new cart items"
 * ),
 * example={
 * "items": {
 * {"medicine_id": 1, "quantity": 2},
 * {"medicine_id": 2, "quantity": 1}
 * }
 * }
 * )
 *
 * @OA\Schema(
 * schema="Order",
 * title="Order",
 * description="Order model",
 * @OA\Property(property="id", type="integer", format="int64", description="Order ID"),
 * @OA\Property(property="user_id", type="integer", format="int64", description="ID of the user who placed the order"),
 * @OA\Property(property="order_date", type="string", format="date-time", description="Date and time of the order"),
 * @OA\Property(property="total_amount", type="number", format="float", description="Total amount of the order"),
 * @OA\Property(
 * property="order_status",
 * type="string",
 * enum={"pending", "delivered", "canceled"},
 * default="pending",
 * description="Current status of the order"
 * ),
 * @OA\Property(
 * property="payment_status",
 * type="string",
 * enum={"pending", "paid", "failed"},
 * default="pending",
 * description="Current status of the payment"
 * ),
 * @OA\Property(
 * property="subscribe_type",
 * type="string",
 * enum={"none", "weekly", "monthly"},
 * default="none",
 * description="Current status of the subscription"
 * ),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of order creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={
 * "id": 1,
 * "user_id": 10,
 * "order_date": "2023-01-01T12:00:00.000000Z",
 * "total_amount": 25.75,
 * "order_status": "pending",
 * "created_at": "2023-01-01T12:00:00.000000Z",
 * "updated_at": "2023-01-01T12:00:00.000000Z"
 * }
 * )
 *
 * @OA\Schema(
 * schema="OrderItem",
 * title="OrderItem",
 * description="Order item model",
 * @OA\Property(property="id", type="integer", format="int64", description="Order item ID"),
 * @OA\Property(property="order_id", type="integer", format="int64", description="ID of the associated order"),
 * @OA\Property(property="medicine_id", type="integer", format="int64", description="ID of the associated medicine item"),
 * @OA\Property(property="quantity", type="integer", description="Quantity of the medicine item"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp of creation"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={
 * "id": 1,
 * "order_id": 1,
 * "medicine_id": 101,
 * "quantity": 2,
 * "created_at": "2023-01-01T12:00:00.000000Z",
 * "updated_at": "2023-01-01T12:00:00.000000Z"
 * }
 * )
 *
 * @OA\Schema(
 * schema="OrderWithItems",
 * title="OrderWithItems",
 * description="Order model with associated order items",
 * allOf={
 * @OA\Schema(ref="#/components/schemas/Order"),
 * @OA\Schema(
 * @OA\Property(
 * property="order_items",
 * type="array",
 * @OA\Items(ref="#/components/schemas/OrderItem")
 * )
 * )
 * },
 * example={
 * "id": 1,
 * "user_id": 10,
 * "order_date": "2023-01-01T12:00:00.000000Z",
 * "total_amount": 25.75,
 * "order_status": "pending",
 * "created_at": "2023-01-01T12:00:00.000000Z",
 * "updated_at": "2023-01-01T12:00:00.000000Z",
 * "order_items": {
 * {
 * "id": 1,
 * "order_id": 1,
 * "medicine_id": 101,
 * "quantity": 2,
 * "created_at": "2023-01-01T12:00:00.000000Z",
 * "updated_at": "2023-01-01T12:00:00.000000Z"
 * }
 * }
 * }
 * )
 * 
 * @OA\Schema(
 * schema="OrderItemWithMedicine",
 * title="Order Item with Medicine Details",
 * description="Order item model with a nested medicine object containing only name and id.",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="order_id", type="integer", example=1),
 * @OA\Property(property="medicine_id", type="integer", example=101),
 * @OA\Property(property="quantity", type="integer", example=2),
 * @OA\Property(
 * property="medicine",
 * ref="#/components/schemas/MedicineName"
 * ),
 * example={
 * "id": 1,
 * "order_id": 1,
 * "medicine_id": 101,
 * "quantity": 2,
 * "medicine": {
 * "id": 101,
 * "name": "Aspirin"
 * }
 * }
 * )
 *
 * @OA\Schema(
 * schema="OrderPagination",
 * title="Order Pagination",
 * description="Paginated list of orders",
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Order")),
 * @OA\Property(property="links", type="object", description="Pagination links"),
 * @OA\Property(property="meta", type="object", description="Pagination meta information")
 * )
 *
 * @OA\Schema(
 * schema="Payment",
 * title="Payment",
 * description="Payment model",
 * @OA\Property(property="id", type="integer", format="int64", description="Payment ID"),
 * @OA\Property(property="user_id", type="integer", format="int64", description="ID of the user who made the payment"),
 * @OA\Property(property="order_id", type="integer", format="int64", description="ID of the associated order"),
 * @OA\Property(property="payment_type", type="string", enum={"cash", "card"}, description="Type of payment"),
 * @OA\Property(property="payment_date", type="string", format="date-time", description="Date and time of the payment"),
 * example={
 * "id": 1,
 * "user_id": 1,
 * "order_id": 10,
 * "payment_type": "cash",
 * "payment_date": "2023-01-01T13:00:00.000000Z"
 * }
 * )
 *
 * @OA\Schema(
 * schema="PaymentPagination",
 * title="Payment Pagination",
 * description="Paginated list of payments",
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Payment")),
 * @OA\Property(property="links", type="object", description="Pagination links"),
 * @OA\Property(property="meta", type="object", description="Pagination meta information")
 * )
 *
 * @OA\Schema(
 * schema="RegisterPaymentRequest",
 * title="RegisterPaymentRequest",
 * description="Request body for creating a new payment",
 * required={"order_id", "payment_type"},
 * @OA\Property(property="order_id", type="integer", description="ID of the order to be paid"),
 * @OA\Property(property="payment_type", type="string", enum={"cash", "card"}, description="Type of payment"),
 * example={
 * "order_id": 1,
 * "payment_type": "cash"
 * }
 * )
 * 
 * @OA\Schema(
 * schema="Prescription",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="user_id", type="integer", example=101),
 * @OA\Property(property="order_id", type="integer", example=1),
 * @OA\Property(property="image_url", type="string", format="url", example="http://localhost:8000/storage/prescriptions/example.jpg"),
 * @OA\Property(property="created_at", type="string", format="date-time"),
 * @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 * 
 * @OA\Schema(
 * schema="OrderWithItemsAndPrescriptions",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="user_id", type="integer", example=101),
 * @OA\Property(property="total_amount", type="number", format="float", example=55.50),
 * @OA\Property(property="order_date", type="string", format="date", example="2025-08-19"),
 * @OA\Property(property="order_status", type="string", enum={"pending", "delivered", "canceled"}, example="pending"),
 * @OA\Property(property="payment_status", type="string", enum={"pending", "paid", "failed"}, example="pending"),
 * @OA\Property(property="subscribe_type", type="string", enum={"none", "weekly", "monthly"}, example="none"),
 * @OA\Property(property="created_at", type="string", format="date-time"),
 * @OA\Property(property="updated_at", type="string", format="date-time"),
 * @OA\Property(property="user", ref="#/components/schemas/UserUsername"),
 * @OA\Property(
 * property="order_items",
 * type="array",
 * @OA\Items(ref="#/components/schemas/OrderItemWithMedicine")
 * ),
 * @OA\Property(
 * property="prescriptions",
 * type="array",
 * @OA\Items(ref="#/components/schemas/Prescription")
 * )
 * )
 * 
 * @OA\Schema(
 * schema="OrderDeliveryResponse",
 * title="Order Details for Delivery Response",
 * description="A simplified order model for use in delivery responses.",
 * @OA\Property(property="id", type="integer", example=101),
 * @OA\Property(property="user_id", type="integer", example=1),
 * @OA\Property(property="total_amount", type="number", format="float", example=50.75),
 * @OA\Property(property="order_date", type="string", format="date", example="2025-12-19"),
 * @OA\Property(property="order_status", type="string", example="pending"),
 * @OA\Property(property="payment_status", type="string", example="unpaid"),
 * @OA\Property(property="subscribe_type", type="string", enum={"none", "weekly", "monthly"}, example="none")
 * )
 * 
 * @OA\Schema(
 * schema="DeliveryWithOrderResponse",
 * title="Delivery with Order Details",
 * description="Delivery model with a nested order.",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="order_id", type="integer", example=101),
 * @OA\Property(property="track_num", type="string", example="9876543210"),
 * @OA\Property(property="est_del_date", type="string", format="date", example="2025-12-25"),
 * @OA\Property(property="act_del_date", type="string", format="date", nullable=true, example=null),
 * @OA\Property(property="delivery_status", type="string", enum={"processing", "shipping", "delivered", "canceled"}, example="processing"),
 * @OA\Property(property="delivery_type", type="string", enum={"basic", "rapid", "emergency"}, example="basic"),
 * @OA\Property(property="created_at", type="string", format="date-time", example="2025-12-20T10:00:00Z"),
 * @OA\Property(property="updated_at", type="string", format="date-time", example="2025-12-20T10:00:00Z"),
 * @OA\Property(
 * property="order",
 * ref="#/components/schemas/OrderDeliveryResponse"
 * )
 * )
 * 
 * @OA\Schema(
 * schema="PharmacistWithUser",
 * title="Pharmacist with User Details",
 * description="Pharmacist model with a nested user.",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="user_id", type="integer", example=101),
 * @OA\Property(property="license_num", type="integer", example=12345),
 * @OA\Property(property="speciality", type="string", example="Dermatology"),
 * @OA\Property(property="bio", type="string", example="A specialist in skin care."),
 * @OA\Property(property="is_consultation", type="boolean", example=true),
 * @OA\Property(
 * property="user",
 * ref="#/components/schemas/User"
 * )
 * )
 *
 * @OA\Schema(
 * schema="RegisterPharmacistRequest",
 * title="RegisterPharmacistRequest",
 * @OA\Property(property="first_name", type="string", example="Jane"),
 * @OA\Property(property="last_name", type="string", example="Doe"),
 * @OA\Property(property="email", type="string", format="email", example="jane.doe@example.com"),
 * @OA\Property(property="username", type="string", example="janedoe"),
 * @OA\Property(property="password", type="string", format="password", example="Password123!"),
 * @OA\Property(property="password_confirmation", type="string", format="password", example="Password123!"),
 * @OA\Property(property="address", type="string", example="456 Oak Ave"),
 * @OA\Property(property="license_num", type="integer", example=12345),
 * @OA\Property(property="speciality", type="string", example="Clinical Pharmacy"),
 * @OA\Property(property="bio", type="string", example="Experienced pharmacist specializing in medication therapy."),
 * @OA\Property(property="is_consultation", type="boolean", example=true)
 * )
 *
 * @OA\Schema(
 * schema="UpdatePharmacistRequest",
 * title="UpdatePharmacistRequest",
 * @OA\Property(property="first_name", type="string", example="Jane"),
 * @OA\Property(property="last_name", type="string", example="Doe"),
 * @OA\Property(property="email", type="string", format="email", example="jane.doe@example.com"),
 * @OA\Property(property="username", type="string", example="janedoe"),
 * @OA\Property(property="address", type="string", example="456 Oak Ave"),
 * @OA\Property(property="license_num", type="integer", example=12345),
 * @OA\Property(property="speciality", type="string", example="Clinical Pharmacy"),
 * @OA\Property(property="bio", type="string", example="Experienced pharmacist specializing in medication therapy."),
 * @OA\Property(property="is_consultation", type="boolean", example=true)
 * )
 * 
 * @OA\Schema(
 * schema="Notification",
 * title="Notification",
 * description="Notification model",
 * @OA\Property(property="id", type="integer", format="int64", description="Notification ID"),
 * @OA\Property(property="user_id", type="integer", format="int64", description="ID of the user the notification belongs to"),
 * @OA\Property(property="message", type="string", description="The notification message"),
 * @OA\Property(property="type", type="string", enum={"info", "problem", "proposal", "project", "transaction", "review"}, description="The type of notification"),
 * @OA\Property(property="link", type="string", nullable=true, description="URL or link related to the notification"),
 * @OA\Property(property="is_read", type="boolean", description="Indicates if the notification has been read"),
 * @OA\Property(property="created_at", type="string", format="date-time", description="Timestamp when the notification was created"),
 * @OA\Property(property="updated_at", type="string", format="date-time", description="Timestamp of last update"),
 * example={
 * "id": 1, "user_id": 1, "message": "Your proposal has been accepted.",
 * "type": "proposal", "link": "/proposals/123", "is_read": false,
 * "created_at": "2025-08-16T12:00:00.000000Z", "updated_at": "2025-08-16T12:00:00.000000Z"
 * }
 * )
 *
 * @OA\Schema(
 * schema="NotificationPagination",
 * title="Notification Pagination",
 * description="Paginated list of notifications",
 * @OA\Property(property="current_page", type="integer", example=1),
 * @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Notification")),
 * @OA\Property(property="first_page_url", type="string", example="http://localhost:8000/api/notifications?page=1"),
 * @OA\Property(property="from", type="integer", example=1),
 * @OA\Property(property="last_page", type="integer", example=2),
 * @OA\Property(property="last_page_url", type="string", example="http://localhost:8000/api/notifications?page=2"),
 * @OA\Property(
 * property="links",
 * type="array",
 * @OA\Items(
 * @OA\Property(property="url", type="string", nullable=true, example="http://localhost:8000/api/notifications?page=1"),
 * @OA\Property(property="label", type="string", example="&laquo; Previous"),
 * @OA\Property(property="active", type="boolean", example=true)
 * )
 * ),
 * @OA\Property(property="next_page_url", type="string", nullable=true, example="http://localhost:8000/api/notifications?page=2"),
 * @OA\Property(property="path", type="string", example="http://localhost:8000/api/notifications"),
 * @OA\Property(property="per_page", type="integer", example=10),
 * @OA\Property(property="prev_page_url", type="string", nullable=true, example=null),
 * @OA\Property(property="to", type="integer", example=10),
 * @OA\Property(property="total", type="integer", example=14)
 * )
 * 
 * @OA\Schema(
 * schema="Consultation",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="user_id", type="integer", example=101),
 * @OA\Property(property="slot_id", type="integer", example=202),
 * @OA\Property(property="status", type="string", example="pending"),
 * @OA\Property(property="confirmed_at", type="string", format="date-time", nullable=true),
 * @OA\Property(property="completed_at", type="string", format="date-time", nullable=true),
 * @OA\Property(property="created_at", type="string", format="date-time"),
 * @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 * schema="Slot",
 * @OA\Property(property="id", type="integer", example=202),
 * @OA\Property(property="pharmacist_id", type="integer", example=101),
 * @OA\Property(property="date", type="string", format="date", example="2025-10-27"),
 * @OA\Property(property="start_time", type="integer", example=10),
 * @OA\Property(property="start_period", type="string", enum={"AM", "PM"}, example="AM"),
 * @OA\Property(property="end_time", type="integer", example=11),
 * @OA\Property(property="end_period", type="string", enum={"AM", "PM"}, example="AM"),
 * @OA\Property(property="is_available", type="boolean", example=false),
 * @OA\Property(property="created_at", type="string", format="date-time"),
 * @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 * schema="RegisterConsultationRequest",
 * required={"pharmacist_id", "date", "start_time", "start_period"},
 * @OA\Property(property="pharmacist_id", type="integer", example=101),
 * @OA\Property(property="date", type="string", format="date", example="2025-11-20"),
 * @OA\Property(property="start_time", type="integer", example=10, description="1-12 in 12-hour format"),
 * )
 *
 * @OA\Schema(
 * schema="UpdateConsultationRequest",
 * required={"status"},
 * @OA\Property(property="status", type="string", enum={"confirmed", "rejected", "completed"}, example="confirmed")
 * )
 *
 * @OA\Schema(
 * schema="ConsultationResource",
 * @OA\Property(property="id", type="integer", example=1),
 * @OA\Property(property="user_id", type="integer", example=101),
 * @OA\Property(property="slot_id", type="integer", example=202),
 * @OA\Property(property="status", type="string", example="pending"),
 * @OA\Property(property="confirmed_at", type="string", format="date-time", nullable=true),
 * @OA\Property(property="completed_at", type="string", format="date-time", nullable=true),
 * @OA\Property(property="user", type="object", properties={
 * @OA\Property(property="id", type="integer", example=101),
 * @OA\Property(property="username", type="string", example="john_doe")
 * }, nullable=true),
 * @OA\Property(property="slot", ref="#/components/schemas/Slot", nullable=true)
 * )
 * 
 */
class Annotations
{
    // This class is just a container for the annotations. No actual code needed here.
}
