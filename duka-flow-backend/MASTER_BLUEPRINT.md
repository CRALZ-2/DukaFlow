Oui. Voici le fichier unique et définitif que tu dois créer dans la racine de ton projet vide. Copie-colle tout le contenu ci-dessous dans un fichier nommé MASTER_BLUEPRINT.md. Ce fichier servira de source de vérité pour toi, pour Claude AI Opus, et pour chaque phase du projet.
markdown
# 📘 MASTER BLUEPRINT — Shop Management System (Backend)
**Version:** 1.0.0
**Tech Stack:** Node.js + Express + Prisma ORM + MySQL
**Architecture:** Strict MVC + Service Layer + Middleware Guards
**Purpose:** Single reference document for structuring, validating, and executing the backend. Feed this to Claude AI Opus phase-by-phase.

---

## 📁 1. EXACT FOLDER STRUCTURE
*(Create this exact tree in your empty project root)*
shop-management-backend/
├── server.js
├── .env.example
├── .gitignore
├── package.json
├── MASTER_BLUEPRINT.md
├── prisma/
│ ├── schema.prisma
│ ├── seed.js
│ └── migrations/
├── uploads/
│ ├── logos/
│ ├── products/
│ └── receipts/
└── src/
├── app.js
├── config/
│ ├── database.js
│ └── constants.js
├── routes/
│ ├── index.js
│ ├── auth.routes.js
│ ├── onboarding.routes.js
│ ├── product.routes.js
│ ├── sale.routes.js
│ ├── expense.routes.js
│ ├── dashboard.routes.js
│ ├── report.routes.js
│ ├── settings.routes.js
│ ├── employee.routes.js
│ └── admin/
│ ├── admin.routes.js
│ ├── adminShops.routes.js
│ ├── adminAgents.routes.js
│ └── adminAnalytics.routes.js
├── middlewares/
│ ├── authenticate.js
│ ├── authorize.js
│ ├── validate.js
│ ├── upload.js
│ └── errorHandler.js
├── controllers/
│ ├── auth.controller.js
│ ├── onboarding.controller.js
│ ├── product.controller.js
│ ├── stock.controller.js
│ ├── sale.controller.js
│ ├── expense.controller.js
│ ├── dashboard.controller.js
│ ├── report.controller.js
│ ├── settings.controller.js
│ ├── employee.controller.js
│ └── admin/
│ ├── admin.controller.js
│ ├── adminShops.controller.js
│ ├── adminAgents.controller.js
│ └── adminAnalytics.controller.js
├── services/
│ ├── auth.service.js
│ ├── onboarding.service.js
│ ├── product.service.js
│ ├── stock.service.js
│ ├── sale.service.js
│ ├── expense.service.js
│ ├── dashboard.service.js
│ ├── report.service.js
│ ├── settings.service.js
│ ├── employee.service.js
│ └── admin/
│ ├── adminShops.service.js
│ ├── adminAgents.service.js
│ └── adminAnalytics.service.js
├── validators/
│ ├── auth.validator.js
│ ├── onboarding.validator.js
│ ├── product.validator.js
│ ├── sale.validator.js
│ ├── expense.validator.js
│ └── employee.validator.js
└── utils/
├── AppError.js
├── catchAsync.js
├── apiResponse.js
├── pagination.js
├── jwt.js
├── generateInvoiceNumber.js
└── permissions.js

---

## 📋 2. FILE-BY-FILE RESPONSIBILITIES
| File Path | Phase | Purpose | Core Rule |
|---|---|---|---|
| `server.js` | 0 | HTTP entry, DB connect, graceful shutdown | Mount `app.js`, listen on PORT, handle SIGTERM |
| `.env.example` | 0 | Env template | PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, UPLOAD_PATH, NODE_ENV |
| `.gitignore` | 0 | Ignore secrets & gen | `/node_modules, /.env, /uploads/*, /prisma/migrations, *.log` |
| `package.json` | 0 | Deps & scripts | `express, @prisma/client, prisma, cors, helmet, dotenv, express-validator, multer, bcryptjs, jsonwebtoken, uuid, morgan` |
| `prisma/schema.prisma` | 2+ | DB schema | Enums → standalone models → relational. Soft-delete on all major tables. |
| `prisma/seed.js` | 2 | Initial data | Seed currencies, categories, plans, superadmin |
| `src/config/constants.js` | 2 | Platform enums | ROLES, PERMISSIONS, SUBSCRIPTION_PLANS, CURRENCIES, FREE_PLAN_LIMITS |
| `src/config/database.js` | 0 | Prisma singleton | Export `prisma` instance with graceful disconnect |
| `src/app.js` | 0 | Express setup | Middleware order: cors → helmet → json → urlencoded → morgan → routes → errorHandler |
| `src/routes/index.js` | 0 | Router mount | Mount all feature routers under `/api/v1/` |
| `src/middlewares/authenticate.js` | 3 | JWT guard | Verify access token, attach `req.user`, handle refresh fallback |
| `src/middlewares/authorize.js` | 5 | Role/Shop guard | Check `req.user.role` vs matrix, verify `req.user.shopId === req.shopId` |
| `src/middlewares/validate.js` | 3+ | Input sanitizer | Run express-validator chain, format errors via `apiResponse` |
| `src/middlewares/upload.js` | 7,9 | Multer config | `dest: 'uploads/'`, max 5MB, accept image/jpeg, image/png, application/pdf |
| `src/middlewares/errorHandler.js` | 0 | Global error | Catch `AppError` & sync/async, return `{status:"error", message, data:null}` |
| `src/controllers/*.js` | 3+ | Request bridge | NO DB. Call service, wrap in `catchAsync`, return `apiResponse()` |
| `src/services/*.js` | 3+ | Business logic | NO req/res. Handle transactions, stock math, calculations, Prisma calls |
| `src/validators/*.js` | 3+ | Input schemas | `express-validator` chains. Match exact UI fields & regex rules |
| `src/utils/apiResponse.js` | 0 | Standard JSON | `{status, message, data, meta:{total, page, limit, totalPages, hasNext, hasPrev}}` |
| `src/utils/catchAsync.js` | 0 | Async wrapper | `(fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next)` |
| `src/utils/AppError.js` | 0 | Custom error | `extends Error`, `statusCode`, `isOperational = true` |
| `src/utils/pagination.js` | 3+ | Offset calc | Parse `page`, `limit`, return `skip`, `take`, `meta` |
| `src/utils/jwt.js` | 3 | Token helpers | `signAccessToken()`, `signRefreshToken()`, `verify()`, `decode()` |
| `src/utils/generateInvoiceNumber.js` | 8 | Shop invoice | Format `SHOP-YYYY-XXXX`, atomic increment |
| `src/utils/permissions.js` | 5 | Role matrix | Map role → allowed actions, used by `authorize.js` |

