# Landing Design QA

- Source visual truth: `/Users/cagan/.codex/generated_images/019f9194-f5fd-7c30-a9b5-af3d19489538/exec-b3d557d4-6c23-4146-88ed-0dc638011e98.png`
- Implementation route: `/`
- Implementation screenshot: unavailable — browser-rendered capture is pending
- Intended desktop viewport: `1440 × 3035` CSS px, normalized to the source width for comparison
- Source dimensions: `864 × 1821` px
- Implementation dimensions: pending
- Density normalization: pending until the implementation capture exists
- State: light theme, direct traffic, first visit, default form state

## Full-view comparison evidence

The source visual was opened at its original dimensions. The implementation could not be captured in this session because the in-app browser runtime is unavailable and standalone Playwright use requires user approval. A code-only review is not accepted as visual comparison evidence.

## Focused region comparison evidence

Pending. The planned focused comparisons are the hero/product window, the four “Nasıl çalışır?” cards, the product-preview stage, and the pricing/waitlist panel.

## Findings

- [Blocked] No browser-rendered implementation screenshot exists yet, so typography, spacing, color, image quality, responsive behavior, and final copy wrapping cannot be compared against the source visual.
- Static checks completed before capture: all product-preview CTAs route to `/demo`; the step cards use consistent Lucide line icons; minimum touch targets were raised; the landing landmarks and form field errors were corrected; the 149/249 TL variant no longer exposes the wrong SSR price before hydration.

## Comparison history

1. Source opened at `864 × 1821` px.
2. Implementation build, TypeScript, lint, and rendered HTML tests passed.
3. Visual comparison paused before iteration 1 because a rendered browser capture is unavailable.

## Required next QA iteration

1. Start the local preview.
2. Capture `/` at desktop and 375 px mobile widths in the user-approved browser.
3. Normalize the desktop capture to the source dimensions.
4. Combine source and implementation captures into one comparison image.
5. Fix any P0/P1/P2 differences, recapture, and repeat until passed.

final result: blocked
