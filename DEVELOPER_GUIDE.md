# Pulse Response — Hands-On Modification Guide

Everything in this app follows **one path**. Learn that path and you can change any feature.

---

## 1. The one flow (memorise this)

When a user clicks a button, this happens:

```
Button in a .jsx page
      ↓  onClick calls
Server Action          frontend/src/actions/xxxActions.js      ("use server")
      ↓  calls
API function           frontend/src/libs/api.js                (builds the URL)
      ↓  calls
apiClient              frontend/src/libs/apiClient.js          (adds the auth token)
      ↓  HTTP request
Route                  backend/routes/api.php                  (matches URL to method)
      ↓  calls
Controller             backend/app/Http/Controllers/...        (the logic)
      ↓  uses
Model                  backend/app/Models/Xxx.php              (the table)
      ↓
PostgreSQL
```

**The browser never talks to Laravel directly.** It talks to Next.js, and the
Next.js *server* talks to Laravel. That is why the auth token is safe.

To add anything, you touch these **6 files** in this order:

| # | File | What you add |
|---|---|---|
| 1 | `backend/app/Models/X.php` | the field in `$fillable` (only if new column) |
| 2 | `backend/app/Http/Controllers/.../XController.php` | the method |
| 3 | `backend/routes/api.php` | the route |
| 4 | `frontend/src/libs/api.js` | the fetch function |
| 5 | `frontend/src/actions/xActions.js` | the server action |
| 6 | `frontend/src/app/(protected)/x/page.jsx` | the button |

---

## 2. How to tell what something uses

Ask these three questions in order.

### Is it a DATABASE thing?
Look in `backend/app/Models/`. If there is a model file, there is a table.
Every model lists its columns in `$fillable`.

```
Medicine.php → medicines table → name, generic_name, price, stock, pharmacist_id
Order.php    → orders table    → total_amount, order_status, payment_method
```

Check the real columns in `backend/database/migrations/`.

### Is it an API CALL?
Look in `backend/routes/api.php`. Every line there is one endpoint.

```php
Route::get('/medicines', [MedicineController::class, 'index']);
//         ^ URL                ^ which controller    ^ which method
```

If the frontend needs data it does **not** already have, it needs an API call.

### Is it a LIBRARY / EXTERNAL SERVICE?
Look in `backend/app/Services/`. Each file wraps one external thing:

| File | External service | Used by |
|---|---|---|
| `StripeService.php` | **Stripe API** (payments) | membership, card checkout |
| `ChatbotService.php` | **Groq API** (AI model) | chatbot |
| `DispatchService.php` | **OSRM** (routing) + Haversine maths | ambulance dispatch |
| `GeocodingService.php` | **Nominatim** (coordinates → address) | driver/volunteer maps |
| `VolunteerAlertService.php` | none — our own logic | volunteer alerts |
| `RestockNotifier.php` | none — our own logic | out-of-stock requests |

**Rule of thumb:** if the answer comes from *our* tables → database. If from
*another company's* server → external API. If it is a calculation → a service or
a `libs/` file (`pricing.js`, `cart.js`).

---

## 3. RECIPE A — Add a button that uses an existing API

**Example task: "Add a Clear Cart button."**

The API already exists (`DELETE /cart-items/{cart_id}`).

**Step 1** — check `libs/api.js` for the function:
```javascript
export const deleteCartItem = async (cart_id) => {
  return apiClient.delete(`/cart-items/${cart_id}/`);
};
```

**Step 2** — check `actions/cartActions.js` for the action. If missing, add:
```javascript
export const clearCartAction = async (cartId) => {
  try {
    const response = await deleteCartItem(cartId);
    if (response.error) return { error: response.error };
    return { success: "Cart cleared." };
  } catch (error) {
    return { error: error.message || "Could not clear the cart." };
  }
};
```
Add `deleteCartItem` to the import block at the top of that file.

**Step 3** — the button, in `app/(protected)/cart/page.jsx`:
```jsx
import { clearCartAction } from "@/actions/cartActions"
import { toastSuccess, toastError } from "@/libs/toast"

const handleClear = async () => {
  const result = await clearCartAction(cartId)
  if (result.error) return toastError(result.error)
  toastSuccess(result.success)
  loadCartItems()          // refresh the list
}
```
```jsx
<button className="pr-btn pr-btn-primary" onClick={handleClear}>
  Clear cart
</button>
```

That is the whole pattern. **Action → api.js → button.**

---

## 4. RECIPE B — Add a new API endpoint

**Example task: "Show how many medicines are low on stock."**

**Step 1 — Controller method.**
`backend/app/Http/Controllers/Medicine/MedicineController.php`
```php
public function lowStock(): JsonResponse
{
    try {
        $medicines = Medicine::where('stock', '<=', 10)
            ->orderBy('stock')
            ->get(['id', 'name', 'brand', 'stock']);

        return response()->json([
            'count' => $medicines->count(),
            'data'  => $medicines,
        ], 200);
    } catch (\Exception $e) {
        Log::error($e);
        return response()->json(['errors' => 'An unexpected error occurred.'], 500);
    }
}
```