---

## 🔗 3. UI/UX (management system.md) → BACKEND MAPPING
| UI Screen / Flow | Backend Route | Controller → Service | Validator Rules (from your file) |
|---|---|---|---|
| **4-Step Onboarding** | `POST /api/v1/onboarding` | `onboarding.controller.js` → `onboarding.service.js` | NIF: `9 digits`, WhatsApp: `+257 8 digits`, AgentCode: `4 chars`, Country/Region/City required |
| **Dashboard** | `GET /api/v1/dashboard` | `dashboard.controller.js` → `dashboard.service.js` | Query params: `period=today/week/month/year`, returns KPIs + chart data JSON |
| **Products CRUD** | `POST/PUT/DELETE /api/v1/products` | `product.controller.js` → `product.service.js` | Promo checkbox triggers `promoPrice`, `promoStartAt`, `promoEndAt`. Images: max 5, ≤5MB |
| **Batch Stock Update** | `POST /api/v1/stock/batch` | `stock.controller.js` → `stock.service.js` | Transaction required. `newStock ≤ maxLimit`. Returns preview + success count |
| **Stock History** | `GET /api/v1/products/:id/stock-history` | `stock.controller.js` → `stock.service.js` | Filter by `type=addition/removal/sale/reversal/adjustment`, paginate |
| **New Sale** | `POST /api/v1/sales` | `sale.controller.js` → `sale.service.js` | ACID: check stock → create sale → items → deduct → increment counter. Auto invoice |
| **Sales History** | `GET /api/v1/sales` | `sale.controller.js` → `sale.service.js` | Filters: `paymentStatus`, `dateFrom`, `dateTo`, `search(customer)` |
| **Expenses** | `POST/PUT/DELETE /api/v1/expenses` | `expense.controller.js` → `expense.service.js` | Receipt upload optional. Types: rent, salary, utilities, etc. Export endpoint later |
| **Reports** | `POST /api/v1/reports` | `report.controller.js` → `report.service.js` | Returns structured JSON for frontend PDF/CSV. Types: product, stock, sales, expenses |
| **Settings** | `PATCH /api/v1/settings/:section` | `settings.controller.js` → `settings.service.js` | Sections: `shop`, `owner`, `location`. Logo upload replaces old. |

---

## 🛠 4. HOW TO USE THIS WITH CLAUDE AI OPUS
1. **Save this file** exactly as `MASTER_BLUEPRINT.md` in your project root.
2. **Start Phase 0** by pasting this into Claude:
Read MASTER_BLUEPRINT.md. Scaffold Phase 0: Create exact folder structure, package.json, .env.example, .gitignore, server.js, app.js, config/database.js, utils/, middlewares/errorHandler.js.
Follow strict MVC rules. Do not write DB models or business logic yet. Output file by file.
3. **Phase 1→2**: Tell Claude: `Read MASTER_BLUEPRINT.md. Generate Phase 2: prisma/schema.prisma (standalone models only), prisma/seed.js, config/constants.js.`
4. **Continue phase-by-phase** using the exact paths mapped in Section 2.
5. **Always verify** output against validator rules & ACID requirements in this document before merging.

---

## ✅ 5. GOLDEN RULES (NON-NEGOTIABLE)
- **NO LOGIC IN ROUTES/CONTROLLERS**: Controllers only parse, call services, return `apiResponse`.
- **STRICT SHOP SCOPING**: Every query must filter by `shopId` from `req.user`.
- **ACID TRANSACTIONS**: Sales, batch stock, employee invites, subscription changes → Prisma `$transaction`.
- **SOFT DELETE ONLY**: `deletedAt` timestamp. Never `DELETE FROM`.
- **STANDARD RESPONSE**: Always `{status, message, data, meta}`.
- **VALIDATION FIRST**: Run `express-validator` before controller/service. Fail fast.
- **NO HARDCODED LIMITS**: Read from `constants.js` (e.g., free plan limits, image size, max products).

---
**Ready to execute.** Next command: `Phase 0: Scaffold Foundation. Follow MASTER_BLUEPRINT.md exactly.`