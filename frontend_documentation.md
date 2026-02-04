# Frontend Documentation & Recreation Guide

This document provides a comprehensive overview of the frontend codebase, detailing the project structure, dependencies, navigation hierarchy, pages, and core functionalities. It is designed to guide a senior developer in recreating the frontend application from scratch.

## 1. Project Overview

*   **Framework:** Next.js (Pages Router)
*   **Styling:** Tailwind CSS
*   **Icons:** Heroicons (Outline)
*   **State Management:** React Context (AuthContext) + Local State
*   **API Client:** Axios (custom instances in `utils/api.js`)

## 2. Dependencies

### Key Runtime Dependencies
*   `next`: 14.0.4
*   `react`: ^18
*   `react-dom`: ^18
*   `tailwindcss`: ^3.3.0
*   `@heroicons/react`: ^2.0.18 (Icons)
*   `axios`: ^1.6.0 (HTTP Client)
*   `date-fns`: ^3.0.6 (Date Formatting)
*   `react-hot-toast`: ^2.4.1 (Notifications)
*   `react-hook-form`: ^7.48.0 (Form Handling)
*   `recharts` / `chart.js` / `react-chartjs-2`: (Data Visualization)
*   `react-select`: (Dropdowns)
*   `react-beautiful-dnd`: (Drag and Drop)
*   `clsx` / `tailwind-merge`: (Class Utility)

### Dev Dependencies
*   `eslint`
*   `typescript` (installed but project seems primarily JS based on file extensions)
*   `@tailwindcss/forms`
*   `@tailwindcss/typography`

## 3. Project Structure

```text
frontend/
├── components/         # Reusable UI components
│   ├── Layout.js       # Main application layout (Sidebar, Topbar)
│   ├── ui/             # Generic UI elements (Button, Input, etc.)
│   └── ...             # Feature-specific components
├── contexts/           # React Context Providers
│   └── AuthContext.js  # Authentication state & logic
├── pages/              # Next.js Pages (Routes)
│   ├── _app.js         # Global App wrapper (Providers, Global Styles)
│   ├── index.js        # Entry point
│   ├── dashboard.js    # Main Dashboard
│   ├── ...             # Other top-level pages
│   └── [feature]/      # Feature-specific routes (nested)
├── public/             # Static assets
├── styles/             # Global styles (globals.css)
└── utils/              # Utility functions
    └── api.js          # API client configuration & endpoints
```

## 4. Navigation & Menu Structure

The Application uses a persistent Sidebar navigation defined in `components/Layout.js`.

### Sidebar Hierarchy
1.  **Dashboard** (`/dashboard`)
    *   *Icon:* HomeIcon
2.  **LMS** (Collapsible Submenu)
    *   *Icon:* AcademicCapIcon
    *   **Leads** (`/leads`) - *Icon:* UsersIcon
    *   **LMS** (`/lms`) - *Icon:* AcademicCapIcon
    *   **Network** (`/network`) - *Icon:* UserGroupIcon
3.  **WA Marketing** (Collapsible Submenu)
    *   *Icon:* ChatBubbleLeftRightIcon
    *   **Campaigns** (`/campaigns`) - *Icon:* ChatBubbleLeftRightIcon
    *   **Flows** (`/flows`) - *Icon:* BoltIcon
    *   **Templates** (`/templates`) - *Icon:* DocumentTextIcon
    *   **Quick Replies** (`/quick-replies`) - *Icon:* ChatBubbleBottomCenterTextIcon
    *   **Meta Ads** (`/meta-ads`) - *Icon:* MegaphoneIcon
4.  **Inventory** (Collapsible Submenu)
    *   *Icon:* ShoppingBagIcon
    *   **Catalog** (`/catalog`) - *Icon:* ShoppingBagIcon
5.  **Drip Matrix** (`/drip-sequences`)
    *   *Icon:* QueueListIcon
6.  **Analytics** (`/analytics`)
    *   *Icon:* ChartBarIcon
7.  **Payments** (`/payments`)
    *   *Icon:* CreditCardIcon
8.  **Settings** (`/settings`)
    *   *Icon:* Cog6ToothIcon

## 5. Pages & Core Functionalities

### Common Features
*   **Authentication:** Protected routes using `useAuth` hook. Redirects to login if unauthenticated.
*   **Layout:** All internal pages are wrapped in `<Layout>`.
*   **Loading States:** Full-screen spinners or component-level skeletons.
*   **Notifications:** `react-hot-toast` for success/error messages.

### Detailed Page Breakdown

#### 1. Leads (`/leads`)
*   **Route:** `/leads`, `/leads/new`, `/leads/[id]`, `/leads/[id]/edit`
*   **Core Features:**
    *   **List View:** Table displaying leads with name, status (color-coded badges), location, budget, AI score (progress bar), and last contact.
    *   **Filtering:**
        *   Search by name/phone.
        *   Filter by Status (New, Contacted, Qualified, etc.).
    *   **Actions:** Add New, Edit, Delete, View Details.
    *   **Pagination:** Next/Previous controls.