**Step 2 — Route.** `backend/routes/api.php`, inside the
`Route::middleware('auth:sanctum')->group(...)` block:
```php
Route::get('/medicines/low-stock', [MedicineController::class, 'lowStock'])
    ->name('api.getLowStockMedicines');
```
> **Order matters.** Put literal routes like `/medicines/low-stock` **above**
> `/medicines/{id}`, or `{id}` swallows the word "low-stock".

**Step 3 — api.js.**
```javascript
export const getLowStockMedicines = async () => {
  return apiClient.get("/medicines/low-stock/");
};
```

**Step 4 — Action.** `actions/medicineActions.js`
```javascript
export const getLowStockMedicinesAction = async () => {
  try {
    const response = await getLowStockMedicines();
    if (response.error) return { error: response.error };
    return { data: response.data, count: response.count };
  } catch (error) {
    return { error: error.message || "Could not load low stock." };
  }
};
```
Add `getLowStockMedicines` to the import block.

**Step 5 — Use it in a page.**
```jsx
const [lowStock, setLowStock] = useState([])

useEffect(() => {
  const load = async () => {
    const result = await getLowStockMedicinesAction()
    if (!result.error) setLowStock(result.data)
  }
  load()
}, [])
```

---

## 5. RECIPE C — Add a database column

**Example task: "Add a `manufacturer_country` to medicines."**

**Step 1 — Migration.** Create `backend/database/migrations/2026_09_08_000001_add_country_to_medicines_table.php`:
```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->string('manufacturer_country')->nullable()->after('brand');
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn('manufacturer_country');
        });
    }
};
```

**Step 2 — Run it.**
```
php artisan migrate
```

**Step 3 — Model.** Add to `$fillable` in `backend/app/Models/Medicine.php`:
```php
protected $fillable = [
    'pharmacist_id', 'name', 'generic_name', 'manufacturer_country', ...
];
```
> **If you forget `$fillable`, the value silently will not save.** This is the
> single most common mistake.

**Step 4 — Validation.** `backend/app/Http/Requests/Medicine/RegisterMedicineRequest.php`
```php
'manufacturer_country' => ['nullable', 'string', 'max:100'],
```
> Laravel's `$request->validated()` returns **only** fields that have a rule.
> No rule = the field is thrown away.

**Step 5 — Frontend form field.** In the create/update modal:
```jsx
<input name="manufacturer_country" defaultValue={medicine.manufacturer_country || ""} />
```

---

## 6. RECIPE D — Add a search filter

Filters live in the controller's `index()` method. Pattern from
`MedicineController::index()`:

```php
if ($request->has('brand') && $request->input('brand') !== '') {
    $query->whereRaw('LOWER(brand) LIKE ?', ['%' . mb_strtolower($request->input('brand')) . '%']);
}
```

Then send it from the frontend by adding to the query params object:
```javascript
const queryParams = { name: "napa", brand: "square" }
const result = await getMedicinesAction(queryParams)
```

**Note:** this project uses **PostgreSQL**. `ilike` works (case-insensitive
LIKE); it does **not** work on MySQL.

---

## 7. Where every feature lives

### Sabiq

| Feature | Backend | Frontend |
|---|---|---|
| **1. Medicine Search & Filter** | `Medicine/MedicineController.php` → `index()`, `suggestions()`, `alternatives()` | `app/(protected)/medicines/page.jsx`, `actions/medicineActions.js` |
| **2. Medicine Subscription** | `Shop/OrderController.php` → `getSubscriptions()`, `cancelSubscription()`, `updateSubscriptionItems()`, and the renewal block inside `update()` | `app/(protected)/subscriptions/page.jsx`, `actions/subscriptionActions.js` |
| **3. Multi-Tier Checkout** | `Shop/OrderController.php` → `create()`; charges in `Models/Order.php` → `DELIVERY_CHARGES` | `app/(protected)/checkout/page.jsx`, `libs/pricing.js`, `libs/cart.js` |
| **4. Ambulance Dispatch** | `Misc/EmergencyAlertController.php` → `store()`, `assignNearestVehicle()`; `Services/DispatchService.php` (Haversine + OSRM) | `app/(protected)/history/page.jsx` (trigger), `app/(protected)/driver/page.jsx`, `components/map/AmbulanceTracker.jsx` |

### Shourav

