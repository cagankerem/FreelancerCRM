# Implementation Status

Normatif kaynak: [plan.md](./plan.md)  
Son güncelleme: 2026-08-20

## Takip Sistemi

- `[ ]` tamamlanmadı
- `[x]` tamamlandı
- Tamamlanmamış görevlerin sonuna gerektiğinde `— Devam ediyor`, `— Kısmi` veya `— Bloke` eklenir.
- Anlamlı bir gelişme olduğunda görevin altına tarihli tek satır yazılır.
- Kabul kriterleri burada tekrarlanmaz; `plan.md` içinde tutulur.

## Faz 1A: Proje Temeli

- [x] TASK-001: Next.js ve strict TypeScript temelini kur
  - 2026-08-06: Next.js, React ve strict TypeScript mevcut; production runtime ve server/client sınırları kesinleşmedi.
  - 2026-08-11: Native Next.js dev/production runtime, kök komutları ve rota smoke testleri tamamlandı; Vinext/Cloudflare/Sites/Vite/Wrangler ile boş D1/SQLite-Drizzle iskeleti kaldırıldı, server-only guard ve bundle sınırı testi eksik.
  - 2026-08-17: Server/client/shared import kuralları dokümante edilip otomatik import-grafiği ve negatif Next.js build testiyle zorunlu kılındı; dev/production build, root smoke, lint ve strict typecheck geçti.
  - 2026-08-20: Next.js ve eslint-config-next 16.3.1’e yükseltildi; lint, typecheck, production build, 8 test ve production/tam bağımlılık auditleri geçti.
  - 2026-08-20: Tek normatif `apps/web/package-lock.json`, kökten temiz `npm ci`, standart Next.js tipleri ve gerekçeli type-boundary politikası otomatik foundation testleriyle doğrulandı; tarayıcı/DOM sınırlarındaki doğrulanmamış type assertion’lar runtime daraltmayla kaldırıldı.
  - 2026-08-20: TASK-001 için temiz kurulum, lint, strict typecheck, tekrarlı production build, tam test seti, browser bundle sızıntı kontrolü ve `/` ile `/demo` development/production smoke kontrollerini birleştiren tek komutluk kabul seti eklendi.
  - 2026-08-20: Kök mimari belgesi; dizin yapısı, Server/Client Component ve secret sınırları, sentetik `/demo` ile ayrı geliştirilecek production `/app` ayrımı, çalışma komutları ve TASK-003 Supabase yerleşimiyle tamamlandı.
- [ ] TASK-002: Tailwind, shadcn ve form temelini kur — Kısmi
  - 2026-08-06: Tailwind ve temel UI bileşenleri mevcut; React Hook Form, Zod ve ortak form altyapısı eksik.
  - 2026-08-20: shadcn 4.18.0 tam sürümle devDependency olarak sabitlendi ve tema CSS’inin production build’de çözüldüğü doğrulandı; form altyapısı hâlâ eksik.
  - 2026-08-21: Vitest/jsdom/Testing Library ve Playwright/axe bağımlılıkları exact devDependency olarak sabitlendi; ayrı unit, E2E ve a11y komutları ile smoke testleri eklendi, mevcut node:test seti korundu; a11y kapısı etiketsiz checkbox ve iki kontrast ihlalini açıkça yakalıyor.
- [ ] TASK-003: Supabase, ortam ve local geliştirmeyi yapılandır
- [ ] TASK-004: Test ve CI kapılarını kur — Kısmi
  - 2026-08-06: Build ve temel rendered HTML testleri mevcut; CI, migration, unit, integration ve E2E kapıları eksik.
  - 2026-08-20: Production high/critical bulgularını engelleyen ve tam bağımlılık ağacını ayrıca raporlayan audit politikası plan.md’ye eklendi; kalıcı CI kapısı henüz uygulanmadı.
- [ ] TASK-005: Correlation ID ve güvenli logger kur

## Faz 1B: Auth ve Profil

