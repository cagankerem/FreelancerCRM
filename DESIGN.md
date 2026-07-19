---
version: alpha
name: Kapsam
description: "Kapsam's cool-spectrum editorial product system, using purple for versatility, blue for trust, cyan for clarity, and orange for high-attention actions."
colors:
  canvas: "#F6F8FC"
  surface: "#FFFFFF"
  surface-subtle: "#F1F5F9"
  on-surface: "#101828"
  on-surface-soft: "#344054"
  muted: "#475467"
  outline: "#CBD5E1"
  outline-soft: "#E2E8F0"
  control-outline: "#7B8794"
  sidebar: "#12142A"
  sidebar-raised: "#1B2140"
  sidebar-text: "#E2E8F0"
  sidebar-muted: "#A7B2C5"
  primary: "#6D28D9"
  primary-hover: "#5B21B6"
  primary-container: "#F5F3FF"
  primary-container-strong: "#EDE9FE"
  on-primary-container: "#5B21B6"
  secondary: "#1D4ED8"
  secondary-hover: "#1E40AF"
  secondary-container: "#EFF6FF"
  secondary-container-strong: "#DBEAFE"
  on-secondary-container: "#1D4ED8"
  tertiary: "#0E7490"
  tertiary-signal: "#06B6D4"
  tertiary-hover: "#155E75"
  tertiary-container: "#ECFEFF"
  tertiary-container-strong: "#CFFAFE"
  on-tertiary-container: "#155E75"
  accent: "#C2410C"
  accent-hover: "#9A3412"
  accent-signal: "#F97316"
  accent-container: "#FFF7ED"
  accent-container-strong: "#FFEDD5"
  on-accent-container: "#9A3412"
  on-accent: "#FFFFFF"
  on-primary: "#FFFFFF"
  danger: "#B42318"
  danger-container: "#FEF3F2"
  neutral: "#475467"
  neutral-container: "#F2F4F7"
  focus: "#2563EB"
  selection: "#DBEAFE"
typography:
  display-proposal:
    fontFamily: Geist
    fontSize: 75px
    fontWeight: 520
    lineHeight: 0.98
    letterSpacing: -0.063em
  display-onboarding:
    fontFamily: Geist
    fontSize: 57px
    fontWeight: 590
    lineHeight: 0.99
    letterSpacing: -0.055em
  display-product:
    fontFamily: Geist
    fontSize: 44px
    fontWeight: 560
    lineHeight: 1.04
    letterSpacing: -0.055em
  headline-page:
    fontFamily: Geist
    fontSize: 38px
    fontWeight: 580
    lineHeight: 1
    letterSpacing: -0.05em
  headline-section:
    fontFamily: Geist
    fontSize: 27px
    fontWeight: 610
    lineHeight: 1.05
    letterSpacing: -0.04em
  title-card:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 680
    lineHeight: 1.3
    letterSpacing: -0.03em
  body-large:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
    fontFeature: '"ss01" 1, "cv11" 1'
  body-default:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
    fontFeature: '"ss01" 1, "cv11" 1'
  body-small:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0em
  label-ui:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0em
  eyebrow:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: 780
    lineHeight: 1.2
    letterSpacing: 0.14em
  metadata-mono:
    fontFamily: Geist Mono
    fontSize: 9px
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: 0.08em
rounded:
  document: 3px
  brand-glyph: 9px
  sm: 10px
  control: 11px
  compact-card: 13px
  card: 16px
  modal: 20px
  lg: 24px
  xl: 32px
  full: 99px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  "2xl": 32px
  "3xl": 48px
  "4xl": 64px
  "5xl": 84px
