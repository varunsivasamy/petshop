# 🐾 PawHaven - Enterprise E-Commerce Platform

An enterprise-grade, concurrency-safe E-Commerce platform built for Pet Shop Owners and Customers, architected to demonstrate **backend engineering craftsmanship**, **SOLID design principles**, **SDLC best practices**, and **bandwidth optimization**.

---

## 📑 Table of Contents
1. [Architectural Highlights & SOLID Principles](#-architectural-highlights)
2. [Authentication: JWT vs Session Analysis](#-authentication-strategy-jwt-vs-session)
3. [Concurrency Protection & Row-Level Locking](#-concurrency-protection--race-condition-safety)
4. [Bandwidth Optimization & Client-Side Local Storage Caching](#-bandwidth-optimization--client-side-local-caching)
5. [Database Architecture & Multi-Engine Support](#-database-architecture)
6. [Shop Owner Admin & Media Upload Guide](#-shop-owner-admin--pet-management)
7. [Quick Start & Setup Instructions](#-quick-start-guide)
8. [Demo Credentials](#-demo-accounts-for-evaluation)
9. [Automated Test Suite](#-automated-test-suite)
10. [SDLC Repository Structure](#-sdlc-project-architecture)

---

## 🌟 Architectural Highlights

### SOLID Design Principles Implementation
- **Single Responsibility Principle (SRP)**:
  - `PetService`: Manages pet catalog validations, views count, and inventory state.
  - `OrderService`: Coordinates atomic checkout transactions, row locking, and order status transitions.
  - `AuthService`: Handles user onboarding, JWT token issuance, and real-user identity verification.
  - `ImageOptimizationService`: Manages server-side image compression, dimensions, SHA256 hashing, and cache headers.
  - Controllers/Views focus strictly on HTTP request/response serialization.
- **Open/Closed Principle (OCP)**:
  - Extensible `IPaymentGateway` strategy interface. Payment processors (`MockCardPaymentGateway`, `CashOnDeliveryGateway`) can be swapped or extended without modifying `OrderService`.
- **Liskov Substitution Principle (LSP)**:
  - Repositories implement `IBaseRepository[T]`, ensuring any data layer implementation can be substituted in testing without altering domain service behavior.
- **Interface Segregation Principle (ISP)**:
  - Granular models and mixins (`TimestampedModel`, `SoftDeletableModel`, `AuditableModel`).
- **Dependency Inversion Principle (DIP)**:
  - Business logic services depend on abstract repository interfaces (`IPetRepository`, `IOrderRepository`) rather than direct ORM couplings.

---

## 🔐 Authentication Strategy: JWT vs Session

| Feature | Session-Based Authentication | JWT with SimpleJWT | Project Decision |
| :--- | :--- | :--- | :--- |
| **Decoupled SPA Architecture** | Requires sticky sessions and cookie CORS across separate frontend/backend domains. | Stateless bearer tokens natively decoupled from client SPA. | **JWT Selected** |
| **Scalability** | Requires centralized distributed stores (Redis/Memcached). | Cryptographically signed; any worker node can verify without DB lookup. | **JWT Selected** |
| **Real User Verification** | Session bound to cookie; requires DB lookup for verification status. | Claims (`is_verified`, `role`, `user_id`) encoded securely in token payload. | **JWT Selected** |
| **Revocation & Security** | Instant DB session removal. | 2-hour access tokens + refresh token rotation + DB blacklist on revocation. | **JWT Selected** |

* **Real User Verification**: Every user record includes an `is_verified` flag requiring confirmation via a 6-digit verification code before full account activation.

---

## 🛡️ Concurrency Protection & Race Condition Safety

- **Pessimistic Row-Level Locking (`select_for_update()`)**:
  - In pet e-commerce, multiple customers may attempt to adopt or purchase the exact same pet simultaneously.
  - Inside a `transaction.atomic()` block, the specific `Pet` record is locked at the database engine level until commit.
  - If a concurrent customer submits an order at the same moment, the database lock ensures only ONE transaction succeeds. The second customer receives a friendly alert: *"Someone just adopted this pet a moment ago! Please browse other adorable pets looking for a loving home."* (HTTP 409 Conflict).
  - **Guarantees zero double-adoption or inventory overselling under heavy multi-user traffic.**

---

## ⚡ Bandwidth Optimization & Client-Side Local Caching

- **Server-Side Processing & Storage**:
  - Images uploaded by the shop owner are stored on disk with dimension constraints and automated SHA256 content hashing (`content_hash`).
  - HTTP responses emit immutable cache headers: `Cache-Control: public, max-age=31536000, immutable` and `ETag: "{content_hash}"`.
  - Conditional HTTP requests evaluate `If-None-Match` and return `304 Not Modified`.
- **Client-Side Persistent IndexedDB Cache**:
  - The React SPA features an automated `ImageCacheManager` powered by browser **IndexedDB**.
  - Before requesting an image across the network, the client checks IndexedDB for the cached blob.
  - **Cache Hit**: Renders instantaneously from client local storage with **0 KB network bandwidth**.
  - **Cache Miss**: Downloads from server once, writes blob to IndexedDB, and subsequent visits are instant.
  - The local caching operates smoothly and invisibly in the background.

---

## 🗄️ Database Architecture

The platform connects to a real relational SQL database via the Django ORM with dual-engine flexibility:
- **Default (Zero-Config Development)**: Uses SQLite (`db.sqlite3`) out-of-the-box.
- **Production (PostgreSQL / MySQL)**: Set `DB_ENGINE=postgresql` in `backend/.env` to route all queries and row locks directly to PostgreSQL.

---

## 🐾 Shop Owner Admin & Pet Management

You have **two interfaces** to add/manage pet listings and upload photos:

### 1. In the React Storefront ("Shop Manager")
1. Open the app: `http://localhost:5173`
2. Click **"Sign In"** $\rightarrow$ Click **"Store Owner"** (or use `owner@petshop.com` / `owner123`).
3. Click the **"Shop Manager"** toggle in the top navbar.
4. Click **"+ Add Pet Listing"**:
   - Fill in name, category, adoption fee, age, gender, size, personality story.
   - **Upload photo** directly from your computer.
   - Click **"Publish Pet Listing"**.

### 2. In the Django Admin Portal
1. Navigate to: `http://127.0.0.1:8000/admin/`
2. Sign in with `owner@petshop.com` / `owner123`.
3. Under **Pets**, click **"Pets"** $\rightarrow$ **"Add Pet"**.
4. Fill in fields and attach multiple photos under the **"Pet Images"** inline at the bottom with live image previews.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm
- Git

### 1. Backend Setup (Django REST Framework)
```bash
# Navigate to backend directory
cd backend

# Activate Python Virtual Environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database with sample pets, categories, breeds, and demo accounts
python manage.py seed_petshop

# Run automated test suite (Unit tests, Concurrency tests, Permissions)
python manage.py test

# Start the Django development server
python manage.py runserver 8000
```
- API Root: `http://127.0.0.1:8000/api/`
- Interactive OpenAPI / Swagger Documentation: `http://127.0.0.1:8000/api/docs/`
- Django Admin: `http://127.0.0.1:8000/admin/`

---

### 2. Frontend Setup (React Single Page Application)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite React development server
npm run dev
```
- Storefront: `http://localhost:5173`

---

## 🔑 Demo Accounts for Evaluation

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Shop Owner** | `owner@petshop.com` | `owner123` | Shop Manager Hub, Add/Edit/Delete Pets, Image Upload, Order Fulfillment, Django Admin |
| **Customer** | `customer@example.com` | `customer123` | Browse Catalog, Pet Health Disclosures, Cart, Concurrency Checkout, Order History |

*(The Sign In modal also includes 1-click quick sign-in buttons for both roles).*

---

## 🧪 Automated Test Suite

Run the full automated test suite covering authentication, SOLID domain services, permissions, and multi-threaded concurrency:

```bash
cd backend
python manage.py test
```

```text
Creating test database for alias 'default'...
........
----------------------------------------------------------------------
Ran 8 tests in 12.413s

OK
Destroying test database for alias 'default'...
Found 8 test(s).
System check identified no issues (0 silenced).
```

---

## 📁 SDLC Project Architecture

```
petshop/
├── backend/
│   ├── accounts/             # Custom User, JWT Claims, Real-User Verification
│   ├── pets/                 # Catalog, Image Optimization Service, Repositories, Services
│   ├── orders/               # Concurrency-Safe Checkout (select_for_update), Payment Gateways
│   ├── analytics/            # Shop Owner KPIs (Revenue, Pets, Orders, Verified Users)
│   ├── common/               # SOLID Interfaces (IBaseRepository, IPaymentGateway)
│   ├── petshop_backend/      # Settings, URLs, Multi-DB Config, WSGI
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Virtual DOM optimized pure components (PetCard, CachedImage)
│   │   ├── services/         # api.ts (JWT client) & imageCache.ts (IndexedDB local cache)
│   │   ├── App.tsx           # Main Single Page Application coordinator
│   │   └── style.css         # Modern, warm boutique design system
│   ├── index.html
│   └── vite.config.ts
└── README.md
```
