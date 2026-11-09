# Third-Party Frontend Dependencies & Content Security Policy (CSP) Inventory

**Document Version**: 1.0.0  
**Effective Date**: October 2026  
**Status**: Active & Synchronized with Deployment Configurations  

---

## 1. Overview & Security Objectives

This repository adheres to a strict least-privilege security model at the browser runtime boundary. To defend against Cross-Site Scripting (XSS), data exfiltration, clickjacking, and unauthorized third-party tracking, all external frontend dependencies must be cataloged, justified, and cryptographically or domain-restricted via a synchronized **Content Security Policy (CSP)**.

---

## 2. Inventory of External Frontend Dependencies

| Dependency | Category | Package / Source | External Domains / Origins Required | Purpose / Justification | Risk Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stripe.js** | Payment Gateway | `@stripe/stripe-js` (`^10.1.0`) | `https://js.stripe.com` | Dynamically injects Stripe client library for PCI-DSS compliant checkout. | High (financial transactions) |
| **Stripe Elements** | Payment UI (Iframe) | `@stripe/react-stripe-js` (`^7.0.0`) | `https://js.stripe.com`<br>`https://hooks.stripe.com` | Mounts secure iframe containing payment input fields without card data touching app servers. | High (financial transactions) |
| **Stripe Gateway API** | Network / Telemetry | Stripe API | `https://api.stripe.com`<br>`https://m.stripe.network`<br>`https://q.stripe.com` | Tokenization, fraud prevention (Radar), and 3-D Secure authentication callbacks. | High (financial transactions) |
| **Inertia.js & React** | SPA Framework | `@inertiajs/react`<br>`react`, `react-dom` | `'self'` (bundled locally via Vite) | Application rendering and client-side page state transitions. | Low (first-party code) |
| **Axios** | HTTP Client | `axios` (`^1.7.4`) | `'self'` | XHR requests for internal APIs and CSRF-tokenized mutations. | Low (first-party code) |
| **Lucide Icons** | Visual Assets | `lucide-react` (`^1.16.0`) | `'self'` (inlined SVG) | UI iconography bundled into application chunks. | Low (inlined SVG) |
| **Typography** | Fonts | Self-hosted (`Geist`, `Fraunces`, `Cinzel`) | `'self'`, `data:` (local `/fonts/*`) | Brand typography; fully self-hosted without reliance on external font CDNs. | Low (static asset) |
| **Brand Documentation** | Media Assets | Static SVG images | `https://laravel.com` | Welcome/documentation placeholder illustrations. | Low (static asset) |

---

## 3. Approved Content Security Policy (CSP) Directives

The application runtime and web server enforce the following policy:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://laravel.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; connect-src 'self' https://api.stripe.com https://m.stripe.network https://q.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
```

### Directive Breakdown & Rationale

| CSP Directive | Authorized Sources | Architectural Rationale |
| :--- | :--- | :--- |
| `default-src` | `'self'` | Deny-by-default for all undefined resource types. |
| `script-src` | `'self' 'unsafe-inline' https://js.stripe.com` | Restricts JavaScript execution to local bundles and Stripe's hosted SDK. (`'unsafe-inline'` accommodates Vite development hydration and Blade JSON-LD metadata scripts). |
| `style-src` | `'self' 'unsafe-inline'` | Allows Tailwind compiled stylesheets and in-app CSS custom properties. |
| `font-src` | `'self' data:` | Allows locally hosted custom fonts (`/fonts/Geist*`, `/fonts/Fraunces*`) and embedded base64 fonts. |
| `img-src` | `'self' data: https://laravel.com` | Allows local application artwork, data URIs for inline charts, and framework badge assets. |
| `frame-src` | `'self' https://js.stripe.com https://hooks.stripe.com` | Explicitly permits Stripe Elements iframes and 3-D Secure cardholder verification dialogs while blocking all unauthorized iframes. |
| `connect-src` | `'self' https://api.stripe.com https://m.stripe.network https://q.stripe.com` | Authorizes XHR/Fetch communication only to the app backend and Stripe payment verification / fraud prevention nodes. |
| `object-src` | `'none'` | Completely disables obsolete plugins (Flash, Java Applets, ActiveX). |
| `base-uri` | `'self'` | Prevents malicious modification of base URLs via `<base>` tag injection. |
| `form-action` | `'self'` | Ensures HTML forms cannot be redirected to submit credentials or data to external third-party domains. |
| `frame-ancestors` | `'none'` | Prevents clickjacking by prohibiting external domains from embedding ThinkTank OS inside an iframe. |

---

## 4. Deployment Synchronization Matrix

To guarantee defense-in-depth across containerized production clusters, staging proxies, and local developer setups, the CSP directives are synchronized across two active deployment layers:

```
[ Incoming Browser Request ]
            │
            ▼
┌───────────────────────────────────────┐
│  Layer 1: Edge / Reverse Proxy (Nginx)│  <── docker/nginx.conf
│  - Adds Content-Security-Policy       │
│  - Adds X-Frame-Options: SAMEORIGIN   │
│  - Adds X-Content-Type-Options: nosniff
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  Layer 2: Application Layer (Laravel) │  <── app/Http/Middleware/SecurityHeaders.php
│  - Enforces headers in PHP-FPM / Octane
│  - Adds Referrer-Policy & Permissions  │
│  - Guarantees CSP even behind custom   │
│    load balancers without Nginx proxy  │
└───────────────────────────────────────┘
```

### Layer 1: Reverse Proxy Configuration (`docker/nginx.conf`)
Located at: `docker/nginx.conf`
The Nginx server block injects the CSP header on all responses with the `always` parameter to ensure headers are sent on error responses (4xx/5xx) as well.

### Layer 2: Laravel Application Middleware (`app/Http/Middleware/SecurityHeaders.php`)
Located at: `app/Http/Middleware/SecurityHeaders.php`  
Registered in: `bootstrap/app.php`  
Applies security headers to every web response at the framework kernel level, guaranteeing protection during integration tests, local development, and direct container execution.

---

## 5. Maintenance Protocol & Change Management

1. **Adding a New Frontend Dependency**:
   - Any new dependency that fetches remote code, opens network sockets, or loads iframes must be documented in this inventory.
   - Propose corresponding CSP directive updates in the same pull request.
   - Wildcards (`*` or `https:`) are strictly prohibited in CSP rules.

2. **Automated Vulnerability Auditing**:
   - Run `npm audit --audit-level=high` and `composer audit` in local workflows and CI.
   - Monthly review of transitive dependencies to detect supply chain compromises early.

3. **Subresource Integrity (SRI)**:
   - All Vite-built bundles are hashed with content hashes (`app-[hash].js`) during production compilation.
   - Third-party scripts must be loaded either via pinned npm packages or with cryptographic SRI hashes.