components:
  app-canvas:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-default}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: 20px
  panel-subtle:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
    padding: 20px
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
    padding: 17px
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-brand:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
    padding: 17px
  button-brand-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-trust:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-trust-hover:
    backgroundColor: "{colors.secondary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-clarity:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-clarity-hover:
    backgroundColor: "{colors.tertiary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-soft}"
    typography: "{typography.label-ui}"
    rounded: "{rounded.control}"
    height: 42px
    padding: 17px
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-default}"
    rounded: "{rounded.control}"
    height: 48px
    padding: 14px
  caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.body-small}"
  disclaimer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.metadata-mono}"
  divider:
    backgroundColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
    height: 1px
  divider-soft:
    backgroundColor: "{colors.outline-soft}"
    textColor: "{colors.on-surface}"
    height: 1px
  control-boundary:
    backgroundColor: "{colors.control-outline}"
    height: 1px
  sidebar-nav:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-text}"
    typography: "{typography.label-ui}"
  sidebar-raised:
    backgroundColor: "{colors.sidebar-raised}"
    textColor: "{colors.sidebar-text}"
    rounded: "{rounded.compact-card}"
    padding: 16px
  sidebar-caption:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-muted}"
    typography: "{typography.metadata-mono}"
  brand-glyph:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.brand-glyph}"
    size: 29px
  ai-suggestion:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.control}"
    padding: 13px
  selected-card:
    backgroundColor: "{colors.primary-container-strong}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.compact-card}"
    padding: 16px
  avatar:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.control}"
    size: 36px
  security-banner:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.compact-card}"
    padding: 16px
  status-published:
    backgroundColor: "{colors.secondary-container-strong}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
    height: 26px
  status-viewed:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.full}"
    height: 26px
  status-positive:
    backgroundColor: "{colors.tertiary-container-strong}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.full}"
    height: 26px
  clarity-signal:
    backgroundColor: "{colors.tertiary-signal}"
    rounded: "{rounded.full}"
    size: 5px
  status-warning:
    backgroundColor: "{colors.accent-container}"
    textColor: "{colors.on-accent-container}"
    rounded: "{rounded.full}"
    height: 26px
  status-warning-dot:
    backgroundColor: "{colors.accent-signal}"
    rounded: "{rounded.full}"
    size: 5px
  attention-card:
    backgroundColor: "{colors.accent-container-strong}"
    textColor: "{colors.on-accent-container}"
    rounded: "{rounded.compact-card}"
    padding: 16px
  status-danger:
    backgroundColor: "{colors.danger-container}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    height: 26px
  status-info:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
    height: 26px
  status-neutral:
    backgroundColor: "{colors.neutral-container}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    height: 26px
  status-neutral-dot:
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    size: 5px
  focus-indicator:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.on-primary}"
    size: 3px
  text-selection:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.on-surface}"
---

# Kapsam Product Design System

## Overview

### Product purpose

Kapsam is a Turkish clickable product prototype for freelance software developers and freelance UI/UX or web designers. It helps a freelancer prepare a professional proposal, share it as a link, monitor approximate viewing signals, and create an editable follow-up message draft.

The product name is **Kapsam**. In the interface, render the wordmark exactly as **`kapsam.`** with a lowercase word and terminal period.

The source value proposition is:

> Daha hızlı ve tutarlı teklif hazırla, bağlantı olarak paylaş, yaklaşık görüntülenme durumunu gör ve doğru zamanda kullanabileceğin takip mesajını üret.

The short positioning line is:

> Profesyonel teklif hazırla, bağlantı olarak gönder, müşterinin yaklaşık görüntülenme durumunu gör.

Keep all product UI and customer-facing copy in Turkish. Preserve Turkish characters and the existing direct second-person voice: concise, calm, helpful, and transparent.

### What dominates the design

Kapsam is organized by a **proposal lifecycle**, not by a generic SaaS section template and not by a CRM pipeline:

1. Set up profile and brand.
2. Create and clarify the proposal.
3. Preview the exact customer document.
4. Publish and create a share link.
5. Observe approximate view signals and customer response.
6. Prepare an editable follow-up draft.

The README leads with proposal preparation. Therefore, the **four-step proposal editor and its live customer preview are the primary product surface**. Sharing, viewing, response, and follow-up come next. Aggregate metrics are supporting context, never the main story.

On the dashboard, lead with an actionable proposal signal—such as **“NovaWorks teklifin bugün 2 kez görüntülendi. Takip etmek için iyi bir zaman olabilir.”**—before KPI cards. What needs attention comes before what merely measures.

### Implemented screens and navigation

Use the current implemented screen set:

- Three-step profile and brand onboarding.
- **Genel bakış** dashboard.
- **Teklifler** list with search and status filters.
- **Yeni teklif** four-step editor: **Müşteri & proje**, **Kapsam**, **Fiyatlandırma**, **İncele & yayınla**.
- Proposal detail with share-link state, view summary, activity timeline, and AI follow-up assistant.
- Owner preview of the customer proposal.
- Account-free public customer proposal with accept, reject, and message actions.
- Revoked-link error state.