- [ ] TASK-006: Kayıt, giriş ve çıkış akışlarını geliştir
- [ ] TASK-007: Şifre sıfırlama, session ve korumalı rotaları geliştir
- [ ] TASK-008: Profil şeması ve RLS migration’ını oluştur
- [ ] TASK-009: Onboarding ve profil/marka UI’sini geliştir
- [ ] TASK-010: Güvenli logo yüklemeyi geliştir

## Faz 1C: Teklif Veri Modeli

- [ ] TASK-011: Clients migration ve RLS oluştur
- [ ] TASK-012: Proposal, section ve item migration’larını oluştur
- [ ] TASK-013: View, response, AI, subscription ve log migration’larını oluştur
- [ ] TASK-014: Tam RLS matrisi ve testlerini uygula
- [ ] TASK-015: Minimum müşteri oluşturma/seçme işlemlerini geliştir
- [ ] TASK-016: Teklif taslak CRUD işlemlerini geliştir
- [ ] TASK-017: Teklif durum makinesini uygula

## Faz 1D: Teklif Oluşturucu

- [ ] TASK-018: Tüm alanlı teklif formunu geliştir
- [ ] TASK-019: Hizmet kalemi ve fiyat özetini geliştir
- [ ] TASK-020: Taslak kaydetme ve düzenlemeyi tamamla
- [ ] TASK-021: Teklif çoğaltmayı geliştir
- [ ] TASK-022: Teklif önizlemesini geliştir

## Faz 1E: AI Teklif Üretimi

- [ ] TASK-023: AI sağlayıcı adaptörü ve promptları geliştir
- [ ] TASK-024: AI endpoint, Zod ve limitleri geliştir
- [ ] TASK-025: Düzenlenebilir AI paneli ve güvenli merge geliştir
- [ ] TASK-026: AI kota, maliyet, log ve fallback geliştir

## Faz 1F: Public Teklif Sayfası

- [ ] TASK-027: Yayınlama, token, iptal ve expiry işlemlerini geliştir
- [ ] TASK-028: Public teklif resolver’ı geliştir
- [ ] TASK-029: Responsive public teklif sayfasını geliştir
- [ ] TASK-030: Kabul ve ret işlemlerini geliştir
- [ ] TASK-031: Public müşteri mesajını geliştir

## Faz 1G: Görüntülenme Takibi

- [ ] TASK-032: Görüntülenme event kaydını geliştir
- [ ] TASK-033: Görüntülenme özeti, geçmişi ve uyarıyı geliştir

## Faz 1H: Teklif Listesi ve Detay

- [ ] TASK-034: Teklif listesi, filtre ve sayfalamayı geliştir
- [ ] TASK-035: Teklif detayını ve sahip aksiyonlarını geliştir

## Faz 1I: AI Takip Mesajları

- [ ] TASK-036: AI takip mesajı backend’ini geliştir
- [ ] TASK-037: Takip mesajı düzenleme ve kopyalama UI’sini geliştir

## Faz 1J: Plan ve Ödeme Sistemi

- [ ] TASK-038: Entitlement ve kota servisini geliştir
- [ ] TASK-039: Dürüst fiyatlandırma ve plan UI’sini geliştir
- [ ] TASK-040: Ödeme adaptörü ve hosted checkout geliştir
- [ ] TASK-041: İmzalı ve idempotent ödeme webhook’unu geliştir
- [ ] TASK-042: Abonelik yaşam döngüsü ve downgrade geliştir

## Faz 1K: KVKK, Güvenlik ve Yayına Hazırlık

- [ ] TASK-043: Hukuki sayfaları ve takip/fatura bildirimlerini hazırla
- [ ] TASK-044: Analitik pipeline ve event sözlüğünü geliştir
- [ ] TASK-045: Hesap ve veri silmeyi geliştir
- [ ] TASK-046: Rate limit ve güvenlik sertleştirmesini tamamla
- [ ] TASK-047: Hata sağlayıcısı, health, metric ve alarmları kur
- [ ] TASK-048: Performans ve erişilebilirliği tamamla
- [ ] TASK-049: Tam regression, RLS, güvenlik ve yük testini çalıştır
- [ ] TASK-050: Production deployment ve runbook’u tamamla

## Faz 2: Doğrulama Sonrası

- [ ] TASK-051: Faz 2 kanıt kapısını değerlendir
