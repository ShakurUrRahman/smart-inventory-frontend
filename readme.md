# InventoryOS — Frontend

<div align="center">

![InventoryOS](https://img.shields.io/badge/InventoryOS-Frontend-6366F1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwindcss)

**A polished, full-featured inventory management dashboard built with Next.js 15, TypeScript, and a dark-first design system.**

[Live Demo](https://smart-inventory-biz.vercel.app) · [Backend Repo](https://github.com/ShakurUrRahman/smart-inventory)

</div>

---

## Overview

InventoryOS Frontend is a production-ready SPA that provides a complete inventory management experience. It features a full RBAC system, real-time notifications, animated UI, and a responsive design that works across all device sizes.

---

## Tech Stack

| Category         | Technology               |
| ---------------- | ------------------------ |
| Framework        | Next.js 15 (App Router)  |
| Language         | TypeScript 5.9           |
| Styling          | Tailwind CSS + shadcn/ui |
| State Management | Zustand (with persist)   |
| Server State     | TanStack Query v5        |
| Forms            | React Hook Form + Zod    |
| Animations       | Framer Motion            |
| HTTP Client      | Axios                    |
| Auth             | JWT + js-cookie          |
| Icons            | Lucide React             |
| Notifications    | Sonner                   |
| Date Utils       | date-fns                 |

---

## Features

### Authentication

- JWT-based authentication with cookie persistence
- Auto-rehydration on app load via `/api/auth/me`
- Protected routes via Next.js middleware with JWT verification
- Role-aware redirects — authenticated users can't access login/register

### Role-Based Access Control (RBAC)

Four roles with distinct permissions:

| Role          | Access                                                              |
| ------------- | ------------------------------------------------------------------- |
| `super_admin` | Full access — can demote admins, only one exists                    |
| `admin`       | Full access — can manage users, approve products/categories         |
| `manager`     | Operational access — orders, restock, categories (with permissions) |
| `user`        | Limited access — own products, categories (view only)               |

The `usePermissions()` hook centralizes all permission checks — never hardcode role checks in components.

### Dashboard

- Live stats — today's orders, revenue, stock alerts, order pipeline
- 7-day orders chart and revenue chart (Recharts)
- Order status breakdown (pie/donut chart)
- Low stock product summary table
- Real-time activity feed

### Products

- Role-split view — users see their own products with approval status tabs
- Admin/manager see all approved products with full CRUD
- Approval workflow — user products start as `pending`, require admin/manager approval
- Inline rejection reason display
- Low stock + out-of-stock visual indicators with restock button
- Paginated table with debounced search, category filter, status filter

### Categories

- Grid view with product count per category
- Create, rename, delete with confirmation dialogs
- Manager category permission toggles (create/update/delete independently)

### Orders

- Full order lifecycle — Pending → Confirmed → Shipped → Delivered / Cancelled
- Status validation — prevents illegal transitions
- Expandable row detail with item breakdown
- Status change with confirmation dialog and animated dropdown
- Search by customer name, date filter, status tabs with counts

### Restock Queue

- Role-aware — users see only their products' alerts, admin/manager see all
- Priority tabs (High / Medium / Low) with animated sliding indicator
- Progress bar color synced with priority badge (percentage-based)
- Restock modal with current stock, new stock preview, queue resolution status

### Admin Panel

- User management table — all users sorted by role weight
- Promote user → manager (admin + super_admin)
- Promote manager → admin (super_admin only)
- Demote admin → manager (super_admin only)
- Demote manager → user (admin + super_admin)
- Category permission toggles per manager (Switch UI)
- Pending product approval with approve/reject actions
- Role history tracking

### Activity Log

- Timeline view with animated stagger entry
- Entity-type filter tabs (Order, Product, Stock, User, Category)
- Relative timestamps, performer name, action descriptions
- Pagination

### Notifications

- Bell icon with unread count badge
- Populated from recent activity feed (polls every 30s)
- Mark individual / mark all as read
- Remove individual notifications
- Zustand-backed notification store

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── register/       # Register page
│   └── (dashboard)/
│       ├── dashboard/       # Stats, charts
│       ├── products/        # Products CRUD
│       ├── categories/      # Categories management
│       ├── orders/          # Orders management
│       ├── restock/         # Restock queue
│       ├── activity/        # Activity log
│       └── admin/           # Admin panel
├── components/
│   ├── layout/              # Sidebar, Topbar, DashboardLayout, PageHeader
│   ├── shared/              # Skeleton, Modal, DialogModal
│   ├── ui/                  # shadcn components + BaseModal
│   ├── products/            # ProductModals
│   ├── categories/          # AddCategoryDialog, UpdateCategoryDialog, DeleteCategoryDialog
│   ├── orders/              # CreateOrderDrawer, StatusDropdown
│   └── restock/             # RestockModals
├── hooks/
│   ├── usePermissions.ts    # Centralized RBAC permission checks
│   └── useSearch.ts         # useDebounce hook
├── lib/
│   ├── api.ts               # Axios instance with auth interceptor
│   ├── authApi.ts           # Auth API calls
│   ├── productsApi.ts
│   ├── categoriesApi.ts
│   ├── ordersApi.ts
│   ├── restockApi.ts
│   ├── dashboardApi.ts
│   └── adminApi.ts
├── store/
│   ├── authStore.ts         # Zustand auth store with persist
│   └── notificationStore.ts # Zustand notification store
├── middleware.ts             # JWT verification + RBAC route protection
└── types/
    └── express.d.ts         # Express type augmentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running (see [backend repo](https://github.com/ShakurUrRahman/smart-inventory))

### Installation

```bash
# Clone the repo
git clone https://github.com/ShakurUrRahman/smart-inventory.git
cd smart-inventory/packages/frontend

# Install dependencies
npm install
```

### Environment Variables

Create `.env.local` in `packages/frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
JWT_SECRET=your-jwt-secret-here
```

> `JWT_SECRET` must match the backend's secret — used by Next.js middleware to verify tokens without a DB call.

### Run Development Server

```bash
npm run dev
# → http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment (Vercel)

1. Create a new Vercel project pointing to your repo
2. Set **Root Directory** to `packages/frontend`
3. Set **Framework Preset** to `Next.js`
4. Add environment variables:
    ```
    NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
    JWT_SECRET=your-jwt-secret
    ```
5. Deploy

---

## Key Design Decisions

**`usePermissions` hook** — single source of truth for all role checks. Every permission is derived from the Zustand user store. Adding a new role only requires updating this one file.

**Two-query pattern for paginated + filtered data** — the restock page uses one query for the filtered table data and a separate stable query for priority counts, preventing counts from changing when filters are applied.

**Client-side tab filtering** — user product tabs (All/Approved/Pending/Rejected) filter client-side from a single fetch, avoiding multiple network requests for tab switching.

**`(req as any).user` pattern** — Express global type augmentation is unreliable in monorepo setups. All middleware and controllers use this cast to avoid TypeScript errors.

**`queryClient.clear()` on logout** — prevents data from a previous user's session appearing briefly after switching accounts.

---

## Default Demo Credentials

After running `/api/seed`:

| Role        | Email                      | Password       |
| ----------- | -------------------------- | -------------- |
| Super Admin | superadmin@inventoryos.com | SuperAdmin123! |
| Admin       | admin@inventoryos.com      | Admin123!      |
| Manager     | manager@inventoryos.com    | Manager123!    |
| User        | user@inventoryos.com       | User123!       |

---

## License

MIT