Use these proposal statuses exactly: **Taslak**, **Yayınlandı**, **Görüntülendi**, **Kabul edildi**, **Reddedildi**, **Süresi doldu**, **Erişim iptal edildi**. The broader production model separates publication, viewing, decision, and access, so never imply that one badge is the entire legal or operational state.

### Canonical content

Start with the populated synthetic content already in the app. Never substitute lorem ipsum, “Acme,” “Project Name,” round-number fake metrics, or new customer names.

Profile:

- Name: **Deniz Kaya**
- Profession: **Freelance UI/UX & Web Designer**
- Brand: **Kaya Studio**
- Email: **deniz@kayastudio.co**
- Default currency: **TRY**, displayed as **TL** where appropriate

Primary proposal:

- Client: **Mert Yılmaz**
- Company: **NovaWorks Teknoloji A.Ş.**
- Project: **NovaWorks SaaS Web Sitesi Yenileme**
- Summary: **B2B SaaS ürününü daha net anlatan, demo talebini artırmaya odaklı responsive web sitesi yenilemesi.**
- Scope: **Mevcut deneyimin analizi, bilgi mimarisinin yenilenmesi, ana kullanıcı akışlarının wireframe ve yüksek çözünürlüklü arayüz tasarımları.**
- Deliverables: **Keşif atölyesi**, **Bilgi mimarisi ve wireframe**, **8 sayfa UI tasarımı**, **Responsive component library**, **Figma handoff**
- Exclusions: **Frontend geliştirme**, **Metin yazarlığı**, **Hosting ve domain**, **Ücretli stok lisansları**
- Duration: **5 hafta**
- Start date: **25 Temmuz 2026**
- Valid until: **31 Temmuz 2026**
- Revision allowance: **2 revizyon turu**
- Tax: **KDV hariç**
- Payment plan: **%50 proje başlangıcında, %30 tasarım onayında, %20 final tesliminde.**
- Additional term: **Takvim, müşteri geri bildirimlerinin iki iş günü içinde paylaşılması varsayımıyla planlanmıştır.**

Service items:

| Hizmet açıklaması | Adet | Birim fiyat | Tutar |
|---|---:|---:|---:|
| UX keşif ve bilgi mimarisi | 1 | 18.000 TL | 18.000 TL |
| 8 sayfa UI tasarımı | 1 | 36.000 TL | 36.000 TL |
| Responsive component library | 1 | 12.000 TL | 12.000 TL |
| **Proje toplamı** |  |  | **66.000 TL** |

When a proposal list is required, use the current rows:

| Teklif | Müşteri | Tutar | Oluşturulma | Son görüntülenme | Durum |
|---|---|---:|---|---|---|
| NovaWorks SaaS Web Sitesi | NovaWorks Teknoloji | 66.000 TL | 15 Tem 2026 | Bugün, 14:18 | Görüntülendi |
| Finovo Mobil Ürün Tasarımı | Finovo | 92.500 TL | 12 Tem 2026 | Dün, 17:04 | Kabul edildi |
| Atlas Yönetim Paneli | Atlas Lojistik | 48.000 TL | 9 Tem 2026 | Henüz görüntülenmedi | Yayınlandı |
| Mori Marka Sitesi | Mori Coffee | 34.000 TL | 5 Tem 2026 | 8 Tem, 09:32 | Reddedildi |
| Koru Tasarım Sistemi | Koru Health | 54.000 TL | 1 Tem 2026 | Henüz görüntülenmedi | Taslak |

Follow-up scenarios are **Görüntülendi, yanıt bekleniyor**, **Henüz görüntülenmedi**, **Geçerlilik süresi dolmak üzere**, **Fiyat pazarlığı**, and **Kapsam açıklaması**. Tones are **Profesyonel**, **Samimi**, **Kısa**, and **Daha ikna edici**.

### Non-negotiable product language

Keep these trust statements visible in their relevant contexts:

