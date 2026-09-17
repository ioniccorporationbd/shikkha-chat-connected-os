# `src/` স্ট্রাকচার গাইড

এই প্রজেক্টে ফাইলগুলো **কাজ অনুযায়ী ফোল্ডারে** ভাগ করা আছে এবং প্রতিটি ফাইলের নাম তার কাজ বোঝায়।
URL / route (`src/app/**`) **কখনো** রিনেম করা হয় না — filename-ই route।

```
src/
├─ app/                          # Next.js App Router (URL গুলো এখানেই — নাম বদলাবে না)
│  ├─ (site)/                    #   /            → home page
│  ├─ (auth)/login/              #   /login
│  ├─ (dashboard)/userDashboard/ #   /userDashboard
│  └─ api/                       #   /api/auth/*, /api/dashboard/*
├─ proxy.ts                      # Next.js 16 middleware (ফাইলনাম fixed)
├─ lib/                          # app-নিরপেক্ষ লজিক
│  ├─ api/         http.ts · frappe.ts     # HTTP/Frappe client
│  ├─ auth/        store.ts · queries.ts · session.ts · messages.ts
│  ├─ dashboard/   messages.ts · icons.ts
│  └─ i18n/        LanguageProvider.tsx    # ভাষা (default: bn)
└─ components/
   ├─ layout/      LeftSidebar.tsx · ScrollLockedContentSection.tsx
   ├─ home/        LandingHeroBanner.tsx · ProductRouterSection.tsx · *VideoBanner.tsx
   ├─ hubs/                        # হোম পেজের ৩টি hub
   │  ├─ home-connections/         #   HomeConnectionsHub.tsx · HomeConnectionsSidePanels.tsx
   │  │  ├─ sections/              #     বাঁ/মাঝের বড় সেকশন   (*.tsx  — hub-এর মূল কনটেন্ট)
   │  │  └─ panels/                #     ডান দিকের ছোট প্যানেল (*Panel.tsx)
   │  ├─ student-achievement/      #   sections/ + panels/
   │  ├─ operational-excellence/   #   sections/ + panels/
   │  └─ shared/                   #   SectionPanel.tsx · OrbitProductPanel.tsx
   ├─ banners/  (home/ এর সাথে যুক্ত)
   ├─ auth/        SidebarAuthButton.tsx · LoginForm.tsx · AuthBootstrap.tsx
   ├─ dashboard/   DashboardShell.tsx · PanelCard.tsx · StatCard.tsx · ActivityList.tsx · QuickLinks.tsx
   └─ providers/   QueryProvider.tsx
```

**নিয়ম (নতুন ফাইল যোগ করার সময়):**

1. যে কাজ, সেই ফোল্ডার — `hubs/<hub>/sections/` = বড় সেকশন, `hubs/<hub>/panels/` = ডান দিকের প্যানেল।
2. ফাইলের নাম = তার কাজ (`EnrollmentPanel.tsx`), `_1`/`_2`/`Copy`/`new` টাইপ নাম নয়।
3. `export default function` এর নাম ফাইলের নামের সাথে মিলবে।
4. একাধিক hub ব্যবহার করে এমন কম্পোনেন্ট `hubs/shared/` এ থাকবে (যেমন `SectionPanel.tsx`)।
5. `src/app/**`-এর route ফাইল (`page.tsx`, `layout.tsx`, `route.ts`) এবং `src/proxy.ts` **কখনো** রিনেম/মুভ করা যাবে না — সেগুলো convention।

> এই re-organization সম্পূর্ণ **frontend-only** এবং behavior/UI/URL অপরিবর্তিত।