| Feature | Backend | Frontend |
|---|---|---|
| **1. Doctor Booking** | `Misc/ConsultationController.php`, `User/PharmacistController.php`, `User/DoctorReviewController.php` | `app/(protected)/pharmacist/page.jsx`, `app/(protected)/pharmacist/[user_id]/page.jsx`, `actions/consultationActions.js` |
| **2. Medical Ledger** | `Misc/ActivityLedgerController.php` → `timeline()`, `summary()`, `entry()` | `app/(protected)/history/page.jsx`, `components/cards/TimelineCard.jsx`, `actions/ledgerActions.js` |
| **3. Stripe Billing** | `Shop/MembershipController.php`, `Shop/PaymentController.php` → `payWithCard()`, `Services/StripeService.php` | `app/(protected)/membership/page.jsx`, `actions/membershipActions.js`, `actions/paymentActions.js` |
| **4. Volunteer Alerts** | `Services/VolunteerAlertService.php`, `User/VolunteerController.php` | `app/(protected)/volunteer/page.jsx`, `actions/volunteerActions.js` |

### Wasif

| Feature | Backend | Frontend |
|---|---|---|
| **1. Equipment Rental & Management** | `Equipment/EquipmentController.php`, `Equipment/EquipmentRentalController.php`, `Equipment/EquipmentFulfillmentController.php` | `app/(protected)/equipment/page.jsx`, `components/cards/EquipmentDetailCard.jsx`, `actions/equipmentActions.js` |
| **2. Analytics Dashboard** | `Partner/PartnerDashboardController.php` → `vendorDashboard()`, `ambulanceDashboard()`, `customerDashboard()`, `pharmacyDashboard()` | `app/(protected)/partner-dashboard/page.jsx`, `components/charts/Charts.jsx` |
| **3. In-App Notifications** | `Misc/NotificationController.php`; `Notification::create()` calls scattered through the other controllers | `components/navbar/NotificationBell.jsx`, `app/(protected)/notification/page.jsx` |
| **4. Chatbot Assistant** | `Services/ChatbotService.php` (rules first, model second), `Misc/ChatbotController.php` | `app/(protected)/assistant/page.jsx`, `actions/chatbotActions.js` |

---

## 8. Reusable snippets

### A styled button
```jsx
<button className="pr-btn pr-btn-primary" onClick={handleThing}>Save</button>
<button className="pr-btn pr-btn-ghost" onClick={handleOther}>Cancel</button>
```
Classes are defined in `frontend/src/styles/design-system.css`.

### A success popup (5 seconds)
```jsx
import { toastSuccess, toastError } from "@/libs/toast"
toastSuccess("Saved.")
toastError("That did not work.")
```

### Only show something to customers
```jsx
import { isCustomerRole } from "@/libs/roles"
const [canOrder, setCanOrder] = useState(false)
useEffect(() => {
  getUserRoleAction().then(role => setCanOrder(isCustomerRole(role)))
}, [])

{canOrder && <button ...>Order now</button>}
```

### Send a notification from the backend
```php
Notification::create([
    'user_id' => $user->id,
    'subject' => 'Title here',
    'message' => 'Body text here.',
    'is_read' => false,
]);
```

### Protect a controller method by role
```php
$user = Auth::user();
if (!$user->isAdmin() && !$user->isSuperAdmin()) {
    return response()->json(['errors' => 'Not authorized.'], 403);
}
```

---

## 9. Test your change

```
cd backend;  php artisan serve
cd frontend; npm run dev
```
Open `http://localhost:3000`. Log in with `sabbir.customer@pulse.test` /
`Severus00#` (all accounts use that password).

**Test the API alone** — open in a browser or use Postman:
```
http://127.0.0.1:8000/api/medicines
```

**Before you push, always run:**
```
cd frontend; npm run build
```
If that fails, Vercel will fail too.

---

## 10. Deploy the change

```
git add -A
git commit -m "what you changed"
git push
```
Vercel redeploys the frontend automatically. Railway redeploys the backend
automatically. Takes about two minutes.

If you added a migration, it runs on Railway automatically because the start
command is `php artisan migrate --force && php artisan serve ...`.

---

## 11. Errors you will actually hit

| Error | Cause | Fix |
|---|---|---|
| `Cannot read properties of undefined` | `useState()` with no value | `useState({})` or `useState([])` |
| Form saves but value does not change | field missing from `$fillable`, or no validation rule | add to both |
| `404` from the API | route missing, or `{id}` route declared above the literal one | check `routes/api.php` order |
| `419` / `401` | token expired | log out and back in |
| `could not find driver` | `pdo_pgsql` disabled | uncomment `extension=pdo_pgsql` in `php.ini` |
| `useSearchParams() should be wrapped in a suspense boundary` | build-only error | wrap the page body in `<Suspense>` (see `subscriptions/page.jsx`) |
| Nothing happens, no error | an action swallowed the error | `console.log(result)` after the action call |

---

## 12. Live-test survival checklist

1. **Find the feature** in the table in section 7.
2. **Decide the layer:** display only → frontend. New data → API. New field → migration.
3. **Follow the recipe** in section 3, 4 or 5.
4. **Test locally** with `npm run dev`.
5. **`npm run build`** before pushing.
6. **Push** — deployment is automatic.

If you are asked something and cannot find where it lives, search the whole
project for a word you can see on screen:

```
grep -rn "Add to Cart" frontend/src
```

That finds the exact file rendering it, every time.