- **AI fiyat belirlemez ve mevcut metnini onayın olmadan değiştirmez.**
- **Görüntülenme verileri botlar, bağlantı önizlemeleri, gizlilik ayarları ve teknik engeller nedeniyle yaklaşık olabilir.**
- **Bu belge fatura yerine geçmez.**
- A public link response is not an electronic signature or legal identity verification.
- Copying a link does not mean the proposal was automatically sent.
- Follow-up messages are drafts that can be edited and copied; they are not sent automatically.
- Revoking a link preserves historical views and responses.
- Duplicating a proposal creates a draft and does not copy views or responses.

### Current prototype boundary

This repository currently implements a synthetic, same-browser prototype. Profile and draft data use local browser storage, and the demo share link uses `#musteri-teklifi`. Do not visually claim that the current build has real authentication, a production database, RLS, a live AI provider, payments, email or WhatsApp delivery, PDF export, CRM, or cross-device persistence.

Future production behavior is documented in `plan.md`; it is a goal and roadmap, not proof of implementation.

### Source-of-truth files

Use this precedence when information conflicts:

1. `prototype/app/prototype-app.tsx` — implemented product copy, synthetic data, workflows, states, and interactions.
2. `prototype/app/globals.css` — implemented layout, responsive behavior, component geometry, typography, and motion; its legacy forest/coral color values are superseded by this file.
3. `README.md` — current prototype purpose, leading feature order, scope, and limitations.
4. `prototype/app/page.tsx` and `prototype/app/layout.tsx` — Turkish language, product metadata, descriptions, and noindex behavior.
5. `prototype/tests/rendered-html.test.mjs` — non-negotiable rendered content, safety, and accessibility contracts.
6. `plan.md` — future product thesis, production architecture, and roadmap only.

`prototype/db/schema.ts` is intentionally empty. `prototype/examples/d1` is a generic framework example, not Kapsam content. The framework-default `prototype/public/favicon.svg` and the generic `file.svg`, `globe.svg`, and `window.svg` assets are not part of the Kapsam identity.

**Color precedence exception:** the `## Colors` section and YAML color tokens in this file are the new source of truth. Do not reintroduce the current CSS palette's forest green, coral, mint, or sand values when generating a design. Continue to inherit the existing layout, spacing, typography, shape, and interaction patterns.

### Design goals

- Make a complex commercial proposal feel structured, calm, and quick to complete.
- Make the customer-facing proposal feel like a carefully typeset document, not an admin page.
- Keep source, preview, and published document visually connected so users trust what will be shared.
- Make approximate tracking and irreversible or terminal actions explicit without alarmist styling.
- Present AI as a bounded assistant: field-selective, editable, approval-based, and visually subordinate to the freelancer's judgment.
- Express comfort and versatility through purple, trust through blue, productivity and clarity through cyan, and excitement through deliberately scarce orange actions and highlights.
- Preserve a professional Turkish-market context through Turkish copy, TL display, clear payment terms, and honest legal limits.
- Remain usable from a 320px viewport upward and preserve keyboard, focus, reduced-motion, and screen-reader behavior.

## Colors

The visual world is cool-spectrum editorial SaaS: purple for comfort and versatility, blue for trust, cyan for productivity and clarity, and orange for excitement and high-attention actions. White proposal paper sits on a very light blue-lavender canvas. The result should feel confident, dynamic, and clear without becoming neon, playful, or rainbow-like.

### Color psychology and semantic roles

- **Purple — comfort and versatility:** brand identity, onboarding, editable or selected states, flexible AI assistance, and brand-led secondary actions. Core values are `#6D28D9`, darker `#5B21B6`, and the soft containers `#F5F3FF` / `#EDE9FE`.
- **Blue — trust:** navigation, security and share-link surfaces, publication state, trusted customer-facing controls, and structural information. Core values are `#1D4ED8`, darker `#1E40AF`, and the containers `#EFF6FF` / `#DBEAFE`.
- **Cyan — productivity and clarity:** live preview, progress, tracking, completed states, AI clarity, and data marks. Use accessible `#0E7490` or `#155E75` for text and controls; reserve brighter `#06B6D4` for non-text signals. Containers are `#ECFEFF` / `#CFFAFE`.
- **Orange — excitement and attention:** the most important CTA, deadlines, “needs attention” signals, document indexes, eyebrows, and limited text highlights. Use accessible `#C2410C` for white-label buttons or text on white, `#9A3412` for hover/darker text, and bright `#F97316` only for dots, glows, or non-text graphics. Containers are `#FFF7ED` / `#FFEDD5`.

