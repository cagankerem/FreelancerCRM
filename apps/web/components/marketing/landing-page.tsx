"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileText,
  ListChecks,
  MessageCircle,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { DemoApp } from "@/components/demo/demo-app";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { cn } from "@/lib/shared/utils";

import "./landing-page.css";

type PriceVariant = 149 | 249;

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

const problems = [
  "Eski teklif dosyaları tekrar tekrar kopyalanıyor.",
  "Proje kapsamı, teslim, revizyon ve ödeme ifadelerinde tutarlılık sağlanması gerekiyor.",
  "Gönderilen teklif yalnız yaklaşık bir görüntülenme sinyali üretebiliyor.",
  "Takip mesajı taslağının düzenlenebilir kalması gerekiyor.",
];

const benefits = [
  "AI destekli, düzenlenebilir taslaklarla daha hızlı başlangıç.",
  "Net ve profesyonel ifadelerle daha anlaşılabilir teklifler.",
  "Teklif bağlantısının yaklaşık görüntülenme durumunu tek yerde takip.",
  "Kişiselleştirilmiş takip mesajını dilediğin gibi düzenleme.",
];

const steps = [
  {
    icon: FileText,
    title: "Teklif bilgilerini gir",
    text: "Proje, kapsam, teslim, revizyon ve ödeme detaylarını kısaca paylaş.",
  },
  {
    icon: Sparkles,
    title: "AI’dan düzenlenebilir taslak al",
    text: "AI, tutarlı bir teklif taslağı oluşturur; incele ve düzenlemelerini yap.",
  },
  {
    icon: Send,
    title: "Bağlantı olarak paylaş",
    text: "Teklifini paylaşılabilir bir bağlantı olarak gönder ve yaklaşık sinyalleri gör.",
  },
  {
    icon: MessageCircle,
    title: "Takip mesajını hazırla",
    text: "Kişiselleştirilmiş taslağı düzenle ve istediğin zaman kendi kanalından gönder.",
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    text: "AI fiyat belirlemez; taslak kullanıcı onayıyla uygulanır.",
  },
  {
    icon: Eye,
    text: "Görüntülenme verileri yaklaşık sinyaldir; teklifin kesin okunduğunu veya kişiyi doğrulamaz.",
  },
  {
    icon: PenLine,
    text: "Takip mesajı yalnız taslaktır, otomatik gönderilmez.",
  },
];

const priceFeatures = [
  "Teklif oluşturma ve bağlantıyla paylaşma",
  "Düzenlenebilir AI teklif taslağı",
  "Yaklaşık görüntülenme sinyali",
  "Düzenlenebilir takip mesajı taslağı",
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      className={cn("lp-brand", inverse && "lp-brand--inverse")}
      href="#top"
      aria-label="Kapsam ana sayfa"
    >
      <span className="lp-brand__glyph" aria-hidden="true">
        k.
      </span>
      <span>kapsam.</span>
    </a>
  );
}

function getLandingSource() {
  if (typeof window === "undefined") return "server";

  const campaignSource = new URLSearchParams(window.location.search).get("utm_source")?.trim();
  if (campaignSource) return campaignSource.slice(0, 80);

  try {
    return document.referrer ? new URL(document.referrer).hostname : "direct";
  } catch {
    return "direct";
  }
}

