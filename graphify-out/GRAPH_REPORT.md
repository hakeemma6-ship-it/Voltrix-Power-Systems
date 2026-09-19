# Graph Report - voltrix-power-systems  (2026-09-18)

## Corpus Check
- Large corpus: 197 files · ~3,409,675 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 573 nodes · 1237 edges · 42 communities (20 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Identity System
- App Root & Layout
- MongoDB Maintenance Scripts
- AI Chat & Gemini Engine
- Cloudinary & Deals Pipeline
- Products & Categories UI
- Password Reset & OTP
- Customer Search & Management
- Routing & Page Views
- Admin Panel & Controls
- TypeScript Configuration
- Package Dependencies
- Landing Page & Industries
- Notification Event Bus
- Dealer Registration Flow
- WhatsApp CRM Templates
- Customer Profile Portal
- Branding & Media Scripts
- AI Floating Chat Interface
- Rate Limiter Middleware
- DevOps & Infrastructure
- Security Verification Suite
- ESLint Configuration
- Currency Utility
- Backup Shell Scripts
- SSL Certificate Renewal
- Next.js Type Declarations
- Project Documentation
- WhatsApp Dealer Template
- DR MongoDB Backup
- UFW Firewall Config
- SDA Agreement Documents
- Product Catalog PDF
- SEO Robots Crawl Policy

## God Nodes (most connected - your core abstractions)
1. `syncDatabaseOnBoot()` - 103 edges
2. `persistWrite()` - 62 edges
3. `db` - 40 edges
4. `requireRole()` - 31 edges
5. `getMongoDb()` - 28 edges
6. `isMongoReady()` - 26 edges
7. `react` - 24 edges
8. `sanitizeUser()` - 23 edges
9. `getAuthUser()` - 23 edges
10. `lucide-react` - 22 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `syncDatabaseOnBoot()`  [EXTRACTED]
  app/api/auth/auth0-callback/route.ts → lib/db.ts
- `POST()` --calls--> `persistWrite()`  [EXTRACTED]
  app/api/auth/forgot-password/send-otp/route.ts → lib/db.ts
- `POST()` --calls--> `syncDatabaseOnBoot()`  [EXTRACTED]
  app/api/auth/forgot-password/send-otp/route.ts → lib/db.ts
- `POST()` --calls--> `persistWrite()`  [EXTRACTED]
  app/api/auth/forgot-password/verify-reset/route.ts → lib/db.ts
- `POST()` --calls--> `syncDatabaseOnBoot()`  [EXTRACTED]
  app/api/auth/forgot-password/verify-reset/route.ts → lib/db.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **WhatsApp CRM Notification System** — docs_whatsapp_templates_customer_signup_welcome, docs_whatsapp_templates_dealer_registration_received, docs_whatsapp_templates_admin_new_lead_alert, docs_whatsapp_templates_lead_assigned_to_dealer [EXTRACTED 1.00]

## Communities (42 total, 14 thin omitted)

### Community 0 - "Auth & Identity System"
Cohesion: 0.07
Nodes (82): POST(), POST(), GET(), POST(), validateStrongPassword(), GET(), GET(), DELETE() (+74 more)

### Community 1 - "App Root & Layout"
Cohesion: 0.04
Nodes (38): inter, jetBrainsMono, metadata, plusJakartaSans, nextConfig, devDependencies, autoprefixer, postcss (+30 more)

### Community 2 - "MongoDB Maintenance Scripts"
Cohesion: 0.05
Nodes (26): mongodb, { MongoClient }, { MongoClient }, { MongoClient }, { MongoClient }, migrate(), { MongoClient }, { MongoClient } (+18 more)

### Community 3 - "AI Chat & Gemini Engine"
Cohesion: 0.08
Nodes (27): POST(), ai, @google/genai, calculateSizingRecommendation(), SizingDetails, SizingInputs, cachedEmbeddings, searchKnowledgeBase() (+19 more)

### Community 4 - "Cloudinary & Deals Pipeline"
Cohesion: 0.07
Nodes (23): POST(), uploadBranding(), uploadCategoryImage(), uploadDocument(), uploadProductImage(), uploadToCloudinary(), cloudinary, fs (+15 more)

### Community 5 - "Products & Categories UI"
Cohesion: 0.11
Nodes (25): CategoriesPage, ProductsPage, AmcServicesOverviewProps, CategoriesPageProps, COUNTRIES_AND_STATES, detectCountryByTimezone(), ProductsPage(), ProductsPageProps (+17 more)

### Community 6 - "Password Reset & OTP"
Cohesion: 0.17
Nodes (22): GET(), POST(), POST(), POST(), POST(), cleanupLoginAttempts(), lastLoginAttemptsCleanup, loginAttempts (+14 more)

### Community 7 - "Customer Search & Management"
Cohesion: 0.10
Nodes (17): mockCustomer, tests, CustomersTab(), CustomerDetailModal(), ModalTab, PRODUCT_TYPES, Props, STATUS_COLOR (+9 more)

### Community 8 - "Routing & Page Views"
Cohesion: 0.10
Nodes (13): AdminPanel, DealerPortal, LoginPage, ServoStabilizersShowcase, SetPasswordPage, HeroCarouselSection(), HeroCarouselSectionProps, IndustriesWePower() (+5 more)

### Community 9 - "Admin Panel & Controls"
Cohesion: 0.11
Nodes (12): lucide-react, PRODUCT_CATEGORIES, Props, STATUS_COLOR, Tab, TABS, ProductsTab(), CompanySettingsTab() (+4 more)

### Community 10 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, experimentalDecorators, incremental, isolatedModules, jsx (+13 more)

### Community 11 - "Package Dependencies"
Cohesion: 0.10
Nodes (21): dependencies, bcryptjs, cloudinary, dotenv, @google/genai, jsonwebtoken, jspdf, lucide-react (+13 more)

### Community 12 - "Landing Page & Industries"
Cohesion: 0.19
Nodes (8): react, INDUSTRIES_DATA, Industry, QuickSpec, ICON_MAP, Benefit, IconProps, Icons

### Community 14 - "Dealer Registration Flow"
Cohesion: 0.22
Nodes (6): DealerRegistrationForm, BUSINESS_TYPES, INDIAN_STATES, PRODUCT_OPTIONS, Props, TERMS

### Community 15 - "WhatsApp CRM Templates"
Cohesion: 0.25
Nodes (8): WhatsApp Template: admin_new_lead_alert, CRM WhatsApp Notification Workflow, WhatsApp Template: customer_signup_welcome, WhatsApp Template: customer_welcome_credentials, WhatsApp Template: dealer_registration_received, WhatsApp Template: inquiry_received, WhatsApp Template: lead_assigned_to_dealer, Meta Cloud API (WhatsApp Business)

### Community 16 - "Customer Profile Portal"
Cohesion: 0.25
Nodes (6): CustomerProfile, ORDER_STEP_LABELS, ORDER_STEPS, Props, STATUS_COLOR, ViewMode

### Community 17 - "Branding & Media Scripts"
Cohesion: 0.29
Nodes (5): crypto, filePath, fs, https, path

### Community 18 - "AI Floating Chat Interface"
Cohesion: 0.33
Nodes (6): DedicatedAiSupport(), FloatingChatBubble(), Markdown(), Message, parseInline(), SizingRecommendation

### Community 19 - "Rate Limiter Middleware"
Cohesion: 0.40
Nodes (5): cleanupTracker(), config, lastCleanup, middleware(), tracker

### Community 20 - "DevOps & Infrastructure"
Cohesion: 0.50
Nodes (4): GitHub Actions CI/CD Deploy Pipeline, Certbot / Let's Encrypt SSL, Nginx Reverse Proxy & SSL Configuration, Docker Compose: Next.js Service

## Knowledge Gaps
- **200 isolated node(s):** `extends`, `next/core-web-vitals`, `loginAttempts`, `lastLoginAttemptsCleanup`, `Params` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Landing Page & Industries` to `App Root & Layout`, `AI Chat & Gemini Engine`, `Products & Categories UI`, `Customer Search & Management`, `Routing & Page Views`, `Admin Panel & Controls`, `Dealer Registration Flow`, `Customer Profile Portal`, `AI Floating Chat Interface`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Admin Panel & Controls` to `App Root & Layout`, `AI Chat & Gemini Engine`, `Products & Categories UI`, `Customer Search & Management`, `Routing & Page Views`, `Landing Page & Industries`, `Dealer Registration Flow`, `Customer Profile Portal`, `AI Floating Chat Interface`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `cloudinary` connect `Cloudinary & Deals Pipeline` to `Auth & Identity System`, `App Root & Layout`, `MongoDB Maintenance Scripts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `loginAttempts` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Identity System` be split into smaller, more focused modules?**
  _Cohesion score 0.06562364189482833 - nodes in this community are weakly interconnected._
- **Should `App Root & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `MongoDB Maintenance Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.048625792811839326 - nodes in this community are weakly interconnected._