Orange is an accent layer, not part of the cool brand gradient. Its separation from the adjacent purple–blue–cyan family is what creates visual priority.

### Neutral and safety colors

- **Canvas (`#F6F8FC`)**: default application background with a subtle cool tint.
- **Surface (`#FFFFFF`)** and **subtle surface (`#F1F5F9`)**: cards, forms, modals, and proposal paper.
- **Ink (`#101828`)** and **soft ink (`#344054`)**: primary and secondary text. Brand colors do not replace readable body copy.
- **Muted (`#475467`)**: supporting copy and metadata; do not use it for primary decisions.
- **Outline (`#CBD5E1`)** and **soft outline (`#E2E8F0`)**: decorative structure. Use the stronger control outline `#7B8794` where a field boundary must remain visible.
- **Danger (`#B42318`) / danger container (`#FEF3F2`)**: rejection, revoked access, validation, and destructive confirmation. Red is the only non-brand exception and must remain reserved for safety semantics.
- **Neutral (`#475467`) / neutral container (`#F2F4F7`)**: draft and inactive states.

### Gradient system

Use gradients to show movement between related meanings, not as decoration on every surface:

- **Brand spectrum:** `linear-gradient(120deg, #6D28D9 0%, #1D4ED8 52%, #0E7490 100%)`. Use on the `kapsam.` glyph, major lifecycle progress, and selected brand moments. White normal-size text remains accessible at every endpoint.
- **Deep spectrum:** `linear-gradient(135deg, #5B21B6 0%, #1E40AF 52%, #155E75 100%)`. Use for the onboarding visual, dashboard hero, and public proposal investment block.
- **Soft ambient spectrum:** `linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 52%, #ECFEFF 100%)`. Use for AI panels, gentle page atmosphere, and large low-contrast background fields.
- **Orange action gradient:** `linear-gradient(135deg, #C2410C 0%, #9A3412 100%)`. Use only for the highest-priority CTA when a gradient is needed; solid `#C2410C` remains the default fallback.
- **Orange attention glow:** use `#F97316` at `12–18%` opacity fading to transparent around an attention card or notification dot.

Keep most cards white. A single composition should normally contain one dominant cool gradient and one small orange priority signal. Do not place long body copy over a gradient. Dark spectrum surfaces are fixed compositional sections, not a global dark theme.

## Typography

Use **Geist** for all interface and document typography, with **Inter**, `ui-sans-serif`, `system-ui`, and `sans-serif` only as fallbacks. Enable the existing `ss01` and `cv11` OpenType features. Use **Geist Mono** only for step numbers, proposal IDs, counters, compact dates, metadata, and document section indexes.

The core contrast is between restrained UI typography and an editorial proposal document:

- Public proposal hero: responsive `42–75px`, weight `520`, line-height `0.98`, tracking `-0.063em`.
- Onboarding hero: responsive `37–57px`, weight `590`, line-height `0.99`, tracking `-0.055em`.
- Dashboard/editor hero: responsive `27–44px`, weight `530–560`, tight tracking around `-0.05em`.
- Application page title: responsive `26–38px`, weight `580`, line-height `1`.
- Public document section title: responsive `28–46px`, weight `540`, line-height `1.05`.
- Public document body: `14–18px`, line-height `1.7–1.75`.
- Dense application body and controls: primarily `10–14px`.
- Eyebrows: `10px`, weight `780`, uppercase, `0.14em` tracking, usually accessible orange `#C2410C`.
- Mono metadata: typically `8–10px` with `0.08–0.10em` tracking.

Use low-to-medium display weights rather than heavy bold. Let scale, whitespace, and tight tracking create authority. Use heavier `650–780` weights for compact labels and controls.

Existing dashboard metadata can be as small as `8–10px`, but never use micro type for a primary action, legal meaning, form value, or essential status. Preserve legibility and WCAG 2.2 AA as the production goal.

## Layout

### Spatial rhythm

The code uses a loose four-pixel rhythm with compact local values. For new work, prefer the normalized spacing tokens in the front matter. Existing practical ranges are:

- Application page gutter: `24–48px` desktop, `18px` below `760px`.
- Card padding: `15–39px` depending on hierarchy.
- Grid gaps: `12–20px`.
- Form spacing: `16–19px`.
- Public document section spacing: `55–92px`.

Do not make every section equally spacious. The app shell is compact and operational; the public proposal is generous and editorial.

### Application shell

- Desktop: sticky `248px` deep navy sidebar (`#12142A`) with a restrained purple/blue radial glow, plus fluid content.
- The sidebar holds the brand, **Çalışma alanı** navigation, account links, free-plan quota, and the **Deniz Kaya / Kaya Studio** profile chip.
- Main content starts with a narrow **ETKİLEŞİMLİ PROTOTİP** disclosure bar, then a page header.
- At `760px` and below, remove the desktop sidebar and use the existing fixed, blurred, three-item bottom navigation.

### Screen compositions

- **Onboarding:** two columns at large widths. Left is a focused three-step form; right is a `32px`-radius deep purple→blue→cyan presentation panel with a slightly rotated paper proposal, subtle orbit shapes, a blue view notification, and a cyan-led AI-draft notification. Stack to one column below `980px`.
- **Dashboard:** deep spectrum welcome/action panel first; four metric cards second; recent proposals and **İlgilenmen gerekenler** below in an approximately `1.55fr / 0.85fr` grid. Use one small orange attention signal inside the hero rather than coloring the entire hero orange. Metrics become two columns below `1180px` and one column below `560px`.
- **Proposal list:** compact panel, filter tabs and search toolbar, then a structured table. On narrow screens, stack toolbar controls and hide lower-priority columns before compromising legibility.
- **Proposal editor:** sticky translucent top bar; editorial heading and bounded AI entry point; four-step horizontal stepper; form and sticky live-preview split at approximately `1.25fr / 0.75fr`. Stack the preview below the form under `980px`.
- **Proposal detail:** title/actions, share-link banner, three view-summary cards, transparency notice, then activity timeline and AI follow-up assistant. Actionable state and history outrank decoration.
- **Public proposal:** narrow blue trust/security or owner-preview strip, brand/contact header, centered `1020px` white document, oversized hero, numbered sections, deep spectrum investment block, terms, and customer response actions. The document itself uses a restrained `3px` radius so it reads like paper rather than a dashboard card.

### Responsive breakpoints

Use the implemented breakpoints: `1180px`, `980px`, `760px`, and `560px`. Respect safe-area insets for the mobile bottom navigation. Minimum supported viewport width is `320px`.

## Elevation & Depth

Depth is quiet and functional. Prefer thin borders, tonal surface changes, and only then a soft shadow.

- Small: `0 1px 2px rgb(16 24 40 / 5%), 0 8px 24px rgb(16 24 40 / 6%)` for normal cards and controls.
- Medium: `0 18px 48px rgb(16 24 40 / 12%)` for stronger floating surfaces.
- Large: `0 32px 80px rgb(16 24 40 / 20%)` for modals and prominent overlays.
- Public proposal paper: `0 20px 70px rgb(16 24 40 / 10%)`.
- Sticky bars may use translucent white with `backdrop-filter: blur(15px)`.

Use large shadows only where the layer actually floats. Tables, status pills, timelines, and form groups should rely on borders or tonal backgrounds instead.

Decorative depth comes from subtle purple, blue, and cyan radial gradients plus large low-opacity circular/orbit shapes in dark hero areas. Orange may appear only as a small `12–18%` attention glow. Keep all shapes behind content and never let them compete with proposal text.

## Shapes

Kapsam is softly geometric:

- Form controls and buttons: about `11px` radius.
- Compact cards and choice rows: about `13px` radius.
- Standard panels and metric cards: `16px` radius.
- Modals: `20px` radius.
- Major hero/editor containers: `24px` radius.
- Onboarding presentation panel: `32px` radius.
- Status pills, progress tracks, and dots: fully rounded.
- Public proposal paper: only `3px` radius.

The distinctive brand motif is an **asymmetric rounded square**: the purple-led spectrum `k` glyph uses `9px 9px 9px 3px` corners. Repeat this asymmetric lower-left corner on brand and proposal monograms. Do not replace it with a generic circle or a symmetric app-icon tile.

