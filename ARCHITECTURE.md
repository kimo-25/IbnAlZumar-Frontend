# ARCHITECTURE.md — Ibn Al-Zomar ERP & POS System

> **Purpose:** This file is the **single source of truth (System Context)** for the Ibn Al-Zomar
> platform. Attach it to any prompt sent to an AI coding tool (Claude, Qwen, Manus, Cursor, Copilot…).
> It describes **what exists today in the codebase** and **what is planned but not yet built**.
>
> **Rule for AI tools:** Never invent entities, folders, enums, or endpoints. Anything not listed
> here does not exist. Every item below is tagged:
>
> | Tag | Meaning |
> |---|---|
> | `[IMPL]` | Implemented and present in the repository today. |
> | `[PARTIAL]` | Partially implemented — schema or endpoint exists but the business rule does not. |
> | `[PLANNED]` | Target design. **Does not exist yet.** Build it exactly as specified here. |
>
> Last synced with code: see `git log -1` of this file's commit.

---

## 1. System Overview

| Item | Value |
|---|---|
| **App name** | Ibn Al-Zomar ERP & POS System (ابن الزمر) |
| **Business** | Hardware / tools retail store in Egypt: retail storefront, in-store POS, wholesale, warehousing, purchasing, maintenance workshop, HR & payroll |
| **Currency** | EGP (Egyptian Pound) |
| **Primary language** | Arabic (RTL) with English (LTR) as secondary — every user-facing string is bilingual |
| **Repositories** | `kimo-25/Ibn-Al-Zumar-Backend` (API) · `kimo-25/IbnAlZumar-Frontend` (Web SPA/PWA) |

### 1.1 Core stack — as actually built `[IMPL]`

| Concern | Technology |
|---|---|
| API runtime | **ASP.NET Core Web API, `net9.0`** (target framework in `Ibn al-Zumar.API.csproj` is `net9.0`, **not** net8.0 — do not downgrade) |
| Language | C# 13, `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>` |
| Architecture style | **Layered "Clean-ish" single project**: `Domain/` → `Persistence/` → `Services/` → `Controllers/` inside one csproj (see §2.1). A strict 4-project Clean Architecture split is `[PLANNED]`. |
| ORM | Entity Framework Core 9 (`Microsoft.EntityFrameworkCore.SqlServer`), code-first migrations |
| Database | **SQL Server / Azure SQL** (`options.UseSqlServer(...)`). PostgreSQL is `[PLANNED]` — any raw SQL must stay provider-neutral or be guarded. |
| AuthN | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`), `PasswordHasher<User>` |
| AuthZ | Dynamic permission-code policies (`PermissionPolicyProvider` + `PermissionAuthorizationHandler`) |
| Validation | DataAnnotations on DTOs + `FluentValidation.AspNetCore` **package referenced but no `AbstractValidator` written yet** → `[PARTIAL]` |
| Mapping | `Mapster` referenced; current services map **manually** in service classes → `[PARTIAL]` |
| Excel / files | `ClosedXML`, `DocumentFormat.OpenXml` |
| Email | MailKit + **Brevo** (`EmailSettings`, config section `Brevo`) |
| HTTP clients | `RestSharp`, typed `HttpClient` via `AddHttpClient` |
| API docs | Swashbuckle / Swagger at `/swagger` (enabled in all environments) |
| Frontend | **React 18 + Vite 5 + JavaScript (JSX, no TypeScript)** |
| Styling | **Tailwind CSS 3** with a custom design token theme (§6.2) |
| Routing | `react-router-dom` v6 |
| HTTP | `axios` with a single shared instance + interceptors |
| Offline | **PWA** (`vite-plugin-pwa`) + **Dexie (IndexedDB)** offline POS queue with idempotent batch sync |
| Icons | `lucide-react` |
| Client validation | **Zod** schemas (`src/validators/`) |
| Print / export | `html2pdf.js`, `html2canvas`, `xlsx`, plus a hand-rolled print-window engine (`src/utils/printInvoice.js`) |
| Hosting | API → Azure App Service (`Dockerfile`, .NET 9 image, `PORT` env var). Frontend → **GitHub Pages** (`base: '/IbnAlZumar-Frontend/'`) via `.github/workflows/deploy.yml` |

### 1.2 High-level runtime topology

```
┌──────────────────────────┐        HTTPS / JWT Bearer        ┌───────────────────────────┐
│  React PWA (GitHub Pages)│ ───────────────────────────────► │  ASP.NET Core API (Azure) │
│  • Storefront (customer) │ ◄─────────── JSON ─────────────  │  Controllers → Services   │
│  • Admin / Owner console │                                  │  → EF Core → Azure SQL    │
│  • POS (offline-capable) │                                  └────────────┬──────────────┘
│  • Dexie queue + SW      │                                               │
└──────────────────────────┘                                               │
        offline writes ──► /api/orders/sync (idempotent by ClientUuid)      │
                                                                            ▼
                      External: Paymob (payments) · Gemini (AI assistant) · Brevo (email)
                                Hugging Face (voice biometrics) · Google OAuth
                                [PLANNED] WhatsApp Cloud API · Quartz.NET scheduler