function trackLandingEvent(name: string, detail: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;

  let storedVariant: string | null = null;
  try {
    storedVariant = window.localStorage.getItem("kapsam-alpha-price-v1");
  } catch {
    // Use the explicit event detail when browser storage is unavailable.
  }
  const payload = {
    name,
    occurredAt: new Date().toISOString(),
    source: getLandingSource(),
    priceVariant:
      storedVariant === "149" || storedVariant === "249" ? Number(storedVariant) : "unassigned",
    ...detail,
  };

  try {
    const current: unknown = JSON.parse(
      window.localStorage.getItem("kapsam-alpha-events-v1") ?? "[]",
    );
    const eventLog = Array.isArray(current) ? current : [];
    window.localStorage.setItem(
      "kapsam-alpha-events-v1",
      JSON.stringify([...eventLog.slice(-99), payload]),
    );
  } catch {
    // Event dispatch remains available when browser storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent("kapsam:landing-event", { detail: payload }));
}

function HeroProductWindow() {
  return (
    <div
      className="lp-hero-product"
      role="img"
      aria-label="Teklif listesi, teklif belgesi, yaklaşık görüntülenme sinyali ve takip taslağı içeren ürün önizlemesi"
    >
      <div className="lp-hero-index">
        <div className="lp-mock-heading">
          <span>Tekliflerim</span>
          <span className="lp-mock-plus">+</span>
        </div>
        <div className="lp-index-item lp-index-item--active">
          <strong>Kapsam Web Sitesi</strong>
          <small>24 Temmuz 2026</small>
        </div>
        <div className="lp-index-item">
          <strong>Mobil Uygulama</strong>
          <small>21 Temmuz 2026</small>
        </div>
        <div className="lp-index-item">
          <strong>Dashboard Tasarımı</strong>
          <small>18 Temmuz 2026</small>
        </div>
        <div className="lp-index-item">
          <strong>E-ticaret Arayüzü</strong>
          <small>15 Temmuz 2026</small>
        </div>
      </div>

      <article className="lp-proposal-paper">
        <header className="lp-paper-topline">
          <span className="lp-paper-monogram">k.</span>
          <span>Teklif No: TR-2026-0724-01</span>
        </header>
        <div className="lp-paper-copy">
          <span className="lp-paper-eyebrow">PROJE TEKLİFİ</span>
          <h2>Kapsam Web Sitesi Tasarımı ve Geliştirme</h2>
          <p>
            İhtiyaçlarınızı anladık ve aşağıda kapsam, teslim, revizyon ve ödeme koşullarını
            netleştirdik.
          </p>
        </div>
        <div className="lp-paper-section">
          <strong>Proje kapsamı</strong>
          <span className="lp-copy-line lp-copy-line--long" />
          <span className="lp-copy-line" />
          <span className="lp-copy-line lp-copy-line--short" />
        </div>
        <div className="lp-paper-facts">
          <div>
            <Clock3 />
            <span>
              <strong>Teslim</strong>
              <small>4–6 hafta</small>
            </span>
          </div>
          <div>
            <Copy />
            <span>
              <strong>Revizyon</strong>
              <small>2 tur</small>
            </span>
          </div>
          <div>
            <ListChecks />
            <span>
              <strong>Ödeme</strong>
              <small>%50 / %50</small>
            </span>
          </div>
        </div>
        <footer className="lp-paper-total">
          <span>Toplam yatırım</span>
          <strong>66.000 TL</strong>
        </footer>
      </article>

      <aside className="lp-hero-activity">
        <span className="lp-mock-kicker">ETKİNLİK</span>
        <div className="lp-activity-item">
          <Eye />
          <span>
            <strong>Görüntülendi</strong>
            <small>Bugün 14:32 · yaklaşık sinyal</small>
          </span>
        </div>
        <div className="lp-activity-item">
          <Send />
          <span>
            <strong>Paylaşıldı</strong>
            <small>Dün 16:40</small>
          </span>
        </div>
        <div className="lp-follow-draft">
          <span>Takip taslağı</span>
          <p>Merhaba, teklifimizi inceleyebildiniz mi?</p>
          <span className="lp-mock-button">Düzenle</span>
        </div>
      </aside>
    </div>
  );
}

export function LandingPage() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const [price] = useState<PriceVariant>(() => {
    if (typeof window === "undefined") return 149;
    try {
      const stored = window.localStorage.getItem("kapsam-alpha-price-v1");
      if (stored === "149") return 149;
      if (stored === "249") return 249;
      const next: PriceVariant =
        window.crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? 149 : 249;
      window.localStorage.setItem("kapsam-alpha-price-v1", String(next));
      return next;
    } catch {
      return 149;
    }
  });
  const pricingSectionRef = useRef<HTMLElement>(null);
  const hasTrackedLandingView = useRef(false);
  const hasTrackedPricingView = useRef(false);

  useEffect(() => {
    if (hasTrackedLandingView.current) return;
    hasTrackedLandingView.current = true;
    trackLandingEvent("landing_view", { price });
  }, [price]);

  useEffect(() => {
    const pricingSection = pricingSectionRef.current;
    if (!pricingSection || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || hasTrackedPricingView.current) return;
        hasTrackedPricingView.current = true;
        trackLandingEvent("pricing_view", { price });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(pricingSection);
    return () => observer.disconnect();
  }, [price]);

  return (
    <div className="lp-page" id="top">
      <a className="lp-skip-link" href="#main-content">
        İçeriğe geç
      </a>
      <header className="lp-nav">
        <div className="lp-container lp-nav__inner">
          <BrandMark />
          <nav aria-label="Ana navigasyon">
            <a href="#urun">Ürün</a>
            <a href="#problem-cozumu">Problem Çözümü</a>
            <a href="#nasil-calisir">Nasıl Çalışır?</a>
            <a href="#fiyatlandirma">Fiyatlandırma</a>
          </nav>
          <a
            className="lp-nav__cta"
            href="#waitlist"
            onClick={() => trackLandingEvent("cta_clicked", { location: "navigation" })}
          >
            Alpha sürümüne katıl <ArrowRight />
          </a>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div id="urun">
          <section className="lp-hero lp-section" aria-labelledby="lp-hero-title">
            <div className="lp-container lp-hero__grid">
              <div className="lp-hero__copy">
                <span className="lp-eyebrow">
                  Freelance yazılımcılar ve UI/UX tasarımcıları için
                </span>
                <h1 id="lp-hero-title">
                  Hızlı teklif bağlantısı, tüm tekliflerini tek pencerede görüntüleme.
                </h1>
                <p>
                  Tekliflerini oluştur, paylaş ve takip et. Görüntülenme sinyallerini al, takip
                  mesajını hazırla. Hepsi tek pencerede.
                </p>
                <div className="lp-hero__actions">
                  <a
                    className="lp-action lp-action--primary"
                    href="#waitlist"
                    onClick={() => trackLandingEvent("cta_clicked", { location: "hero" })}
                  >
                    Alpha sürümüne katıl <ArrowRight />
                  </a>
                </div>
              </div>
              <HeroProductWindow />
            </div>
          </section>

          <section className="lp-preview lp-section" aria-labelledby="lp-preview-title">
            <div className="lp-container">
              <h2 className="sr-only" id="lp-preview-title">
                Etkileşimli ürün demosu
              </h2>
              <div className="lp-preview-stage">
                <DemoApp layout="embedded" />
              </div>
            </div>
          </section>
        </div>

        <section
          className="lp-transformation lp-section"
          id="problem-cozumu"
          aria-labelledby="lp-problem-title"
        >
          <div className="lp-container">
            <div className="lp-transform-headings">
              <h2 id="lp-problem-title">Yaygın sorunlar</h2>
              <span />
              <h2>
                <strong>kapsam.</strong> ile kazanımlar
              </h2>
            </div>
            <div className="lp-transform-list">
              {problems.map((problem, index) => (
                <div className="lp-transform-row" key={problem}>
                  <div className="lp-transform-item lp-transform-item--problem">
                    <FileText />
                    <p>{problem}</p>
                  </div>
                  <ArrowRight className="lp-transform-arrow" />
                  <div className="lp-transform-item lp-transform-item--benefit">
                    {index === 0 ? (
                      <Sparkles />
                    ) : index === 1 ? (
                      <CheckCircle2 />
                    ) : index === 2 ? (
                      <Eye />
                    ) : (
                      <MessageCircle />
                    )}
                    <p>{benefits[index]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="lp-steps lp-section"
          id="nasil-calisir"
          aria-labelledby="lp-steps-title"
        >
          <div className="lp-container">
            <div className="lp-section-heading">
              <span className="lp-eyebrow">DÖRT ADIMDA TEKLİF AKIŞI</span>
              <h2 id="lp-steps-title">Nasıl çalışır?</h2>
            </div>
            <ol className="lp-step-grid">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li className="lp-step-card" key={title}>
                  <span className="lp-step-number">{index + 1}</span>
                  <Icon className="lp-step-icon" strokeWidth={1.7} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {index < steps.length - 1 ? <ArrowRight className="lp-step-arrow" /> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-trust lp-section" id="guven" aria-labelledby="lp-trust-title">
          <div className="lp-container">
            <h2 className="sr-only" id="lp-trust-title">
              Güven ve kapsam sınırları
            </h2>
            <div className="lp-trust-grid">
              {trustItems.map(({ icon: Icon, text }) => (
                <div className="lp-trust-item" key={text}>
                  <Icon />
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <p className="lp-scope-note">
              PDF, otomatik e-posta veya WhatsApp gönderimi alpha kapsamına dahil değildir.
            </p>
          </div>
        </section>

        <section
          ref={pricingSectionRef}
          className="lp-conversion lp-section"
          id="fiyatlandirma"
          aria-labelledby="lp-pricing-title"
        >
          <div className="lp-container lp-conversion-panel">
            <div className="lp-price-card">
              <span className="lp-eyebrow">ALPHA FİYAT DENEYİ</span>
              <h2 id="lp-pricing-title">Basit ve net fiyatlandırma</h2>
              <div className="lp-price">
                <strong aria-label={isHydrated ? `${price} Türk lirası` : "Fiyat yükleniyor"}>
                  {isHydrated ? `${price} TL` : "··· TL"}
                </strong>
                <span>/ ay</span>
              </div>
              <ul>
                {priceFeatures.map((feature) => (
                  <li key={feature}>
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="lp-price-note">
                <ShieldCheck />
                <span>
                  Ödeme alınmaz, kart bilgisi toplanmaz. Demo kayıt yalnızca bu tarayıcıda saklanır.
                </span>
              </div>
            </div>

            <div className="lp-waitlist" id="waitlist">
              <span className="lp-eyebrow">ERKEN ERİŞİM</span>
              <h2 id="waitlist-heading">Alpha sürümüne katıl</h2>
              <p>
                Bu v0.1.0 önizlemesinde form kaydı yalnız bu tarayıcıda tutulur; gerçek bekleme
                listesi bağlantısı henüz aktif değildir.
              </p>
              <WaitlistForm price={price} onTrackEvent={trackLandingEvent} />
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer__grid">
          <div>
            <BrandMark />
            <p>
              Tekliflerini oluştur, bağlantı olarak paylaş ve yaklaşık görüntülenme sinyallerini
              takip et.
            </p>
            <span className="lp-alpha-note">Erken erişim deneyidir.</span>
          </div>
          <div>
            <strong>Ürün</strong>
            <a href="#urun">Özellikler</a>
            <a href="#nasil-calisir">Nasıl çalışır?</a>
          </div>
          <div>
            <strong>Şeffaflık</strong>
            <a href="#guven">Gizlilik ve kapsam</a>
            <a href="#aydinlatma">Aydınlatma özeti</a>
            <a href="#waitlist">Form demosu</a>
          </div>
          <div>
            <strong>İletişim</strong>
            <p>Kalıcı bekleme listesi ve iletişim kanalı henüz aktif değildir.</p>
          </div>
        </div>
        <div className="lp-container lp-footer__bottom">
          © 2026 <BrandMark /> by cagankerg{" "}
        </div>
      </footer>
    </div>
  );
}