Use circles mainly for status dots, timeline nodes, progress ornaments, and background orbits—not as the default container for every icon.

## Components

### Brand mark and iconography

- Render an asymmetric tile containing a white lowercase **`k`**, followed by **`kapsam.`**. Use the purple→blue→cyan brand spectrum gradient; solid `#6D28D9` is the fallback.
- Standard glyph size is `29px`; the wordmark is `21px`, weight about `770`, tracking `-0.045em`.
- No icon library is installed. The implemented language uses restrained text glyphs such as `✦`, `◇`, `↗`, `⌕`, `◌`, `×`, `✓`, arrows, and numerals.
- Keep icon strokes visually light and labels explicit. Never rely on a symbol alone for a destructive or legal action.

### Buttons

- Default button height: `42px`; large onboarding button: `52px`.
- Primary attention action: orange `#C2410C` fill, white label, `11px` radius, `14px`/`650` text, and a subtle orange shadow. Hover uses `#9A3412`; the optional action gradient runs only between those two accessible tones.
- Brand action: purple `#6D28D9` or the cool brand spectrum gradient. Use for onboarding, versatile/creative choices, and brand-led secondary actions—not for the page's most urgent CTA.
- Trust action: blue `#1D4ED8`. Use for publishing, sharing, security, and customer-facing trust actions when orange would imply urgency.
- Clarity action: cyan `#0E7490`. Use sparingly for live preview, progress, and productivity actions.
- Ghost: white fill, outline border, soft-ink label.
- Soft: pale lavender, blue, or cyan container fill chosen by semantic role, with a dark accessible label.
- Dark: deep purple→blue→cyan spectrum with white label; reserve for strong compositional actions within light surfaces.
- Danger: danger fill and white label; use only after the destructive context is clear.
- Pressed state moves down `1px`. Solid hover transitions are about `160ms`; gradient state crossfades take `180–240ms`.
- Public accept, reject, and message actions must remain three semantically distinct buttons.

### Forms and multi-step editing

- Labels sit above fields in soft ink at `13px`/`660`.
- Inputs and selects are at least `48px` high, white, `11px` radius, with a quiet outline.
- Focus uses a blue border plus a visible ring. Global keyboard focus remains a `3px #2563EB` outline with `3px` offset; orange remains reserved for action priority rather than navigation focus.
- Helper text follows the field in muted `11px` copy.
- Validation stays adjacent to the field and also appears in the publish checklist. Use the exact summary heading **Yayınlamadan önce tamamla**.
- The stepper uses numbered mono tiles; active is blue or the cool brand spectrum with white text, completed is cyan, and future is neutral.
- Price rows show service description, quantity, unit price, and amount. Keep the running **Proje toplamı** visible.

### AI assistant

- Use the `✦` spark with a cyan-led clarity treatment. AI panels may use the soft purple→blue→cyan ambient gradient, with solid cyan as fallback; orange is not an AI color.
- AI entry points are bounded cards or side panels, never a full-screen replacement for the proposal form.
- Suggestions are field-specific checkbox cards. The user chooses which suggestions apply.
- Show loading as a gentle spark pulse and three small dots.
- Keep the guardrail **AI fiyat belirlemez ve mevcut metnini onayın olmadan değiştirmez.** next to the action.
- If a user-edited follow-up exists, confirmation is required before replacing it.

### Cards, tables, and status

- Standard panels use white surface, soft outline, `16px` radius, and the small shadow.
- Metric cards have one dominant value, one label, and a restrained bar, progress line, avatar stack, or supporting note. Do not add decorative charts with invented data.
- Proposal rows use client/project content first, then amount and status. Hover is a barely cooler lavender-blue surface.
- Status pills always combine color with a dot and text label.
- Status mapping: **Yayınlandı** uses blue; **Görüntülendi** uses cyan; **Kabul edildi** uses the stronger cyan container with a check and explicit label; **Yanıt bekleniyor** or **Süresi doldu** uses orange; **Reddedildi** or **Erişim iptal edildi** uses danger red; **Taslak** uses neutral. Color never replaces the dot, icon, and text label.
- Timeline items use circular nodes, a `1px` connecting rule, a concrete event title, honest explanation, and timestamp.

### Public proposal document

