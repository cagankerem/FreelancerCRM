# Implementation Status

Normatif kaynak: [plan.md](./plan.md)  
Son güncelleme: 2026-08-06

## Takip Sistemi

- `[ ]` tamamlanmadı
- `[x]` tamamlandı
- Tamamlanmamış görevlerin sonuna gerektiğinde `— Devam ediyor`, `— Kısmi` veya `— Bloke` eklenir.
- Anlamlı bir gelişme olduğunda görevin altına tarihli tek satır yazılır.
- Kabul kriterleri burada tekrarlanmaz; `plan.md` içinde tutulur.

## Faz 0: Kodlamadan Önce

- [ ] TASK-001: Problem görüşmesi protokolünü hazırla
- [ ] TASK-002: En az 20 problem görüşmesi yürüt
- [ ] TASK-003: Teklif örneklerini anonimleştir ve sınıflandır
- [ ] TASK-004: Landing page ve bekleme listesi oluştur — Kısmi
  - 2026-08-06: Landing hazır; gerçek waitlist kaydı ve production deney ölçümü henüz bağlı değil.
- [ ] TASK-005: Fiyat ve ödeme isteği deneyini kur
- [ ] TASK-006: Tıklanabilir prototipi test et — Kısmi
  - 2026-08-06: Tıklanabilir prototip hazır; persona testleri ve test raporu henüz bulunmuyor.
- [ ] TASK-007: Concierge MVP yürüt
- [ ] TASK-008: Public token ve erişim spike'ı
- [ ] TASK-009: RLS spike'ı
- [ ] TASK-010: Görüntülenme takibi spike'ı
- [ ] TASK-011: AI yapılandırılmış çıktı ve maliyet spike'ı
- [ ] TASK-012: Faz 0 kanıt ve geçiş raporu

## Faz 1A: Proje Temeli

- [ ] TASK-013: Next.js ve strict TypeScript temelini kur — Kısmi
  - 2026-08-06: Next.js, React ve strict TypeScript mevcut; production runtime ve server/client sınırları kesinleşmedi.
- [ ] TASK-014: Tailwind, shadcn ve form temelini kur — Kısmi
  - 2026-08-06: Tailwind ve temel UI bileşenleri mevcut; React Hook Form, Zod ve ortak form altyapısı eksik.
- [ ] TASK-015: Supabase, ortam ve local geliştirmeyi yapılandır
- [ ] TASK-016: Test ve CI kapılarını kur — Kısmi
  - 2026-08-06: Build ve temel rendered HTML testleri mevcut; CI, migration, unit, integration ve E2E kapıları eksik.
- [ ] TASK-017: Correlation ID ve güvenli logger kur

## Faz 1B: Auth ve Profil

- [ ] TASK-018: Kayıt, giriş ve çıkış akışlarını geliştir
- [ ] TASK-019: Şifre sıfırlama, session ve korumalı rotaları geliştir
- [ ] TASK-020: Profil şeması ve RLS migration'ını oluştur
- [ ] TASK-021: Onboarding ve profil/marka UI'sini geliştir
- [ ] TASK-022: Güvenli logo yüklemeyi geliştir

## Faz 1C: Teklif Veri Modeli

- [ ] TASK-023: Clients migration ve RLS oluştur
- [ ] TASK-024: Proposal, section ve item migration'larını oluştur
- [ ] TASK-025: View, response, AI, subscription ve log migration'larını oluştur
- [ ] TASK-026: Tam RLS matrisi ve testlerini uygula
- [ ] TASK-027: Minimum müşteri oluşturma/seçme işlemlerini geliştir
- [ ] TASK-028: Teklif taslak CRUD işlemlerini geliştir
- [ ] TASK-029: Teklif durum makinesini uygula

## Faz 1D: Teklif Oluşturucu

- [ ] TASK-030: Tüm alanlı teklif formunu geliştir
- [ ] TASK-031: Hizmet kalemi ve fiyat özetini geliştir
- [ ] TASK-032: Taslak kaydetme ve düzenlemeyi tamamla
- [ ] TASK-033: Teklif çoğaltmayı geliştir
- [ ] TASK-034: Teklif önizlemesini geliştir

## Faz 1E: AI Teklif Üretimi

- [ ] TASK-035: AI sağlayıcı adaptörü ve promptları geliştir
- [ ] TASK-036: AI endpoint, Zod ve limitleri geliştir
- [ ] TASK-037: Düzenlenebilir AI paneli ve güvenli merge geliştir
- [ ] TASK-038: AI kota, maliyet, log ve fallback geliştir

## Faz 1F: Public Teklif Sayfası

- [ ] TASK-039: Yayınlama, token, iptal ve expiry işlemlerini geliştir
- [ ] TASK-040: Public teklif resolver'ı geliştir
- [ ] TASK-041: Responsive public teklif sayfasını geliştir
- [ ] TASK-042: Kabul ve ret işlemlerini geliştir
- [ ] TASK-043: Public müşteri mesajını geliştir

## Faz 1G: Görüntülenme Takibi

- [ ] TASK-044: Görüntülenme event kaydını geliştir
- [ ] TASK-045: Görüntülenme özeti, geçmişi ve uyarıyı geliştir

## Faz 1H: Teklif Listesi ve Detay

- [ ] TASK-046: Teklif listesi, filtre ve sayfalamayı geliştir
- [ ] TASK-047: Teklif detayını ve sahip aksiyonlarını geliştir

## Faz 1I: AI Takip Mesajları

- [ ] TASK-048: AI takip mesajı backend'ini geliştir
- [ ] TASK-049: Takip mesajı düzenleme ve kopyalama UI'sini geliştir

## Faz 1J: Plan ve Ödeme Sistemi

- [ ] TASK-050: Entitlement ve kota servisini geliştir
- [ ] TASK-051: Dürüst fiyatlandırma ve plan UI'sini geliştir
- [ ] TASK-052: Ödeme adaptörü ve hosted checkout geliştir
- [ ] TASK-053: İmzalı ve idempotent ödeme webhook'unu geliştir
- [ ] TASK-054: Abonelik yaşam döngüsü ve downgrade geliştir

## Faz 1K: KVKK, Güvenlik ve Yayına Hazırlık

- [ ] TASK-055: Hukuki sayfaları ve takip/fatura bildirimlerini hazırla
- [ ] TASK-056: Analitik pipeline ve event sözlüğünü geliştir
- [ ] TASK-057: Hesap ve veri silmeyi geliştir
- [ ] TASK-058: Rate limit ve güvenlik sertleştirmesini tamamla
- [ ] TASK-059: Hata sağlayıcısı, health, metric ve alarmları kur
- [ ] TASK-060: Performans ve erişilebilirliği tamamla
- [ ] TASK-061: Tam regression, RLS, güvenlik ve yük testini çalıştır
- [ ] TASK-062: Production deployment ve runbook'u tamamla

## Faz 2: Doğrulama Sonrası

- [ ] TASK-063: Faz 2 kanıt kapısını değerlendir