#### 2. Network (`/network`)
*   **Route:** `/network`
*   **Internal Tabs:**
    1.  **My Network:** Grid of connected agents.
    2.  **Connection Requests:** List of incoming requests with Accept/Reject actions.
    3.  **Discover Agents:** Search functionality to find new agents by name/location.
*   **Core Features:**
    *   Agent Cards: Display name, business, trust score, specializations.
    *   Stats Dashboard: Total connections, collaborations, avg trust level.
    *   Connection Logic: Send request, Cancel request, Accept/Reject.

#### 3. Campaigns (`/campaigns`)
*   **Route:** `/campaigns`, `/campaigns/new`, `/campaigns/[id]`
*   **Core Features:**
    *   **Dashboard:** Stats cards (Total, Completed, Active, Response Rate).
    *   **Grid View:** Cards for each campaign showing status (Draft, Running, Completed), stats (Sent vs Recipients), and quick actions.
    *   **Actions:**
        *   *Draft:* Edit, Delete, Send/Launch.
        *   *Running/Completed:* View Details, Analytics.

#### 4. Flows (`/flows`)
*   **Route:** `/flows`
*   **Internal Tabs:**
    1.  **My Flows:** List of user's automation workflows.
    2.  **Templates Library:** Pre-built workflow templates.
*   **Core Features:**
    *   Integration with **n8n** (implied by "Open Editor" linking to localhost:5678).
    *   Activate/Pause workflows.
    *   Create workflow from Template.
    *   "Mock Mode" check for demo environment.

#### 5. Quick Replies (`/quick-replies`)
*   **Route:** `/quick-replies`
*   **Internal Tabs:** Dynamic tabs based on categories (All, [Category Name]...).
*   **Core Features:**
    *   List of canned responses with shortcut codes (e.g., `/greet`).
    *   Create/Edit/Delete replies.
    *   Filter by category.

#### 6. Settings (`/settings`)
*   **Route:** `/settings`
*   **Internal Tabs:**
    1.  **Profile:** Form to update Name, Email, Business Name, Location, Specializations (checkboxes).
    2.  **Security:** Change Password form.
    3.  **Notifications:** Toggles for Email, Campaign Updates, Lead Alerts, etc.
*   **Core Features:** User profile management and preferences.

#### 7. Payments (`/payments`)
*   **Route:** `/payments`
*   **Internal Tabs:**
    1.  **Subscription Plans:** Pricing cards with "Upgrade" or "Subscribe" buttons. Shows current active plan.
    2.  **Payment History:** Table of past transactions with Status and Invoice download.
*   **Core Features:**
    *   Stats Overview (Total Revenue, Pending, Completed).
    *   Subscription management (Razorpay integration implied).

## 6. Development Notes
*   **Dark Mode:** The application uses a dark theme by default (dark backgrounds, light text).
*   **Responsive:** Layout handles mobile (drawer menu) vs desktop (sidebar) views.
*   **Mock Data:** Several pages have fallback mock data if API calls fail, useful for UI development without backend.

## 7. UI Design System

### Colors (Theme: SyndiTech Antigravity Dark)
The application uses a custom color palette defined in `tailwind.config.js` and `styles/globals.css`.

*   **Primary Brand Color (Orange):**
    *   `primary`: #F97316 (Orange-500)
    *   `primary-foreground`: #000000 (Black) - For contrast on buttons
    *   Shades:
        *   50: #FFF7ED
        *   100: #FFEDD5
        *   200: #FED7AA
        *   300: #FDBA74
        *   400: #FB923C
        *   500: #F97316 (DEFAULT)
        *   600: #EA580C
        *   700: #C2410C
        *   800: #9A3412
        *   900: #7C2D12

*   **Dark Mode Base:**
    *   `background`: #0E1117 (Soft Black) - Main app background
    *   `card`: #161B22 (Dark Blue-Grey) - Card backgrounds
    *   `foreground`: #E5E7EB (Light Gray) - Primary text
    *   `muted`: #111827 (Gray-900) - Secondary backgrounds
    *   `border`: #1F2937 (Gray-800) - Borders

*   **Semantic Colors:**
    *   `success`: #10B981 (Emerald 500)
    *   `warning`: #F59E0B (Amber 500)
    *   `danger`: #EF4444 (Red 500)

### Typography
*   **Font Family:** `Inter` (sans-serif)
*   **Headings:** Uses `font-display` (mapped to Inter) with tight letter spacing (-0.01em).
*   **Body:** `font-sans` (Inter).

### UI Elements & Effects
*   **Shadows:**
    *   `shadow-soft`: `0 4px 20px -2px rgba(0, 0, 0, 0.4)` (Standard elevation)
    *   `shadow-glow`: `0 0 15px rgba(249, 115, 22, 0.3)` (Primary glow)
    *   `shadow-glow-sm`: `0 0 10px rgba(249, 115, 22, 0.1)` (Subtle glow)

*   **Buttons:**
    *   `.btn`: Standard base classes with transition.
    *   `.btn-primary`: Background Primary, Text Black, Shadow Glow.