- Preserve the sequence **hero → facts → project approach → scope and deliverables → investment → working terms → next step**.
- Use accessible orange mono section indexes `01–04` and uppercase document labels.
- Deliverables appear as a two-column grid of bordered cards on desktop and one column on mobile.
- The investment section is a full-width deep purple→blue→cyan spectrum block inside the paper document. The total receives the largest typographic emphasis in that section.
- The final response area supports **Teklifi kabul et**, **Teklifi reddet**, and **Mesaj bırak**, each followed by clear confirmation behavior.
- Keep **Bu belge fatura yerine geçmez.** in the preview and public footer.

### Empty, error, modal, and toast states

- Empty search uses **Eşleşen teklif bulunamadı** and offers **Filtreleri temizle**.
- Revoked or expired public access uses **Bu teklif artık erişilebilir değil.** without leaking proposal content.
- Modals are white, `20px` radius, maximum `470px` wide, with a meaning-specific icon tile and explicit cancel/confirm buttons.
- Toasts use a deep navy surface. Their icon tile follows meaning: cyan for success/clarity, blue for information, orange for attention/action, and red for danger. Position bottom-right on desktop and above the mobile nav on small screens.
- Critical errors must not be communicated only by toast.

### Motion and accessibility

- Standard transitions: `140–160ms` for color, border, transform, and shadow.
- Cool-spectrum gradient states crossfade over `180–240ms`; avoid constant animated gradients on operational screens.
- Modal and toast entrances: `160–200ms` with a small fade/vertical movement.
- AI pulse: `1.5s`; loading dots: `1s`.
- Under `prefers-reduced-motion: reduce`, effectively disable animations, gradient movement, transitions, and smooth scrolling.
- Preserve visible focus, keyboard navigation, modal focus trap and focus return, ARIA states, live regions, and screen-reader-only labels.
- Do not communicate status through color alone.

## Do's and Don'ts

### Do

- Read the source-of-truth files before generating or revising any screen.
- Treat this file's purple–blue–cyan–orange palette as an intentional override of the current prototype CSS colors.
- Use the exact Turkish product name, labels, values, statuses, and synthetic proposal content already in the repository.
- Organize screens around the proposal lifecycle and the user's next meaningful action.
- Make proposal creation and customer preview visually dominant; keep aggregate metrics secondary.
- Keep the dashboard compact and operational, while giving the customer proposal editorial scale and whitespace.
- Use purple for comfort/versatility, blue for trust, cyan for productivity/clarity, and orange for scarce high-attention actions and text highlights.
- Preserve explicit boundaries: approximate tracking, user-approved AI, no automatic sending, no electronic-signature claim, and no invoice claim.
- Show loading, empty, error, disabled, validation, confirmation, success, rejected, and revoked states where the current flow calls for them.
- Keep desktop and mobile compositions recognizably the same product.
- Validate all normal text and interactive states against WCAG 2.2 AA. Use the accessible solid fallbacks for every gradient component and never place normal text on `#06B6D4` or `#F97316`.

### Don't

- Do not invent customer names, proposal copy, prices, dates, metrics, feature names, testimonials, logos, photography, or placeholder text.
- Do not use the framework-default favicon or the generic `file.svg`, `globe.svg`, or `window.svg` assets as brand direction.
- Do not turn the palette into a rainbow, neon spectrum, monochrome corporate-blue interface, glass-heavy dashboard, or generic fintech style.
- Do not mix orange into the purple→blue→cyan brand gradient; orange must remain a separate priority signal.
- Do not use bright cyan `#06B6D4` or bright orange `#F97316` for normal-size text or white-label buttons.
- Do not turn Kapsam into a CRM, Kanban board, lead pipeline, project manager, calendar, finance app, invoice tool, or autonomous communication platform.
- Do not add real-auth, payment, email, WhatsApp, PDF, cross-device sync, or database success states to the current prototype unless a separate prompt explicitly asks for a future production design.
- Do not let AI write or imply a final price, silently replace user text, or apply all suggestions without selection.
- Do not claim a proposal was read by a verified person; views are approximate signals.
- Do not make every card, section, or icon equally rounded, elevated, or colorful.
- Do not use micro typography for essential content or hide legal meaning in low-contrast footnotes.
- Do not remove the public proposal's trust notices, invoice disclaimer, or response confirmations for visual simplicity.