```

---

## 2. Architecture Layers & Directory Structure

### 2.1 Backend — `Ibn-Al-Zumar-Backend`

Solution root: `Ibn al-Zumar.API/Ibn al-Zumar.API.sln`.
**All production code lives in the single project `Ibn al-Zumar.API/Ibn al-Zumar.API/`.**
`Ibn al-Zumar.Domain/`, `Controllers/` and `Persistence/` at the *solution* root are **legacy/dead
folders not referenced by the csproj — never edit or add files there.**

```
Ibn al-Zumar.API/                         # solution folder
├── Ibn al-Zumar.API.sln
├── Dockerfile                            # .NET 9 SDK build → aspnet:9.0 runtime, EXPOSE 8080
└── Ibn al-Zumar.API/                     # ★ THE project — all new code goes here
    ├── Program.cs                        # composition root: DI, JWT, CORS, Swagger, pipeline
    ├── appsettings*.json                 # ⚠ see §9.3 secret hygiene warning
    │
    ├── Domain/                           # ── DOMAIN LAYER (no EF/ASP.NET dependencies)
    │   ├── Common/BaseEntity.cs          # Id, CreatedAt, UpdatedAt, IsDeleted
    │   ├── Enums/Enums.cs                # ALL enums live in this one file
    │   └── Entities/
    │       ├── Catalog/                  # Product, Category, Brand, ProductVariant, images, attributes
    │       ├── Inventory/                # Warehouse, ProductStock, InventoryTransaction, StockTransfer(+Item)
    │       ├── Sales/                    # Customer, Order, OrderItem, Payment, CustomerLedgerEntry,
    │       │                             #   ShippingZone, MaintenanceRequest (namespace *.Maintenance)
    │       ├── Purchasing/               # Supplier, PurchaseOrder(+Item), SupplierPayment, SupplierLedgerEntry
    │       ├── Identity/                 # User, Role, Permission, UserRole, RolePermission, UserPermission
    │       ├── Attendance/               # AttendanceLog, PayrollRecord
    │       ├── Reminders/                # Reminder (Quran / Dhikr banner)
    │       └── Ai/                       # AiAuditLog
    │
    ├── Persistence/                      # ── INFRASTRUCTURE (data)
    │   ├── ApplicationDbContext.cs       # DbSets, global soft-delete filter, decimal(18,2) convention
    │   ├── Configurations/<Module>/      # IEntityTypeConfiguration<T>, auto-applied via
    │   │                                 #   ApplyConfigurationsFromAssembly
    │   └── Seed/DataSeeder.cs            # PermissionCodes constants, roles, admin user, Warehouse Id=1,
    │                                     #   Products.csv, Reminders.csv
    ├── Migrations/                       # EF Core migrations (auto-applied at startup)
    │
    ├── Services/                         # ── APPLICATION LAYER (business logic, one folder per module)
    │   ├── Auth/ Catalog/ Customers/ Identity/ Inventory/ Purchasing/ Sales/
    │   ├── Attendance/                   # AttendanceService, VoiceVerificationService
    │   ├── Payments/                     # PaymobService + PaymobOptions
    │   ├── Email/                        # Brevo/MailKit EmailService
    │   ├── Reminders/
    │   └── Ai/                           # AiAssistantService, VoiceCommandService,
    │       ├── Tools/                    #   IAiTool implementations + AiToolRegistry
    │       └── Files/                    #   AiFileProcessingService (multimodal uploads)
    │
    ├── DTOs/<Module>/                    # request/response contracts, mirrors Services/ folders
    ├── Controllers/                      # ── API LAYER, thin: validate → call service → return
    ├── Authorization/                    # PermissionPolicyProvider, PermissionAuthorizationHandler,
    │                                     #   PermissionRequirement
    ├── Middleware/ExceptionHandlingMiddleware.cs
    ├── Common/
    │   ├── Settings/                     # JwtSettings, EmailSettings, GeminiSettings (IOptions pattern)
    │   ├── Helpers/SlugHelper.cs
    │   └── Exceptions/AppExceptions.cs   # NotFoundException, BadRequestException
    └── wwwroot/uploads/ , uploads/       # static files; /uploads is mapped to ContentRoot/uploads
```

**Dependency direction (must never be violated):**
`Controllers → Services → Persistence(DbContext) → Domain`. `Domain` depends on nothing.
Controllers must **not** inject `ApplicationDbContext` in new code (some legacy controllers such as
`MaintenanceController` and `ExpensesController` still do — treat those as debt to refactor).

### 2.2 Frontend — `IbnAlZumar-Frontend`

```
src/
├── main.jsx                 # providers: Auth, Theme, Language, Router (basename = import.meta.env.BASE_URL)
├── App.jsx                  # ★ ALL routes in one file, grouped: storefront / auth / pos / moderator / admin
├── index.css                # Tailwind layers + global RTL rules
│
├── api/                     # ONE module per backend area; only these files may call axios
│   ├── axiosInstance.js     # baseURL from config, JWT injection, 401 → clear session + redirect,
│   │                        #   normalizes errors to { statusCode, message, errors, traceId }
│   ├── adminApi.js  moderatorApi.js  storefrontApi.js  userApi.js
│   ├── inventoryApi.js  purchasingApi.js  reportsApi.js  attendanceApi.js
│   └── AiApi.js  reminders.js
├── config/apiConfig.js      # getApiBaseUrl() / getApiOrigin() — dev: https://localhost:7223/api
├── context/                 # AuthContext, CartContext, LanguageContext (ar/en + dir), ThemeContext,
│                            #   StorefrontSearchContext
├── routes/                  # AdminRoute, ModeratorRoute, CashierRoute, CustomerRoute (role gates)
├── components/
│   ├── layout/              # DashboardLayout, StorefrontLayout, Navbar, Sidebar
│   ├── auth/                # ProtectedRoute, RoleGuard, Register/Verify/Reset pages
│   ├── ui/                  # Card, StatCard, EmptyState, Pagination, ReminderBanner (design-system atoms)
│   ├── storefront/  operations/  Purchasing/  profile/  ai/
├── pages/<Area>/            # Shop, Pos, Catalog, Products, Inventory, Customers, Purchasing,
│                            #   Reports, Operations, Owner, Moderator, admin, Dashboard, Profile, Login
├── hooks/                   # useAutoSync, useOnlineStatus, useOperationsHub
├── services/syncService.js  # offline → /api/orders/sync batch push
├── db/db.js                 # Dexie 'IbnAlZumarDB': transactions(++id, syncStatus, createdAt, clientUuid),
│                            #   products(id, name)
├── validators/              # Zod schemas (productSchema, customerSchema…) + XSS sanitizer
├── utils/                   # printInvoice.js (print engine), roles.js, auth.js, secureStorage.js
│                            #   (crypto-js encrypted auth), mediaUrl.js, imageHelper.js, catalog.js,
│                            #   audioToWav.js, serviceWorker.js
└── constants/maintenance.js
```

**Frontend layering rule:** `pages` compose `components`; **only `src/api/*` performs network I/O**;
domain/format helpers live in `utils`; cross-cutting state lives in `context`. A component must never
import `axios` directly.

---

## 3. Domain Entities & Relations

All persisted entities (except `ShippingZone`, `Reminder`, `AiAuditLog`, and the join tables) inherit:

```csharp
public abstract class BaseEntity          // IbnAlZumar.Domain.Common
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;   // global query filter → soft delete only
}
```

Conventions: `decimal` is globally `decimal(18,2)`; soft delete is enforced by a global query filter —
**never hard-delete**; money is EGP; all timestamps are **UTC**.

### 3.1 Catalog `[IMPL]`

| Entity | Key fields | Relations |
|---|---|---|
| `Category` | `Name`, `NameAr`, `Slug`, `Description`, `ParentCategoryId` | self-referencing tree; `1—* Product` |
| `Brand` | `Name`, `LogoUrl` | `1—* Product` |
| `Product` | `SKU`, `Barcode`, `Name`, `NameAr`, `Description`, `SellingPrice`, `CurrentCostPrice`, `QuantityPerCarton`, `MinStockThreshold` (default 5), `IsActive`, `TrackInventory`, `ImageUrl` | `*—1 Category`, `*—1 Brand`, `1—* ProductImage`, `1—* ProductAttributeValue`, `1—* ProductStock`, `1—* ProductVariant`, `1—* OrderItem`, `1—* PurchaseOrderItem` |
| `ProductVariant` | `SKU`, `Price`, `StockQuantity`, `Color`, `Finish`, `Material`, `IsActive` | `*—1 Product` |
| `ProductImage` | `ImageUrl`, `IsPrimary`, `DisplayOrder` | `*—1 Product` |
| `ProductAttributeDefinition` | `Name`, `Unit`, `DataType` (`AttributeDataType`) | `1—* ProductAttributeValue` |
| `ProductAttributeValue` | `Value` (string, parsed per `DataType`) | `*—1 Product`, `*—1 ProductAttributeDefinition` |

> `ProductVariant.StockQuantity` is **denormalized** and independent of `ProductStock`. Variant-level
> warehouse stock is `[PLANNED]`.

### 3.2 Inventory / Warehousing

| Entity | Status | Notes |
|---|---|---|
| `Warehouse` | `[IMPL]` | `Name`, `Address`, `IsMainWarehouse`, `IsActive`. Seeded row **Id = 1 ("Main Warehouse")** — always safe to reference as the default. |
| `ProductStock` | `[IMPL]` | One row per `(ProductId, WarehouseId)` (unique composite index): `QuantityOnHand`, `ReorderLevel`, `LastRestockedAt`. |
| `InventoryTransaction` | `[IMPL]` | **Append-only ledger.** `TransactionType`, signed `QuantityChange`, loose polymorphic `ReferenceType`/`ReferenceId` ("Order", "PurchaseOrder", "StockTransfer"), `TransactionDate`, `Notes`. **Invariant: never mutate `ProductStock.QuantityOnHand` without writing a matching transaction row in the same EF transaction.** |
| `StockTransfer` / `StockTransferItem` | `[IMPL]` | Source/destination warehouse, `StockTransferStatus`, items. |
| **3-tier warehouse hierarchy** | `[PLANNED]` | Target model: `Warehouse.Tier` enum `WarehouseTier { MainStore = 1, Branch = 2, ShopFloor = 3 }` + `ParentWarehouseId` self-reference, so stock flows `MainStore → Branch → ShopFloor` via `StockTransfer`. Implement by **adding columns to the existing `Warehouse`**, not a new entity. |
| `ProductBatch` | `[PLANNED]` | `ProductId`, `BatchNumber`, `WarehouseId`, `QuantityOnHand`, `CostPrice`, `ManufactureDate`, `ExpiryDate`, `SupplierId?`. Consumed FEFO (first-expiry-first-out) on sale; drives the Expiry Alert job (§5.2). `OrderItem`/`PurchaseOrderItem` gain an optional `ProductBatchId`. |
| `UnitConversion` | `[PLANNED]` | `ProductId`, `FromUnit`, `ToUnit`, `Factor` (decimal 18,4), `IsBaseUnit`. Replaces the flat `Product.QuantityPerCarton` for piece/box/carton/meter selling. All stock is stored in the **base unit**; conversion happens at the POS/DTO boundary only. |

### 3.3 Sales & POS

| Entity | Status | Notes |
|---|---|---|
| `Customer` | `[IMPL]` | `FullName`, `Phone`, `Email`, `Address`, `Governorate`, `IsRegistered`, `CreditLimit`, `CurrentBalance` (positive = customer owes the store, "الشكك"). |
| `Order` | `[IMPL]` | Single table serving **both** online orders and in-store POS sales; disambiguated by `Source` (`OrderSource.Online/InStore`), `CashierUserId`, `PaymentMethod`. Fields: `ClientUuid` (offline idempotency key, unique filtered index), `OrderNumber`, `CustomerId?` / `GuestName` / `GuestPhone`, `Status`, `PaymentStatus`, `PaymobOrderId`, `PaymobTransactionId`, `WarehouseId`, `OrderDate`, `ShippingAddress`, `DeliveryGovernorate`, `ShippingZoneId?`, custom-zone request fields, `SubTotal`, `DiscountType`/`DiscountValue`/`DiscountAmount`, `TotalAmount`, `Notes`, `CancellationReason`. |
| `OrderItem` | `[IMPL]` | `ProductId`, `Quantity`, `UnitPrice`, per-line `DiscountType`/`DiscountValue`/`DiscountAmount`, `LineTotal`. |
| `Payment` | `[IMPL]` | Settles an order **or** stands alone as a debt collection (`OrderId` null + `CustomerId` set). `Amount`, `Method`, `Status`, `PaymobTransactionId`, `PaymentDate`, `ReceivedByUserId`. |
| `CustomerLedgerEntry` | `[IMPL]` | Append-only debt ledger: `LedgerTransactionType`, positive `Amount`, `RunningBalance` snapshot, `RelatedOrderId`, `RelatedPaymentId`. |
| `ShippingZone` | `[IMPL]` | `Name`, `Governorate`, `ShippingCost`, `ShippingFee`, `EstimatedDays`, `IsActive`. Does **not** inherit `BaseEntity`. |
| **Invoice** | `[PARTIAL]` | There is **no `Invoice` entity**. An "invoice" today = an `Order` rendered by the frontend print engine (`printInvoice.js`) or exported by `InvoiceToExcelService`. If a fiscal/sequential invoice document is required, add `Invoice { InvoiceNumber, OrderId, IssuedAt, IssuedByUserId, TaxAmount, TotalAmount, PrintFormat }` — `[PLANNED]`. |
| **`PricingTier`** | `[PLANNED]` | Today `Product.SellingPrice` is a single price and `ProductVariant.Price` overrides it. Target: `enum PricingTierType { Retail = 1, Wholesale = 2, FirstWholesale = 3 }` + `ProductPrice { ProductId, ProductVariantId?, Tier, Price, MinQuantity }`; `Customer.DefaultPricingTier`; `Order.PricingTier` captured at sale time and `OrderItem.UnitPrice` resolved from it. Never re-resolve the price of a historical order. |
| **`POSShift`** | `[PLANNED]` | `CashierUserId`, `WarehouseId`, `OpenedAt`, `ClosedAt?`, `OpeningFloat`, `ExpectedCash`, `CountedCash`, `Variance`, `Status { Open, Closed }`. Every POS `Order` and `Payment` gains `POSShiftId`; closing a shift produces a Z-report (A5/thermal print). |

#### Enums (`Domain/Enums/Enums.cs`) `[IMPL]`

```csharp
OrderSource      { Online = 1, InStore = 2 }
OrderStatus      { PendingConfirmation=1, Confirmed=2, Processing=3, ReadyForPickup=4, OutForDelivery=5,
                   Delivered=6, Completed=7, Cancelled=8, Returned=9, Shipped=10, CancellationRequested=11 }
PaymentMethod    { CashOnDelivery=1, Cash=2, CreditCard=3, InstaPay=4, Fawry=5, CustomerCredit=6, Wallet=7 }
PaymentStatus    { Pending=1, Paid=2, Failed=3, CodPending=4 }
DiscountType     { None=0, Percentage=1, FixedAmount=2 }
LedgerTransactionType        { SaleOnCredit=1, PaymentReceived=2, ManualAdjustment=3 }
InventoryTransactionType     { PurchaseReceived/Purchase=1, SaleDeducted/Sale=2, TransferOut=3, TransferIn=4,
                               AdjustmentIncrease/Adjustment=5, AdjustmentDecrease=6, CustomerReturn/Return=7,
                               SupplierReturn=8 }          // duplicate names are intentional aliases
StockTransferStatus          { Requested=1, InTransit=2, Completed=3, Cancelled=4 }
PurchaseOrderStatus          { Draft=1, Ordered=2, PartiallyReceived=3, Received=4, Cancelled=5 }
SupplierPaymentMethod        { Cash=1, BankTransfer=2, Cheque=3 }
SupplierLedgerTransactionType{ PurchaseInvoice=1, Payment=2, Adjustment=3, Refund=4 }
AttributeDataType            { Text=1, Number=2, Boolean=3 }
ReminderType                 { Quran=1, Dhikr=2 }
MaintenanceStatus            { Pending=1, Priced=2, Approved=3, Rejected=4, Completed=5 }
DeliveryMethod               { CustomerDropOff=1, CompanyPickup=2 }
CustomZoneRequestStatus      { None=0, Pending=1, Approved=2, Rejected=3 }
AttendanceStatus             { CheckedIn=1, CheckedOut=2, LeftEarlyWithIssue=3 }   // Entities/Attendance
AttendanceVerificationMethod { Voice=1, AdminManual=2 }                            // Entities/Attendance
```

> **`ApplePay` does not exist** in `PaymentMethod`. Card/InstaPay/Wallet/Fawry are all routed through
> **Paymob**. Adding Apple Pay = append `ApplePay = 8` (never renumber existing members) + a Paymob
> integration id. Enum values are persisted as `int` — **renumbering is a breaking data change.**

### 3.4 Maintenance

| Entity | Status | Notes |
|---|---|---|
| `MaintenanceRequest` | `[IMPL]` | Namespace `IbnAlZumar.Domain.Entities.Maintenance`, DbSet `MaintenanceRequests`. Fields: `CustomerId?`, `UserId?`, `ProblemDescription`, `ImageUrl`, `ImageUrlsJson` (+ `[NotMapped] List<string> ImageUrls`), `DeliveryMethod`, `Status` (`MaintenanceStatus`), `EstimatedPrice?`, `ScheduledDate?`, `AdminNotes`, `MaintenanceReportUrl`. Images upload to `ContentRoot/uploads/maintenance`. |
| **`MaintenanceTicket` + 50 EGP inspection fee** | `[PLANNED]` | The current entity has **no fee logic**. Target rules, to implement on top of `MaintenanceRequest` (rename to `MaintenanceTicket` only with an explicit migration): <br>• `InspectionFee` decimal, **default 50.00 EGP**, sourced from a config constant `MaintenanceSettings.InspectionFee` — never hard-code `50m` in more than one place.<br>• `InspectionFeePaid` bool + `InspectionFeePaymentId?` → a real `Payment` row is created **upfront at ticket intake**; a ticket cannot leave `Pending` until it is paid.<br>• On `Approved`, the paid inspection fee is **deducted from the final repair invoice** (`Order.DiscountAmount` or an explicit `InspectionFeeCredit` line).<br>• On `Rejected`/customer-declines, the fee is **non-refundable** and stays booked as revenue.<br>• All fee movements go through `Payment` + (if unpaid) `CustomerLedgerEntry` — no ad-hoc money fields. |

### 3.5 Identity & RBAC `[IMPL]`

`User` (`FullName`, `Username`, `Email`, `PasswordHash`, `IsActive`, `LastLoginAt`, email/phone OTP
verification fields, `PendingEmail*`, `PendingPhone*`, `HourlyRate`, `VoiceEmbedding` JSON,
`VoiceEnrolledAtUtc`, `VoiceEnrolledByUserId`) — `*—* Role` via `UserRole`, `*—* Permission` via
`UserPermission` (with `IsGranted` for per-user overrides).
`Role` `*—* Permission` via `RolePermission`.
`Permission { Code, Name, Module, Description }` — codes are the constants in
`Persistence/Seed/DataSeeder.PermissionCodes`:

```
Products.View|Create|Edit|Delete · Categories.Manage
Inventory.View|Adjust|Transfer
Purchasing.View|Create|Approve
Orders.View|Create|Edit|Cancel
Customers.View|Manage|ManageDebt
Users.Manage · Roles.Manage · Permissions.Manage · Reports.View
```

Frontend role names (`src/utils/roles.js`, with alias normalization):
`SUPER ADMIN > STORE_OWNER > ADMIN > ONLINE_MANAGER > MODERATOR > CASHIER > CUSTOMER`.

### 3.6 Purchasing & Supplier accounting `[IMPL]`

`Supplier` (`Name`, `ContactPerson`, `Phone`, `Email`, `Address`, `TaxId`, `CurrentBalance` = payable)
→ `PurchaseOrder` (`PurchaseOrderNumber`, `SupplierId`, `WarehouseId`, `Status`, `OrderDate`,
`ExpectedDeliveryDate`, `ReceivedDate`, `TotalCost`) → `PurchaseOrderItem` (`QuantityOrdered`,
`QuantityReceived`, `UnitCostPrice`, `LineTotal` — historical cost source for margin reporting).
`SupplierPayment` (`Amount`, `SupplierPaymentMethod`, optional `PurchaseOrderId`, `CreatedByUserId`) and
`SupplierLedgerEntry` (signed `Amount`, `RunningBalance`, related PO/payment) form the statement of
account. **Receiving a PO (`Status → Received`) must, in one transaction:** increase `ProductStock`,
write `InventoryTransaction` rows, update `Product.CurrentCostPrice`, and write a `PurchaseInvoice`
ledger entry.

### 3.7 Finance & HR

| Entity | Status | Notes |
|---|---|---|
| `AttendanceLog` | `[IMPL]` | `UserId`, `CheckInTime`, `CheckOutTime?`, `AttendanceStatus`, `VerificationMethod` (**Voice** biometric or AdminManual), `WorkedMinutes`, `WorkedHours`, `Notes`. Index `(UserId, CheckInTime)`. |
| `PayrollRecord` | `[IMPL]` | `UserId`, `PeriodStart`, `PeriodEnd`, `TotalHours`, `TotalSalary` (= hours × `User.HourlyRate`), `IsPaid`, `PaymentDate`. |
| **QR attendance** | `[PLANNED]` | Current check-in is **voice-embedding based** (Hugging Face ECAPA, §5.1), *not* QR. Target: add `AttendanceVerificationMethod.Qr = 3`, a rotating signed QR token per branch (`WarehouseId` + HMAC + 30 s TTL) validated server-side, and `AttendanceLog.WarehouseId`. Keep voice as a fallback — do not remove it. |
| `Expense` | `[PARTIAL]` | `ExpensesController` exists but its body is a **`TODO` stub with the persistence commented out** — there is no `Expense` entity or DbSet. Implement `Expense { Amount, Category, Notes, IncurredAt, CreatedByUserId, POSShiftId? }` before wiring the UI. |
| `PaymentVoucher` | `[PLANNED]` | Outgoing cash document: `VoucherNumber`, `Type { Receipt = 1, Payment = 2 }`, `Amount`, `PartyType { Customer, Supplier, Employee, Other }`, `PartyId`, `Method`, `IssuedAt`, `IssuedByUserId`, `Notes`, `RelatedChequeId?`. Prints on A5. |
| `Cheque` | `[PLANNED]` | `ChequeNumber`, `BankName`, `Amount`, `IssueDate`, `DueDate`, `Direction { Incoming, Outgoing }`, `Status { Pending, Deposited, Cleared, Bounced, Cancelled }`, `PartyType`/`PartyId`, `RelatedSupplierPaymentId?`. `SupplierPaymentMethod.Cheque` already exists and must link here. Feeds the Cheque Due Alert job. |
| `Installment` | `[PLANNED]` | `CustomerId`, `OrderId`, `PlanTotal`, `DownPayment`, `InstallmentCount`, then `InstallmentSchedule { InstallmentId, SequenceNo, DueDate, Amount, PaidAmount, PaidAt?, Status }`. Each payment writes a `Payment` + `CustomerLedgerEntry` — the ledger stays the single source of debt truth. |
| `CommissionConfig` | `[PLANNED]` | `Scope { Global, Role, User, Category, Product }`, `ScopeId?`, `CalculationType { PercentOfSale, PercentOfProfit, FixedPerUnit }`, `Rate`, `EffectiveFrom`, `EffectiveTo?`. Resolution order: Product → Category → User → Role → Global. |
| `EmployeeTarget` | `[PLANNED]` | `UserId`, `PeriodStart`, `PeriodEnd`, `TargetType { SalesAmount, Profit, UnitsSold }`, `TargetValue`, `AchievedValue` (recomputed by a Quartz job), `BonusRate`. |
| `EmployeeAdvance` | `[PLANNED]` | `UserId`, `Amount`, `RequestedAt`, `ApprovedByUserId?`, `Status { Pending, Approved, Rejected, Settled }`, `DeductionPlan` (installments against `PayrollRecord`), `SettledAt?`. |
| `LeaveRequest` | `[PLANNED]` | `UserId`, `LeaveType { Annual, Sick, Unpaid, Emergency }`, `FromDate`, `ToDate`, `DaysCount`, `Reason`, `Status { Pending, Approved, Rejected }`, `DecidedByUserId?`, `DecidedAt?`. Approved unpaid leave must reduce `PayrollRecord.TotalHours`. |

### 3.8 Cross-cutting entities `[IMPL]`

* `Reminder` — Quran ayah / dhikr shown in the global `ReminderBanner`; seeded from `Reminders.csv`.
* `AiAuditLog` — every AI assistant call: `UserId`, `UserEmail`, `Roles`, `Action`, `Prompt`,
  `ToolName`, `Succeeded`, `Error`, `MetadataJson`, `IpAddress`, `TimestampUtc` (indexed). `long Id`,
  does not inherit `BaseEntity`.

### 3.9 Relationship map (text ERD)

```
Category ─┬─< Category (self)                 Supplier ─< PurchaseOrder ─< PurchaseOrderItem >─ Product
          └─< Product >─ Brand                Supplier ─< SupplierPayment ─< SupplierLedgerEntry
Product ─< ProductVariant                     Warehouse ─< ProductStock >─ Product
Product ─< ProductImage                       Warehouse ─< InventoryTransaction >─ Product
Product ─< ProductAttributeValue >─ ProductAttributeDefinition
Warehouse ─< StockTransfer(Source/Destination) ─< StockTransferItem >─ Product

Customer ─< Order ─< OrderItem >─ Product     User ─< AttendanceLog
Customer ─< Payment >─ Order                  User ─< PayrollRecord
Customer ─< CustomerLedgerEntry >─ Order/Payment
Order >─ Warehouse ; Order >─ User (cashier) ; Order >─ ShippingZone
Customer ─< MaintenanceRequest >─ User
User >─< Role >─< Permission ; User >─< Permission (override)
```

---

## 4. Coding & Design Standards

### 4.1 C# naming & style `[IMPL convention]`

* `PascalCase`: classes, records, methods, properties, enums & members, constants.
  `camelCase`: locals & parameters. `_camelCase`: private readonly fields.
* Interfaces prefixed `I` and placed **beside** the implementation (`Services/Sales/IOrderService.cs`).
* Namespaces are **file-scoped** and mirror folders, rooted at `IbnAlZumar.*`.
  ⚠ The codebase currently mixes `IbnAlZumar.API.*` and `IbnAlZumar.Api.*` casing. **New code must use
  `IbnAlZumar.API.*`**; do not mass-rename existing namespaces in a feature PR.
* Nullable reference types are on: use `?`, `= string.Empty`, and `= null!` for required navigations.
* All I/O is `async`/`await` with the `Async` suffix and a `CancellationToken` where practical.
* Arabic inline comments are accepted and common — keep them, and **keep identifiers English-only**.
* One enum file (`Domain/Enums/Enums.cs`) for domain enums; entity-local enums may live with the entity
  (e.g. `AttendanceStatus`).

### 4.2 Entity rules

* Inherit `BaseEntity`; never expose a public setter that bypasses the ledger invariants.
* Annotate with `[Required]`, `[MaxLength]`, `[Column(TypeName = "decimal(18,2)")]` where the global
  convention is not enough; anything more complex belongs in an `IEntityTypeConfiguration<T>` under
  `Persistence/Configurations/<Module>/` (auto-discovered by `ApplyConfigurationsFromAssembly`).
* Collections initialize to `new List<T>()`.
* Deletes are **soft** (`IsDeleted = true`); use `IgnoreQueryFilters()` deliberately and rarely.
* Money: `decimal` only — never `double`/`float`.

### 4.3 DTO rules

* Location `DTOs/<Module>/`, namespace `IbnAlZumar.API.DTOs.<Module>`.
* Naming: `Create<X>Dto`, `Update<X>Dto`, `<X>ResponseDto` (or `<X>Dto` for read models),
  `<X>FilterDto`, `PagedResultDto<T>`, `BulkImportResultDto`.
* **Entities never cross the HTTP boundary** — controllers accept and return DTOs only.
* Paged endpoints return `PagedResultDto<T>`; filters bind from query via `<X>FilterDto`.
* Errors always use `ApiErrorResponse { StatusCode, Message, TraceId, Errors, TimestampUtc }`
  (camelCase JSON) produced by `ExceptionHandlingMiddleware`.
* File uploads use `[FromForm]` + `IFormFile` with `[Consumes("multipart/form-data")]`.

### 4.4 Validation

* **Today `[PARTIAL]`:** DataAnnotations on DTOs + explicit guard clauses throwing
  `BadRequestException` / `NotFoundException` in services.
* **Target `[PLANNED]` FluentValidation pattern** (the packages are already referenced):
  one validator per write DTO, `Validators/<Module>/<Dto>Validator.cs`,
  `public sealed class CreateProductDtoValidator : AbstractValidator<CreateProductDto>`, registered by
  `builder.Services.AddValidatorsFromAssemblyContaining<Program>()`, messages **bilingual (Arabic
  primary)**, and cross-entity/uniqueness checks (e.g. duplicate SKU) stay in the **service**, not the
  validator.

### 4.5 Service / repository / CQRS rules

* **There is no repository layer and no MediatR/CQRS today.** Services depend directly on
  `ApplicationDbContext`. **Do not introduce a generic `IRepository<T>`** — EF `DbSet` already is one.
* Every module exposes `I<Module>Service` + `<Module>Service`, registered `AddScoped` in `Program.cs`.
* A service method: validate → load with explicit `Include`s → mutate → persist all related writes in a
  **single `SaveChangesAsync`** (use an explicit transaction when several aggregates move, e.g. order
  checkout: stock + ledger + payment).
* Read queries are `AsNoTracking()` and project to DTOs with `Select` (avoid loading full graphs).
* Throw `NotFoundException` / `BadRequestException` instead of returning `null` or `IActionResult` from
  services.
* **Controllers stay thin**: `[ApiController]`, `[Route("api/[controller]")]`,
  `[Authorize(Policy = PermissionCodes.X)]`, constructor-inject the service (not the DbContext),
  return `Ok(dto)` / `CreatedAtAction` / `NoContent`.
* If CQRS is ever adopted, do it **per module** behind the existing `I<Module>Service` interfaces —
  never a big-bang refactor.

### 4.6 React component rules

* Function components + hooks only; one component per file, `PascalCase.jsx`, default export.
* Hooks in `src/hooks` named `use*`; shared state via context providers in `src/context`.
* **All network calls go through `src/api/*` modules using the shared `axiosInstance`.** Never call
  `fetch`/`axios` from a component. Errors arrive pre-normalized as
  `{ statusCode, message, errors, traceId }`.
* Every list screen handles the four states explicitly: loading, error, empty (`<EmptyState />`), data.
* Reuse `src/components/ui` atoms (`Card`, `StatCard`, `EmptyState`, `Pagination`) before writing new
  markup.
* Validate user input with the Zod schemas in `src/validators` (they also sanitize XSS) before POSTing.
* Auth tokens are read/written **only** through `utils/secureStorage.js` (crypto-js encrypted) and
  `utils/auth.js` — never touch `localStorage` directly.
* Role gating: wrap routes in `AdminRoute` / `ModeratorRoute` / `CashierRoute` / `CustomerRoute` or
  `<ProtectedRoute allowRoles={[...]}>`; normalize role strings with `normalizeRole()`.
* New routes are declared in `src/App.jsx` inside the correct group; the router basename is
  `import.meta.env.BASE_URL` (`/IbnAlZumar-Frontend/`) — **always use relative router paths**, never
  hard-coded absolute URLs.

### 4.7 Tailwind & RTL styling rules

* Use the theme tokens from `tailwind.config.js`, not raw hex:
  `canvas #F4F5F7` (app bg), `surface #FFFFFF`, `border #E2E4E9`, `ink` / `ink-soft`,
  `graphite-950/900/800/700` (sidebar & dark surfaces), **`amber #F2A900` (signature accent)**,
  `amber-dark #C98900`, `success #1D9A6C`, `danger #D64545`, `info #2F6FED`, shadow `subtle`.
* Fonts: `font-display` (Space Grotesk), `font-body` (IBM Plex Sans / Cairo), `font-arabic` (Cairo),
  `font-mono` (JetBrains Mono).
* **RTL first.** `LanguageContext` sets `<html lang dir>`. Use logical utilities (`ms-*`, `me-*`,
  `ps-*`, `pe-*`, `text-start`, `text-end`) instead of `ml-*`/`mr-*`/`text-left`/`text-right`.
* Utility-first inline classes; no CSS modules or styled-components. Long class lists may be extracted
  to a local `const classes = {...}` map in the same file.
* Arabic numerals/dates: format with `toLocaleDateString('ar-EG', …)` for display; **send ISO UTC** to
  the API.

### 4.8 Print engine rules

Current implementation `[IMPL]`: `src/utils/printInvoice.js` opens a `window.open` document, builds an
HTML invoice string (**every interpolated value must pass through the local `escapeHtml`**), and calls
`window.print()`; PDF export uses `html2pdf.js`/`html2canvas`, Excel export uses `xlsx` client-side and
`ClosedXML` (`InvoiceToExcelService`) server-side.

Target rules for the unified print engine `[PLANNED]` — implement as
`src/utils/print/` with one renderer per format and a shared header/footer:

| Format | Width | Use | Rules |
|---|---|---|---|
| **A4** | 210 × 297 mm | Full tax invoice, purchase order, supplier statement, reports | `@page { size: A4; margin: 12mm }`, full logo + tax data, itemized table with borders, totals block, signature area, page numbers on multi-page |
| **A5** | 148 × 210 mm | Delivery note, payment voucher, maintenance ticket, shift Z-report | `@page { size: A5; margin: 8mm }`, condensed header, no page footer |
| **Thermal 80 mm** | 80 mm roll, auto height | POS receipt | `@page { size: 80mm auto; margin: 0 }`, monospace `font-mono`, ≤ 42 chars/line, no borders/background colors, centered logo ≤ 200 px, QR/barcode of `OrderNumber` at the end, cut-line spacer |

Shared: RTL Arabic body with an English secondary line where relevant, `@media print { .no-print { display:none } }`,
**black on white only** (no `background-color` — thermal printers ignore it), prices formatted
`x.xx EGP`, every document shows `OrderNumber`/document number + UTC-to-Cairo local timestamp + the
issuing user.

### 4.9 Git & PR conventions

* Branches: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`. Small, focused PRs.
* Never commit secrets (see §9.3), `bin/`, `obj/`, `.vs/`, `node_modules/`, or `dist/`.
* Every schema change ships with an EF migration: `dotnet ef migrations add <Name>` from
  `Ibn al-Zumar.API/Ibn al-Zumar.API/`. Migrations are **auto-applied at startup** by
  `app.SeedDatabaseAsync()` — a bad migration breaks production boot.

---

## 5. System Integrations & Background Services

### 5.1 External integrations that exist today `[IMPL]`

| Integration | Where | Config section | Notes |
|---|---|---|---|
| **Paymob** (card / wallet / InstaPay / Fawry) | `Services/Payments/PaymobService.cs`, `PaymobOptions`, `PaymentsController` (`/api/payments`) | `Paymob` (`BaseUrl`, `ApiKey`, `IframeId`, `CardIntegrationId`, `WalletIntegrationId`, `InstaPayIntegrationId`, `HmacSecret`) | Typed `HttpClient`, 30 s timeout. Callback **must** be HMAC-verified; `Order.PaymobOrderId` / `PaymobTransactionId` link back. |
| **Google Gemini AI assistant** | `Services/Ai/*`, `AiController` (`/api/ai`) | `Gemini` (`ApiKey`, `Model` = `gemini-1.5-flash`, `BaseUrl`, `MaxToolCallIterations` = 5) | Tool-calling agent. Tools implement `IAiTool` and are registered as singletons in `AiToolRegistry`: `GetPendingOrders`, `GetOrderDetails`, `GetLowStockProducts`, `GetSalesSummary`, `UpdateProductPrice`, `GetCategories`, `CreateCategory`, `CreateProduct`, `BulkImportProducts`, `GenerateProductsExcel`. Every call is written to `AiAuditLog`; tool access is role-checked via `AiRoles`. **New AI capability = new `IAiTool` class + DI registration — never widen an existing tool.** |
| **Hugging Face voice biometrics** | `Services/Attendance/VoiceVerificationService.cs`, `Services/Ai/VoiceCommandService.cs` | `HuggingFace` (`ApiKey`, `VoiceModelUrl` = `speechbrain/spkrec-ecapa-voxceleb`) | Enrollment stores a JSON embedding in `User.VoiceEmbedding`; check-in compares cosine similarity. Frontend records via `utils/audioToWav.js`. |
| **Brevo email** (MailKit) | `Services/Email/EmailService.cs` | `Brevo:ApiKey` | OTP: email verification, password reset, email/phone change. |
| **Google OAuth login** | `AuthController`, `Google.Apis.Auth`; frontend `@react-oauth/google` | `VITE_GOOGLE_CLIENT_ID` | |
| **Azure SQL** | `ConnectionStrings:DefaultConnection`, or env `SQLAZURECONNSTR_DefaultConnection` / `DATABASE_URL` | | |

### 5.2 Planned integrations & background services `[PLANNED]`

**None of the following exist in the repository yet — there is currently no scheduler, no hosted
service, and no WhatsApp client.**

**a) WhatsApp API client** — `Services/Notifications/WhatsApp/`:
`IWhatsAppClient` + `WhatsAppCloudClient` (typed `HttpClient`, Meta Cloud API `/{phone-number-id}/messages`),
`WhatsAppOptions { BaseUrl, PhoneNumberId, AccessToken, DefaultLanguage = "ar" }` bound from config
section `WhatsApp`. Template-only sends: `order_confirmation`, `order_shipped`, `debt_reminder`,
`cheque_due`, `maintenance_ready`, `expiry_alert`. Rules: normalize Egyptian numbers to E.164
(`+20…`), never send to an unverified phone, persist every send in a `NotificationLog`
(`Channel { WhatsApp, Email, Sms }`, `Recipient`, `TemplateName`, `PayloadJson`, `Status`,
`ProviderMessageId`, `Error`, `SentAtUtc`), retry with exponential backoff, and keep the client
**transport-only** — message text/templating lives in `INotificationComposer`.

**b) Quartz.NET jobs** — add `Quartz` + `Quartz.Extensions.Hosting`, register in `Program.cs`, put jobs
in `Infrastructure/Jobs/`. Every job is `[DisallowConcurrentExecution]`, resolves a **scoped**
`IServiceScope` for the DbContext, is idempotent (guarded by a `NotificationLog`/`JobRun` record so a
re-run never double-notifies), logs start/finish, and reads its cron from config section `Quartz:Jobs`.

| Job | Default cron (Africa/Cairo) | Behaviour |
|---|---|---|
| `ProductExpiryAlertJob` | `0 0 7 * * ?` daily 07:00 | `ProductBatch.ExpiryDate <= today + N days` (config `ExpiryWarningDays`, default 30) → WhatsApp/email to inventory managers, grouped in one digest per warehouse |
| `ChequeDueAlertJob` | `0 15 7 * * ?` daily 07:15 | `Cheque.Status = Pending && DueDate <= today + 3 days` → alert owner/accountant; mark overdue cheques |
| `DebtReminderJob` | `0 0 10 ? * SUN` weekly Sun 10:00 | `Customer.CurrentBalance > 0` and no payment in `DebtReminderIdleDays` (default 14) → WhatsApp `debt_reminder` with the outstanding amount and last payment date |
| `EmployeeTargetRecalcJob` | `0 30 0 * * ?` nightly | Recompute `EmployeeTarget.AchievedValue` from orders in the period |
| `LowStockDigestJob` | `0 0 8 * * ?` daily | Products where `ProductStock.QuantityOnHand <= Product.MinStockThreshold` |

**c) Auto-translation helper (Ar/En)** — `Common/Helpers/TranslationHelper` + `ITranslationService`:
every bilingual entity already stores a pair (`Name`/`NameAr`, `Category.Name`/`NameAr`). Rules: when a
write DTO supplies only one side, fill the other via the translation provider **once, at create time**,
and flag it `IsAutoTranslated` so a human edit is never overwritten; translation is best-effort — a
provider failure must **never** fail the request; the resolved language comes from the
`Accept-Language` header (`ar` default), and the API returns both fields so the frontend
`LanguageContext` can switch instantly without a round trip.

### 5.3 Offline / PWA sync `[IMPL]`

POS writes go to Dexie (`transactions` store) with a client-generated `clientUuid`; `useAutoSync` +
`syncService.syncPendingTransactions()` push them as one batch to **`POST /api/orders/sync`**
(`SyncBatchRequestDto`). The server de-duplicates on `Order.ClientUuid` (unique filtered index) and
returns per-order `{ clientUuid, success, errorMessage }`; failures increment `retryCount` and are
retried up to 5 times. **Any new offline-capable write must follow this same idempotency-key pattern.**
API requests are `NetworkOnly` in the service worker — never cache API responses.

---

## 6. API Surface & Frontend Route Map

### 6.1 Controllers `[IMPL]`

| Route | Controller | Area |
|---|---|---|
| `/api/auth` | `AuthController` | login, register, Google login, email/phone OTP, password reset |
| `/api/users`, `/api/roles` | `UsersController`, `RolesController` | RBAC administration |
| `/api/products`, `/api/categories`, `/api/catalog` | `ProductsController`, `CategoriesController`, `CatalogController` | catalog CRUD, bulk Excel import |
| `/api/inventory` | `InventoryController` | stock levels, low-stock, adjust, transfer |
| `/api/orders` | `OrdersController` | order CRUD/status |
| `/api/orders/sync` | `SyncController` | offline batch sync |
| `/api/customers` | `CustomersController` | customers + debt ledger |
| `/api/payments` | `PaymentsController` | Paymob init + callback, manual payments |
| `/api/purchasing` | `PurchasingController` | suppliers, POs, supplier payments & ledger |
| `/api/maintenance` | `MaintenanceController` | maintenance requests (multipart image upload) |
| `/api/attendance`, `/api/payroll` | `AttendanceController`, `PayrollController` | voice check-in/out, payroll periods |
| `/api/expenses` | `ExpensesController` | **stub — not persisted** |
| `/api/reports`, `/api` (dashboard) | `ReportsController`, `DashboardController` | KPIs, sales/profit reports |
| `/api/shippingzones` | `ShippingZonesController` | zones + custom-zone requests |
| `/api/reminders` | `RemindersController` | Quran/dhikr banner content |
| `/api/ai` | `AiController`, `AiVoiceController` | assistant chat, tool calls, voice commands |

Conventions: all routes are `/api/[controller]` (lowercase in URLs), JWT in `Authorization: Bearer`,
JSON camelCase, errors as `ApiErrorResponse`, Swagger at `/swagger`.

### 6.2 Frontend routes `[IMPL]` (all declared in `src/App.jsx`)

* **Storefront (customer):** `/`, `/products/:productId`, `/cart`, `/checkout`, `/payment/success`,
  `/payment/failed`, `/profile`, `/orders/:orderId`
* **Auth:** `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`,
  `/admin/login`, `/admin/forbidden`
* **POS:** `/pos` (guarded by `CashierRoute`; also reachable at `/admin/pos`)
* **Moderator:** `/moderator{,/dashboard,/operations,/products,/categories,/reminders,/catalog,/profile}`
* **Admin:** `/admin/dashboard`, `/admin/operations`, `/admin/owner`, `/admin/catalog/products`,
  `/admin/catalog/categories`, `/admin/products/import`, `/admin/inventory/adjust`,
  `/admin/inventory/transfer`, `/admin/customers{,/:id}`, `/admin/purchasing`, `/admin/reports`,
  `/admin/reminders`, `/admin/payroll`, `/admin/profile`

---

## 7. Cross-Cutting Invariants (do not break)

1. **Soft delete only** — set `IsDeleted`; the global filter hides the row.
2. **Stock never moves without a ledger row** — `ProductStock` change ⇒ `InventoryTransaction`.
3. **Debt never moves without a ledger row** — `Customer.CurrentBalance` change ⇒
   `CustomerLedgerEntry` (same for `Supplier` ⇒ `SupplierLedgerEntry`), with `RunningBalance` written.
4. **Historical prices are frozen** — `OrderItem.UnitPrice`, `PurchaseOrderItem.UnitCostPrice` and
   discounts are captured at transaction time and never recomputed from the catalog.
5. **Idempotency for offline writes** — `ClientUuid` is the key; retries must be safe.
6. **Enum values are persisted ints** — append new members, never renumber or delete.
7. **UTC in the database**, Africa/Cairo only at the presentation layer.
8. **Permissions, not role-name string checks**, guard API endpoints (`[Authorize(Policy = "Orders.Create")]`);
   role names are a frontend UX convenience only.
9. **Money is `decimal`**, `decimal(18,2)`, EGP.
10. **Warehouse Id = 1 is always a valid default** (seeded Main Warehouse).

---

## 8. Definition of Done for any change

1. Domain change → entity + `IEntityTypeConfiguration` + **EF migration** + seed update if needed.
2. Service interface + implementation + DI registration in `Program.cs`.
3. DTOs (+ validators) and a thin controller with the right `[Authorize(Policy = …)]`.
4. `dotnet build` clean (no new warnings); backend runs and Swagger lists the endpoint.
5. Frontend: API module function → page/component → route in `App.jsx` → role guard → loading/error/empty
   states → Arabic + English labels → RTL-safe Tailwind classes.
6. `npm run build` passes.
7. No secrets added to source control; no new entity bypassing the invariants in §7.

---

## 9. Environments, Build & Operational Notes

### 9.1 Local development

```bash
# Backend
cd "Ibn al-Zumar.API/Ibn al-Zumar.API"
dotnet restore && dotnet run          # https://localhost:7223 — Swagger at /swagger
dotnet ef migrations add <Name>       # schema change
# Frontend
npm ci && npm run dev                 # http://localhost:5173 — proxies /api and /uploads to the API
```

### 9.2 Deployment

* **API:** Docker (`mcr.microsoft.com/dotnet/sdk:9.0` → `aspnet:9.0`, `EXPOSE 8080`, honours `PORT`) to
  Azure App Service (`francecentral`). Migrations + seeding run automatically at startup.
* **Frontend:** GitHub Actions → GitHub Pages, base path `/IbnAlZumar-Frontend/`,
  `VITE_API_URL` injected at build time.
* **CORS:** the API allows `https://kimo-25.github.io*` and `http://localhost*` with credentials.

### 9.3 ⚠ Secret hygiene (known issue — fix before any public release)

`Ibn al-Zumar.API/Ibn al-Zumar.API/appsettings.json` currently contains **real committed secrets**
(Azure SQL connection string with password, JWT signing key, Brevo, Hugging Face and Gemini API keys).
Any AI tool working in this repo must: **never echo these values**, never add new ones, and prefer
`dotnet user-secrets` / environment variables / Azure App Settings. Rotating these credentials and
stripping them from `appsettings.json` is an outstanding task.

---

## 10. Implementation Status Matrix (quick reference for AI tools)

| Area | Status |
|---|---|
| Catalog, variants, attributes, images, bulk Excel import | `[IMPL]` |
| Single-tier warehouse, stock, inventory ledger, transfers | `[IMPL]` |
| Orders (online + POS), order items, discounts, payments, customer debt ledger | `[IMPL]` |
| Paymob card/wallet/InstaPay/Fawry | `[IMPL]` |
| Purchasing, suppliers, supplier ledger & payments | `[IMPL]` |
| Dynamic RBAC (users/roles/permissions) + JWT | `[IMPL]` |
| Maintenance requests (no fee logic) | `[IMPL]` |
| Voice attendance + hourly payroll | `[IMPL]` |
| Gemini AI assistant + tool registry + audit log | `[IMPL]` |
| Offline POS queue + idempotent batch sync + PWA | `[IMPL]` |
| Invoice printing (HTML print window, PDF, Excel) | `[IMPL]` (unstructured; A4/A5/thermal engine `[PLANNED]`) |
| FluentValidation validators · Mapster mappings | `[PARTIAL]` (packages referenced, not used) |
| Expenses | `[PARTIAL]` (controller stub, no entity) |
| Invoice entity, PricingTier (Retail/Wholesale/FirstWholesale), POSShift | `[PLANNED]` |
| ProductBatch (expiry), UnitConversion, 3-tier warehouses | `[PLANNED]` |
| MaintenanceTicket 50 EGP inspection-fee workflow | `[PLANNED]` |
| PaymentVoucher, Cheque, Installment | `[PLANNED]` |
| CommissionConfig, EmployeeTarget, EmployeeAdvance, LeaveRequest, QR attendance | `[PLANNED]` |
| WhatsApp client, Quartz.NET jobs, auto-translation helper, NotificationLog | `[PLANNED]` |
| PostgreSQL provider support, automated tests, CI for the API | `[PLANNED]` |

---

## 11. Prompting Rules for AI Coding Tools

1. Read §10 first. If the feature is `[PLANNED]`, you are creating it from scratch — follow the exact
   entity/field names given here so future prompts stay consistent.
2. Put files in the folders of §2. Never create a new top-level layer/project without being asked.
3. Respect the invariants in §7 — especially ledger writes, soft delete, and frozen historical prices.
4. Any schema change **must** include an EF Core migration.
5. Produce bilingual (Arabic-primary, RTL-safe) user-facing text on both API validation messages and UI.
6. Do not add dependencies that are already covered by the existing stack (no MediatR, AutoMapper,
   Redux, TypeScript migration, or a repository layer unless explicitly requested).
7. Do not print, log, or commit secrets; assume §9.3 credentials are compromised and being rotated.
8. When you are unsure whether something exists, **grep the repo** — do not assume.
