"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Screen =
  | "onboarding"
  | "dashboard"
  | "proposals"
  | "editor"
  | "detail"
  | "public";

type Item = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Currency = "TRY" | "USD" | "EUR";
type TaxInfo = "excluded" | "included" | "none";

type DraftSnapshot = {
  projectName: string;
  clientName: string;
  company: string;
  summary: string;
  scope: string;
  deliverables: string;
  excluded: string;
  duration: string;
  startDate: string;
  validUntil: string;
  revision: string;
  currency: Currency;
  taxInfo: TaxInfo;
  paymentPlan: string;
  additionalTerms: string;
  items: Item[];
  total: number;
};

type ProfileSnapshot = {
  name: string;
  profession: string;
  brand: string;
  email: string;
  currency: Currency;
};

type Proposal = {
  id: string;
  title: string;
  client: string;
  amount: string;
  createdAt: string;
  lastViewed: string;
  status:
    | "Taslak"
    | "Yayınlandı"
    | "Görüntülendi"
    | "Kabul edildi"
    | "Reddedildi"
    | "Süresi doldu"
    | "Erişim iptal edildi";
};

const proposals: Proposal[] = [
  {
    id: "TKL-1048",
    title: "NovaWorks SaaS Web Sitesi",
    client: "NovaWorks Teknoloji",
    amount: "66.000 TL",
    createdAt: "15 Tem 2026",
    lastViewed: "Bugün, 14:18",
    status: "Görüntülendi",
  },
  {
    id: "TKL-1047",
    title: "Finovo Mobil Ürün Tasarımı",
    client: "Finovo",
    amount: "92.500 TL",
    createdAt: "12 Tem 2026",
    lastViewed: "Dün, 17:04",
    status: "Kabul edildi",
  },
  {
    id: "TKL-1046",
    title: "Atlas Yönetim Paneli",
    client: "Atlas Lojistik",
    amount: "48.000 TL",
    createdAt: "9 Tem 2026",
    lastViewed: "Henüz görüntülenmedi",
    status: "Yayınlandı",
  },
  {
    id: "TKL-1045",
    title: "Mori Marka Sitesi",
    client: "Mori Coffee",
    amount: "34.000 TL",
    createdAt: "5 Tem 2026",
    lastViewed: "8 Tem, 09:32",
    status: "Reddedildi",
  },
  {
    id: "TKL-1044",
    title: "Koru Tasarım Sistemi",
    client: "Koru Health",
    amount: "54.000 TL",
    createdAt: "1 Tem 2026",
    lastViewed: "Henüz görüntülenmedi",
    status: "Taslak",
  },
];

const navItems: Array<{ screen: Screen; label: string; marker: string }> = [
  { screen: "dashboard", label: "Genel bakış", marker: "01" },
  { screen: "proposals", label: "Teklifler", marker: "02" },
  { screen: "editor", label: "Yeni teklif", marker: "+" },
];

const demoTourSteps: Array<{ screen: Screen; label: string; marker: string }> = [
  { screen: "dashboard", label: "Genel bakış", marker: "01" },
  { screen: "editor", label: "Teklif hazırla", marker: "02" },
  { screen: "public", label: "Müşteri görünümü", marker: "03" },
  { screen: "detail", label: "Takip et", marker: "04" },
];

const initialItems: Item[] = [
  { id: 1, description: "UX keşif ve bilgi mimarisi", quantity: 1, unitPrice: 18000 },
  { id: 2, description: "8 sayfa UI tasarımı", quantity: 1, unitPrice: 36000 },
  { id: 3, description: "Responsive component library", quantity: 1, unitPrice: 12000 },
];

const defaultProfile: ProfileSnapshot = {
  name: "Deniz Kaya",
  profession: "Freelance UI/UX & Web Designer",
  brand: "Kaya Studio",
  email: "deniz@kayastudio.co",
  currency: "TRY",
};

const defaultDraftSnapshot: DraftSnapshot = {
  projectName: "NovaWorks SaaS Web Sitesi Yenileme",
  clientName: "Mert Yılmaz",
  company: "NovaWorks Teknoloji A.Ş.",
  summary:
    "B2B SaaS ürününü daha net anlatan, demo talebini artırmaya odaklı responsive web sitesi yenilemesi.",
  scope:
    "Mevcut deneyimin analizi, bilgi mimarisinin yenilenmesi, ana kullanıcı akışlarının wireframe ve yüksek çözünürlüklü arayüz tasarımları.",
  deliverables:
    "Keşif atölyesi\nBilgi mimarisi ve wireframe\n8 sayfa UI tasarımı\nResponsive component library\nFigma handoff",
  excluded:
    "Frontend geliştirme\nMetin yazarlığı\nHosting ve domain\nÜcretli stok lisansları",
  duration: "5 hafta",
  startDate: "2026-07-25",
  validUntil: "2026-07-31",
  revision: "2",
  currency: "TRY",
  taxInfo: "excluded",
  paymentPlan: "%50 proje başlangıcında, %30 tasarım onayında, %20 final tesliminde.",
  additionalTerms:
    "Takvim, müşteri geri bildirimlerinin iki iş günü içinde paylaşılması varsayımıyla planlanmıştır.",
  items: initialItems,
  total: 66000,
};

const editorSteps = ["Müşteri & proje", "Kapsam", "Fiyatlandırma", "İncele & yayınla"];

const followUpScenarios = [
  "Görüntülendi, yanıt bekleniyor",
  "Henüz görüntülenmedi",
  "Geçerlilik süresi dolmak üzere",
  "Fiyat pazarlığı",
  "Kapsam açıklaması",
];

const followUpTones = ["Profesyonel", "Samimi", "Kısa", "Daha ikna edici"];

const followUpScenarioCopy: Record<string, { full: string; short: string }> = {
  "Görüntülendi, yanıt bekleniyor": {
    full: "Teklifi inceleme fırsatı bulduğunuzu gördüm. Kapsam, takvim veya ödeme planıyla ilgili sorularınızı memnuniyetle netleştirebilirim.",
    short: "Teklifle ilgili sorularınızı yanıtlamaktan memnuniyet duyarım.",
  },
  "Henüz görüntülenmedi": {
    full: "Geçtiğimiz günlerde paylaştığım teklifin size ulaşıp ulaşmadığını kontrol etmek istedim. Bağlantıda bir sorun varsa hemen yeniden iletebilirim.",
    short: "Paylaştığım teklif size ulaştı mı? Gerekirse bağlantıyı yeniden iletebilirim.",
  },
  "Geçerlilik süresi dolmak üzere": {
    full: "Teklifin geçerlilik süresi yaklaşıyor. Planlanan başlangıç tarihini korumak isterseniz kalan soruları birlikte hızla netleştirebiliriz.",
    short: "Teklifin geçerlilik süresi yaklaşıyor; isterseniz kalan soruları hızla netleştirelim.",
  },
  "Fiyat pazarlığı": {
    full: "Bütçe konusundaki geri bildiriminizi anlıyorum. Öncelikleri birlikte sıralayıp kapsamı hedeflerinizi koruyacak şekilde aşamalandırabiliriz.",
    short: "Bütçeye göre kapsamı önceliklendirip aşamalandırabiliriz.",
  },
  "Kapsam açıklaması": {
    full: "Teklifteki kapsamı daha açık hale getirmek isterim. Teslimatlar, hariç tutulan işler ve revizyon adımlarını birlikte üzerinden geçebiliriz.",
    short: "Kapsam ve teslimatları birlikte netleştirebiliriz.",
  },
};

function buildFollowUpMessage(
  scenario: string,
  tone: string,
  draft: DraftSnapshot,
  profile: ProfileSnapshot,
) {
  const recipient = draft.clientName.trim().split(/\s+/)[0] || "Merhaba";
  const copy = followUpScenarioCopy[scenario] ?? followUpScenarioCopy[followUpScenarios[0]];
  const greeting = recipient === "Merhaba" ? "Merhaba," : `Merhaba ${recipient},`;

  if (tone === "Kısa") return `${greeting} ${copy.short}`;
  if (tone === "Samimi") {
    return `${greeting} umarım iyisiniz. ${copy.full} Uygun olduğunuzda haberleşelim. Sevgiler, ${profile.name}`;
  }
  if (tone === "Daha ikna edici") {
    return `${greeting} ${copy.full} ${draft.projectName} için hedeflediğimiz sonucu koruyarak ilerlemek adına bu hafta 15 dakikalık kısa bir görüşme planlayabiliriz. Size uygun iki zaman paylaşmanız yeterli. Saygılarımla, ${profile.name}`;
  }
  return `${greeting} ${copy.full} Uygun olduğunuzda kısa bir görüşme planlayabiliriz. Saygılarımla, ${profile.name}`;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmount(value: number, currency: Currency) {
  const symbol = currency === "TRY" ? "TL" : currency === "USD" ? "USD" : "EUR";
  return formatMoney(value) + " " + symbol;
}

function formatDate(value: string) {
  if (!value) return "Tarih seçilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value + "T12:00:00+03:00"));
}

function taxLabel(value: TaxInfo) {
  return value === "included" ? "KDV dahil" : value === "excluded" ? "KDV hariç" : "Vergi uygulanmıyor";
}

function initials(value: string) {
  const result = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
  return result || "K";
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={cx("brand-mark", inverse && "brand-mark--inverse")} aria-label="Kapsam">
      <span className="brand-glyph" aria-hidden="true">
        k
      </span>
      <span>kapsam.</span>
    </div>
  );
}

function StatusPill({ status }: { status: Proposal["status"] | "Yanıt bekleniyor" }) {
  const tone =
    status === "Kabul edildi"
      ? "success"
      : status === "Reddedildi" || status === "Süresi doldu" || status === "Erişim iptal edildi"
        ? "danger"
        : status === "Görüntülendi"
          ? "info"
          : status === "Yayınlandı" || status === "Yanıt bekleniyor"
            ? "warning"
            : "neutral";

  return (
    <span className={"status-pill status-pill--" + tone}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-check" aria-hidden="true">
        ✓
      </span>
      {message}
    </div>
  );
}

function ProductFooter() {
  return (
    <footer className="product-footer">
      <span>© 2026 Kapsam. Tekliflerin, senin kontrolünde.</span>
      <nav aria-label="Yasal bağlantılar">
        <a href="#gizlilik">Gizlilik</a>
        <a href="#kullanim">Kullanım</a>
        <a href="#destek">Destek</a>
      </nav>
    </footer>
  );
}

function Modal({
  title,
  description,
  children,
  confirmLabel,
  confirmDisabled = false,
  tone = "primary",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]",
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Pencereyi kapat">
          ×
        </button>
        <span className={cx("modal-icon", tone === "danger" && "modal-icon--danger")} aria-hidden="true">
          {tone === "danger" ? "!" : "✓"}
        </span>
        <h2 id="modal-title">{title}</h2>
        <p>{description}</p>
        {children}
        <div className="modal-actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={confirmDisabled}
            className={cx("button", tone === "danger" ? "button--danger" : "button--primary")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function Onboarding({
  initialProfile,
  onComplete,
  onSkip,
}: {
  initialProfile: ProfileSnapshot;
  onComplete: (profile: ProfileSnapshot) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialProfile.name);
  const [profession, setProfession] = useState(initialProfile.profession);
  const [brand, setBrand] = useState(initialProfile.brand);
  const [email, setEmail] = useState(initialProfile.email);
  const [currency, setCurrency] = useState<Currency>(initialProfile.currency);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }
    onComplete({ name, profession, brand, email, currency });
  };

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <BrandMark />
        <button type="button" className="text-button" onClick={onSkip}>
          Demo verileriyle geç
          <span aria-hidden="true">→</span>
        </button>
      </header>

      <div className="onboarding-grid">
        <section className="onboarding-content">
          <div className="eyebrow">2 dakikada hazır</div>
          <div className="onboarding-progress" aria-label="Onboarding ilerlemesi">
            {[0, 1, 2].map((item) => (
              <span key={item} className={cx(item <= step && "is-active")} />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 0 ? (
              <>
                <span className="step-count">01 / 03</span>
                <h1>Seni tekliflerine doğru biçimde yansıtalım.</h1>
                <p className="lead">
                  Bu bilgiler yeni tekliflerde başlangıç değeri olur. Dilediğin zaman değiştirebilirsin.
                </p>
                <label className="field">
                  <span>Adın soyadın</span>
                  <input required value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label className="field">
                  <span>Ne iş yapıyorsun?</span>
                  <input
                    required
                    value={profession}
                    onChange={(event) => setProfession(event.target.value)}
                  />
                </label>
              </>
            ) : step === 1 ? (
              <>
                <span className="step-count">02 / 03</span>
                <h1>Markanı sade ve profesyonel göster.</h1>
                <p className="lead">
                  Müşterinin gördüğü teklif sayfasında markan, adın ve iletişim bilgin yer alır.
                </p>
                <div className="logo-upload">
                  <span className="logo-placeholder" aria-hidden="true">
                    K
                  </span>
                  <div>
                    <strong>Logo veya monogram</strong>
                    <span>PNG veya JPG · En fazla 2 MB</span>
                  </div>
                  <button
                    type="button"
                    className="button button--soft"
                    disabled
                    title="Logo yükleme sonraki prototip aşamasında eklenecek"
                  >
                    Logo yükleme · yakında
                  </button>
                </div>
                <label className="field">
                  <span>Marka veya şirket adı</span>
                  <input required value={brand} onChange={(event) => setBrand(event.target.value)} />
                </label>
                <label className="field">
                  <span>İletişim e-postası</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <span className="step-count">03 / 03</span>
                <h1>Son bir tercih, sonra ilk teklifin.</h1>
                <p className="lead">
                  Varsayılan para birimini seç. Her teklifte ayrıca değiştirebilirsin.
                </p>
                <fieldset className="currency-options">
                  <legend>Varsayılan para birimi</legend>
                  {[
                    ["TRY", "TL", "Türk Lirası"],
                    ["USD", "$", "Amerikan Doları"],
                    ["EUR", "€", "Euro"],
                  ].map(([value, symbol, label]) => (
                    <label key={value} className={cx(currency === value && "is-selected")}>
                      <input
                        type="radio"
                        name="currency"
                        value={value}
                        checked={currency === value}
                        onChange={() => setCurrency(value as Currency)}
                      />
                      <span className="currency-symbol">{symbol}</span>
                      <span>
                        <strong>{value}</strong>
                        <small>{label}</small>
                      </span>
                      <span className="radio-check" aria-hidden="true" />
                    </label>
                  ))}
                </fieldset>
                <div className="onboarding-note">
                  <span aria-hidden="true">◇</span>
                  <p>
                    <strong>Hazırsın, {name.split(" ")[0]}.</strong>
                    Profilin {brand} adıyla oluşturulacak.
                  </p>
                </div>
              </>
            )}

            <div className="form-footer">
              {step > 0 ? (
                <button type="button" className="button button--ghost" onClick={() => setStep(step - 1)}>
                  Geri
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="button button--primary button--large">
                {step === 2 ? "İlk teklifimi oluştur" : "Devam et"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </section>

        <aside className="onboarding-visual" aria-label="Teklif önizlemesi">
          <div className="visual-orbit visual-orbit--one" />
          <div className="visual-orbit visual-orbit--two" />
          <div className="mini-proposal">
            <div className="mini-proposal__top">
              <span className="mini-logo">{initials(brand)}</span>
              <span>{brand}</span>
              <small>TEKLİF · 2026</small>
            </div>
            <div className="mini-proposal__body">
              <span className="mini-kicker">NOVAworks için hazırlandı</span>
              <h2>Dijital ürünü daha net anlatan bir web deneyimi.</h2>
              <div className="mini-lines">
                <span />
                <span />
                <span />
              </div>
              <div className="mini-total">
                <span>Proje toplamı</span>
                <strong>{formatAmount(66000, currency)}</strong>
              </div>
            </div>
          </div>
          <div className="floating-note floating-note--view">
            <span className="floating-icon">↗</span>
            <span>
              <strong>Teklif görüntülendi</strong>
              <small>Bugün, 14:18</small>
            </span>
          </div>
          <div className="floating-note floating-note--ai">
            <span className="spark" aria-hidden="true">
              ✦
            </span>
            <span>
              <strong>AI taslağın hazır</strong>
              <small>3 alan için öneri</small>
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Sidebar({
  screen,
  profile,
  onNavigate,
  onRestart,
  demoMode = false,
}: {
  screen: Screen;
  profile: ProfileSnapshot;
  onNavigate: (next: Screen) => void;
  onRestart: () => void;
  demoMode?: boolean;
}) {
  return (
    <aside className="sidebar">
      <BrandMark inverse />
      <nav aria-label="Ana navigasyon">
        <span className="nav-label">{demoMode ? "Örnek çalışma alanı" : "Çalışma alanı"}</span>
        {navItems.map((item) => (
          <button
            key={item.screen}
            type="button"
            className={cx("nav-item", screen === item.screen && "is-active")}
            onClick={() => onNavigate(item.screen)}
            aria-current={screen === item.screen ? "page" : undefined}
          >
            <span className="nav-marker" aria-hidden="true">
              {item.marker}
            </span>
            {item.label}
          </button>
        ))}
        <span className="nav-label nav-label--second">{demoMode ? "Demo" : "Hesap"}</span>
        <button type="button" className="nav-item" onClick={onRestart}>
          <span className="nav-marker" aria-hidden="true">
            03
          </span>
          {demoMode ? "Turu baştan başlat" : "Profil & marka"}
        </button>
        <button type="button" className="nav-item" disabled title={demoMode ? "Alpha üyeliği gerektirir" : "Sonraki prototip aşamasında"}>
          <span className="nav-marker" aria-hidden="true">
            04
          </span>
          {demoMode ? "Kayıtlı özellikler" : "Plan & kullanım"}
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="quota-card">
          <div className="quota-card__title">
            <span>{demoMode ? "Tanıtım modu" : "Ücretsiz plan"}</span>
            <strong>{demoMode ? "ÖRNEK" : "2 / 3"}</strong>
          </div>
          <div className="quota-track">
            <span />
          </div>
          <p>{demoMode ? "Değişiklikler yalnız bu demo oturumunda tutulur." : "Bu ay 1 aktif teklif hakkın kaldı."}</p>
          {demoMode ? <Link href="/#waitlist">Alpha sürümüne katıl →</Link> : <button type="button">Pro planı keşfet →</button>}
        </div>
        <div className="profile-chip">
          <span className="avatar">{initials(profile.name)}</span>
          <span>
            <strong>{profile.name}</strong>
            <small>{demoMode ? "Örnek hesap" : profile.brand}</small>
          </span>
          <button type="button" aria-label="Hesap menüsünü aç">
            ···
          </button>
        </div>
      </div>
    </aside>
  );
}

function AppShell({
  screen,
  profile,
  title,
  eyebrow,
  children,
  onNavigate,
  onRestart,
  onCreate,
  demoMode = false,
}: {
  screen: Screen;
  profile: ProfileSnapshot;
  title: string;
  eyebrow: string;
  children: ReactNode;
  onNavigate: (next: Screen) => void;
  onRestart: () => void;
  onCreate: () => void;
  demoMode?: boolean;
}) {
  const handleNavigate = (next: Screen) => {
    if (next === "editor") {
      onCreate();
      return;
    }
    onNavigate(next);
  };

  return (
    <div className="app-shell">
      <Sidebar screen={screen} profile={profile} onNavigate={handleNavigate} onRestart={onRestart} demoMode={demoMode} />
      <main className="app-main">
        <div className="prototype-banner" role="note">
          <span>{demoMode ? "ÜRÜN DEMOSU" : "ALPHA SÜRÜMÜ"}</span>
          {demoMode ? "Örnek verilerle çalışır; yaptığın değişiklikler kaydedilmez." : "Kişisel çalışma alanın."}
        </div>
        <header className="app-header">
          <div>
            <span className="page-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="Bildirimler">
              <span aria-hidden="true">◌</span>
              <span className="notification-dot" />
            </button>
            <button type="button" className="button button--primary" onClick={onCreate}>
              <span aria-hidden="true">＋</span>
              Yeni teklif
            </button>
          </div>
        </header>
        {children}
        <ProductFooter />
      </main>
      <nav className="mobile-nav" aria-label="Mobil navigasyon">
        {navItems.map((item) => (
          <button
            key={item.screen}
            type="button"
            className={cx(screen === item.screen && "is-active")}
            onClick={() => handleNavigate(item.screen)}
          >
            <span aria-hidden="true">{item.marker}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Dashboard({
  profile,
  onCreate,
  onResumeDraft,
  onOpenProposal,
  onViewAll,
}: {
  profile: ProfileSnapshot;
  onCreate: () => void;
  onResumeDraft: () => void;
  onOpenProposal: () => void;
  onViewAll: () => void;
}) {
  return (
    <div className="dashboard-content">
      <section className="welcome-panel">
        <div>
          <span className="welcome-date">CUMA · 17 TEMMUZ</span>
          <h2>Günaydın {profile.name.split(" ")[0] || profile.name}, tekliflerin hareketli.</h2>
          <p>NovaWorks teklifin bugün 2 kez görüntülendi. Takip etmek için iyi bir zaman olabilir.</p>
        </div>
        <button type="button" className="button button--light" onClick={onOpenProposal}>
          Teklifi aç
          <span aria-hidden="true">↗</span>
        </button>
        <div className="welcome-shape welcome-shape--one" />
        <div className="welcome-shape welcome-shape--two" />
      </section>

      <section className="metric-grid" aria-label="Teklif özeti">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon--orange" aria-hidden="true">
              ↗
            </span>
            <span className="metric-change">+2 bu ay</span>
          </div>
          <strong>8</strong>
          <span>Aktif teklif</span>
          <div className="mini-bars" aria-hidden="true">
            {[28, 38, 30, 48, 58, 50, 72, 86, 76, 92].map((height, index) => (
              <i key={index} style={{ height: height + "%" }} />
            ))}
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon--green" aria-hidden="true">
              ◉
            </span>
            <span className="metric-change metric-change--green">Son 30 gün</span>
          </div>
          <strong>%72</strong>
          <span>Görüntülenme oranı</span>
          <div className="metric-progress" aria-hidden="true">
            <span style={{ width: "72%" }} />
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon--navy" aria-hidden="true">
              ✓
            </span>
            <span className="metric-change">1 yanıt bekliyor</span>
          </div>
          <strong>3</strong>
          <span>Kabul edilen</span>
          <div className="avatar-stack" aria-hidden="true">
            <span>FY</span>
            <span>NA</span>
            <span>MK</span>
          </div>
        </article>
        <article className="metric-card metric-card--dark">
          <span className="metric-kicker">YANIT BEKLEYEN TL DEĞERİ</span>
          <strong>168.000</strong>
          <span>Türk Lirası</span>
          <small>Farklı para birimleri birleştirilmez.</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel proposals-panel">
          <div className="panel-header">
            <div>
              <h2>Son teklifler</h2>
              <p>En son güncellenen teklifler</p>
            </div>
            <button type="button" className="text-button" onClick={onViewAll}>
              Tümünü gör <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="proposal-list">
            {proposals.slice(0, 4).map((proposal) => (
              <button
                type="button"
                className="proposal-row"
                key={proposal.id}
                onClick={onOpenProposal}
              >
                <span className="proposal-monogram" aria-hidden="true">
                  {proposal.client.slice(0, 1)}
                </span>
                <span className="proposal-main">
                  <strong>{proposal.title}</strong>
                  <small>{proposal.client}</small>
                </span>
                <span className="proposal-amount">{proposal.amount}</span>
                <StatusPill status={proposal.status} />
                <span className="row-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="panel attention-panel">
          <div className="panel-header">
            <div>
              <h2>AI takip önerileri</h2>
              <p>Teklif davranışlarına göre önerilen aksiyonlar</p>
            </div>
            <span className="count-badge">3</span>
          </div>
          <div className="attention-list">
            <button type="button" onClick={onOpenProposal}>
              <span className="attention-icon attention-icon--hot" aria-hidden="true">
                ↗
              </span>
              <span>
                <strong>NovaWorks teklifi görüntülendi</strong>
                <small>Son görüntülenme 24 dakika önce</small>
              </span>
              <span aria-hidden="true">→</span>
            </button>
            <button type="button" onClick={onResumeDraft}>
              <span className="attention-icon attention-icon--clock" aria-hidden="true">
                ◷
              </span>
              <span>
                <strong>Atlas teklifinin süresi yaklaşıyor</strong>
                <small>2 gün sonra sona erecek</small>
              </span>
              <span aria-hidden="true">→</span>
            </button>
            <button type="button">
              <span className="attention-icon attention-icon--draft" aria-hidden="true">
                ◫
              </span>
              <span>
                <strong>Koru taslağı 6 gündür bekliyor</strong>
                <small>Düzenlemeye devam et</small>
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <button type="button" className="quick-create" onClick={onCreate}>
            <span aria-hidden="true">＋</span>
            <span>
              <strong>Yeni teklif oluştur</strong>
              <small>Manuel başla veya AI ile hızlan</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>
    </div>
  );
}

function ProposalTable({
  onOpenProposal,
  onResumeDraft,
}: {
  onOpenProposal: () => void;
  onResumeDraft: () => void;
}) {
  const [filter, setFilter] = useState("Tümü");
  const [query, setQuery] = useState("");
  const filters = ["Tümü", "Taslak", "Yayınlandı", "Görüntülendi", "Kabul edildi", "Reddedildi"];

  const filtered = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesFilter = filter === "Tümü" || proposal.status === filter;
      const normalized = query.toLocaleLowerCase("tr-TR");
      const matchesSearch =
        !normalized ||
        proposal.title.toLocaleLowerCase("tr-TR").includes(normalized) ||
        proposal.client.toLocaleLowerCase("tr-TR").includes(normalized);
      return matchesFilter && matchesSearch;
    });
  }, [filter, query]);

  return (
    <section className="table-panel">
      <div className="table-toolbar">
        <div className="filter-tabs" role="group" aria-label="Teklif filtreleri">
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={filter === item}
              className={cx(filter === item && "is-active")}
              onClick={() => setFilter(item)}
            >
              {item}
              {item === "Tümü" ? <span>5</span> : null}
            </button>
          ))}
        </div>
        <div className="table-toolbar-actions">
          <label className="search-field">
            <span className="sr-only">Tekliflerde ara</span>
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Teklif veya müşteri ara"
            />
          </label>
          <button type="button" className="button button--soft" onClick={onResumeDraft}>
            Son taslağa dön
          </button>
        </div>
      </div>

      {filtered.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teklif</th>
                <th>Müşteri</th>
                <th>Tutar</th>
                <th>Oluşturulma</th>
                <th>Son görüntülenme</th>
                <th>Durum</th>
                <th>
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <button type="button" className="table-title" onClick={onOpenProposal}>
                      <span className="table-file" aria-hidden="true">
                        ◫
                      </span>
                      <span>
                        <strong>{proposal.title}</strong>
                        <small>{proposal.id}</small>
                      </span>
                    </button>
                  </td>
                  <td>{proposal.client}</td>
                  <td className="table-amount">{proposal.amount}</td>
                  <td>{proposal.createdAt}</td>
                  <td>{proposal.lastViewed}</td>
                  <td>
                    <StatusPill status={proposal.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="dots-button"
                      disabled
                      title="Sonraki prototip aşamasında"
                      aria-label={proposal.title + " işlemleri"}
                    >
                      ···
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">⌕</span>
          <h2>Eşleşen teklif bulunamadı</h2>
          <p>Arama kelimeni veya seçili filtreyi değiştirerek tekrar dene.</p>
          <button type="button" className="button button--soft" onClick={() => { setQuery(""); setFilter("Tümü"); }}>
            Filtreleri temizle
          </button>
        </div>
      )}
      <footer className="table-footer">
        <span>5 tekliften {filtered.length} tanesi gösteriliyor</span>
        <div>
          <button type="button" disabled aria-label="Önceki sayfa">
            ←
          </button>
          <button type="button" className="is-active">
            1
          </button>
          <button type="button" disabled>2</button>
          <button type="button" disabled aria-label="Sonraki sayfa">
            →
          </button>
        </div>
      </footer>
    </section>
  );
}

function ProposalEditor({
  initialDraft,
  profile,
  onBack,
  onSave,
  onPreview,
  onPublish,
  onNavigate,
  notify,
  demoMode = false,
}: {
  initialDraft: DraftSnapshot;
  profile: ProfileSnapshot;
  onBack: () => void;
  onSave: (draft: DraftSnapshot) => void;
  onPreview: (draft: DraftSnapshot) => void;
  onPublish: (draft: DraftSnapshot) => void;
  onNavigate: (screen: Screen) => void;
  notify: (message: string) => void;
  demoMode?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<Item[]>(() =>
    initialDraft.items.map((item) => ({ ...item })),
  );
  const [aiPanel, setAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [projectName, setProjectName] = useState(initialDraft.projectName);
  const [clientName, setClientName] = useState(initialDraft.clientName);
  const [company, setCompany] = useState(initialDraft.company);
  const [summary, setSummary] = useState(initialDraft.summary);
  const [scope, setScope] = useState(initialDraft.scope);
  const [deliverables, setDeliverables] = useState(initialDraft.deliverables);
  const [excluded, setExcluded] = useState(initialDraft.excluded);
  const [duration, setDuration] = useState(initialDraft.duration);
  const [startDate, setStartDate] = useState(initialDraft.startDate);
  const [validUntil, setValidUntil] = useState(initialDraft.validUntil);
  const [revision, setRevision] = useState(initialDraft.revision);
  const [currency, setCurrency] = useState<Currency>(initialDraft.currency);
  const [taxInfo, setTaxInfo] = useState<TaxInfo>(initialDraft.taxInfo);
  const [paymentPlan, setPaymentPlan] = useState(initialDraft.paymentPlan);
  const [additionalTerms, setAdditionalTerms] = useState(initialDraft.additionalTerms);
  const [aiSelections, setAiSelections] = useState({
    summary: true,
    scope: true,
    excluded: false,
  });
  const aiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!clientName.trim()) issues.push("müşteri adı");
    if (!company.trim()) issues.push("şirket");
    if (!projectName.trim()) issues.push("proje adı");
    if (!summary.trim()) issues.push("proje özeti");
    if (!scope.trim()) issues.push("proje kapsamı");
    if (!deliverables.trim()) issues.push("teslimatlar");
    if (!duration.trim()) issues.push("proje süresi");
    if (!startDate || !validUntil) issues.push("başlangıç ve geçerlilik tarihi");
    if (startDate && validUntil && validUntil < startDate) issues.push("geçerli tarih sırası");
    if (!items.length) issues.push("en az bir hizmet kalemi");
    if (items.some((item) => !item.description.trim())) issues.push("hizmet açıklaması");
    if (
      items.some(
        (item) =>
          !Number.isFinite(item.quantity) ||
          !Number.isFinite(item.unitPrice) ||
          item.quantity <= 0 ||
          item.unitPrice <= 0 ||
          item.quantity > 10000 ||
          item.unitPrice > 100000000,
      )
    ) {
      issues.push("pozitif miktar ve fiyat");
    }
    if (!Number.isFinite(total) || total <= 0 || total > 1000000000) {
      issues.push("geçerli teklif toplamı");
    }
    if (!paymentPlan.trim()) issues.push("ödeme planı");
    return issues;
  }, [
    clientName,
    company,
    deliverables,
    duration,
    items,
    paymentPlan,
    projectName,
    scope,
    startDate,
    summary,
    total,
    validUntil,
  ]);

  const createSnapshot = (): DraftSnapshot => ({
    projectName,
    clientName,
    company,
    summary,
    scope,
    deliverables,
    excluded,
    duration,
    startDate,
    validUntil,
    revision,
    currency,
    taxInfo,
    paymentPlan,
    additionalTerms,
    items: items.map((item) => ({ ...item })),
    total,
  });

  const updateItem = (id: number, key: keyof Item, value: string | number) => {
    const numericValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
    const normalizedValue =
      key === "quantity"
        ? Math.min(10000, Math.max(1, Math.round(numericValue) || 1))
        : key === "unitPrice"
          ? Math.min(100000000, Math.max(0, numericValue))
          : value;
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: normalizedValue } : item)),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        description: "Yeni hizmet kalemi",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const openAi = () => {
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    setAiPanel(true);
    setAiLoading(true);
    aiTimerRef.current = window.setTimeout(() => {
      setAiLoading(false);
      aiTimerRef.current = null;
    }, 850);
  };

  const applyAi = () => {
    if (aiSelections.summary) {
      setSummary(
        "NovaWorks’ün B2B SaaS ürününü daha anlaşılır anlatan ve nitelikli demo taleplerini artırmaya odaklanan, dönüşüm odaklı responsive web deneyimi.",
      );
    }
    if (aiSelections.scope) {
      setScope(
        "Mevcut site ve rakip deneyimlerinin analizi; bilgi mimarisinin sadeleştirilmesi; ana dönüşüm akışlarının wireframe, UI ve responsive component seviyesinde yeniden tasarlanması.",
      );
    }
    if (aiSelections.excluded) {
      setExcluded(
        "Frontend geliştirme\nİçerik üretimi\nHosting ve domain\nÜçüncü taraf lisans maliyetleri",
      );
    }
    setAiPanel(false);
    notify("Seçtiğin AI önerileri uygulandı. Fiyat alanlarına dokunulmadı.");
  };

  return (
    <div className="editor-app-shell">
      <Sidebar
        screen="editor"
        profile={profile}
        onNavigate={onNavigate}
        onRestart={() => onNavigate("onboarding")}
        demoMode={demoMode}
      />
      <main className="editor-page">
      <div className="editor-topbar">
        <button type="button" className="back-button" onClick={onBack}>
          ← <span>Tekliflere dön</span>
        </button>
        <div className="editor-status">
          <span className="save-dot" />
          {demoMode ? "Demo değişiklikleri yalnız bu oturumda korunur" : "Değişiklikler bu oturumda korunuyor"}
        </div>
        <div className="editor-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              onSave(createSnapshot());
              notify("Taslak kaydedildi.");
            }}
          >
            Taslak kaydet
          </button>
          <button
            type="button"
            className="button button--soft"
            onClick={() => onPreview(createSnapshot())}
          >
            Önizle
          </button>
        </div>
      </div>

      <div className="editor-heading">
        <div>
          <span className="page-eyebrow">YENİ TEKLİF</span>
          <h1>Teklifini birlikte netleştirelim.</h1>
          <p>Alanları adım adım doldur. Taslağın ilerledikçe sağdaki önizleme güncellenir.</p>
        </div>
        <button type="button" className="ai-launch" onClick={openAi}>
          <span className="spark" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>AI ile taslak oluştur</strong>
            <small>Fiyatı sen belirlersin</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <ol className="stepper" aria-label="Teklif oluşturma adımları">
        {editorSteps.map((label, index) => (
          <li key={label} className={cx(index === step && "is-active", index < step && "is-complete")}>
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? "step" : undefined}
            >
              <span>{index < step ? "✓" : index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="editor-layout">
        <section className="editor-card">
          {step === 0 ? (
            <>
              <div className="section-heading">
                <span>01</span>
                <div>
                  <h2>Müşteri ve proje bilgileri</h2>
                  <p>Teklifin kimin için ve hangi iş için hazırlandığını tanımla.</p>
                </div>
              </div>
              <div className="field-grid field-grid--two">
                <label className="field">
                  <span>Müşteri adı</span>
                  <input
                    required
                    aria-invalid={!clientName.trim()}
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Şirket</span>
                  <input
                    required
                    aria-invalid={!company.trim()}
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Proje adı</span>
                <input
                  required
                  aria-invalid={!projectName.trim()}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                />
                <small>Müşterinin göreceği net ve kısa bir başlık kullan.</small>
              </label>
              <label className="field">
                <span>Proje özeti</span>
                <textarea
                  rows={5}
                  required
                  aria-invalid={!summary.trim()}
                  maxLength={600}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
                <small>{summary.length} / 600 karakter</small>
              </label>
              <div className="field-grid field-grid--two">
                <label className="field">
                  <span>Başlangıç tarihi</span>
                  <input
                    type="date"
                    required
                    aria-invalid={!startDate}
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Teklif geçerlilik tarihi</span>
                  <input
                    type="date"
                    required
                    aria-invalid={!validUntil || Boolean(startDate && validUntil < startDate)}
                    value={validUntil}
                    onChange={(event) => setValidUntil(event.target.value)}
                  />
                </label>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <div className="section-heading">
                <span>02</span>
                <div>
                  <h2>Kapsam ve teslimatlar</h2>
                  <p>Projenin sınırlarını iki taraf için de anlaşılır hale getir.</p>
                </div>
              </div>
              <label className="field">
                <span>Proje kapsamı</span>
                <textarea
                  rows={6}
                  required
                  aria-invalid={!scope.trim()}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                />
              </label>
              <div className="field-grid field-grid--two">
                <label className="field">
                  <span>Teslim edilecekler</span>
                  <textarea
                    rows={9}
                    required
                    aria-invalid={!deliverables.trim()}
                    value={deliverables}
                    onChange={(event) => setDeliverables(event.target.value)}
                  />
                  <small>Her satıra bir teslimat yaz.</small>
                </label>
                <label className="field">
                  <span>Hariç tutulan işler</span>
                  <textarea rows={9} value={excluded} onChange={(event) => setExcluded(event.target.value)} />
                  <small>Yanlış beklentiyi azaltmak için açık ol.</small>
                </label>
              </div>
              <div className="field-grid field-grid--two">
                <label className="field">
                  <span>Tahmini proje süresi</span>
                  <input
                    required
                    aria-invalid={!duration.trim()}
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Revizyon hakkı</span>
                  <select value={revision} onChange={(event) => setRevision(event.target.value)}>
                    <option value="1">1 revizyon turu</option>
                    <option value="2">2 revizyon turu</option>
                    <option value="3">3 revizyon turu</option>
                  </select>
                </label>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <div className="section-heading">
                <span>03</span>
                <div>
                  <h2>Hizmet ve fiyatlandırma</h2>
                  <p>Kalemleri ve ödeme planını şeffaf biçimde göster.</p>
                </div>
              </div>
              <div className="currency-tax-row">
                <label className="field">
                  <span>Para birimi</span>
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as Currency)}
                  >
                    <option value="TRY">TL — Türk Lirası</option>
                    <option value="USD">USD — Amerikan Doları</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </label>
                <label className="field">
                  <span>Vergi bilgisi</span>
                  <select
                    value={taxInfo}
                    onChange={(event) => setTaxInfo(event.target.value as TaxInfo)}
                  >
                    <option value="excluded">KDV hariç</option>
                    <option value="included">KDV dahil</option>
                    <option value="none">Vergi uygulanmıyor</option>
                  </select>
                </label>
              </div>
              <div className="items-editor">
                <div className="items-head">
                  <span>Hizmet açıklaması</span>
                  <span>Adet</span>
                  <span>Birim fiyat</span>
                  <span>Tutar</span>
                  <span />
                </div>
                {items.map((item) => (
                  <div className="item-row" key={item.id}>
                    <input
                      aria-label="Hizmet açıklaması"
                      required
                      aria-invalid={!item.description.trim()}
                      value={item.description}
                      onChange={(event) => updateItem(item.id, "description", event.target.value)}
                    />
                    <input
                      aria-label="Miktar"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(item.id, "quantity", Number(event.target.value))}
                    />
                    <div className="money-field">
                      <input
                        aria-label="Birim fiyat"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(item.id, "unitPrice", Number(event.target.value))}
                      />
                      <span>{currency}</span>
                    </div>
                    <strong>{formatAmount(item.quantity * item.unitPrice, currency)}</strong>
                    <button
                      type="button"
                      aria-label={item.description + " kalemini sil"}
                      onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="add-item" onClick={addItem}>
                  ＋ Hizmet kalemi ekle
                </button>
              </div>
              <div className="pricing-total">
                <span>
                  <small>Ara toplam</small>
                  <strong>{formatAmount(total, currency)}</strong>
                </span>
                <span>
                  <small>KDV</small>
                  <strong>{taxLabel(taxInfo)}</strong>
                </span>
                <span className="pricing-grand">
                  <small>Proje toplamı</small>
                  <strong>{formatAmount(total, currency)}</strong>
                </span>
              </div>
              <label className="field">
                <span>Ödeme planı</span>
                <textarea
                  rows={4}
                  required
                  aria-invalid={!paymentPlan.trim()}
                  value={paymentPlan}
                  onChange={(event) => setPaymentPlan(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Ek koşullar</span>
                <textarea
                  rows={3}
                  value={additionalTerms}
                  onChange={(event) => setAdditionalTerms(event.target.value)}
                />
                <small>Müşteri onay süreleri veya proje başlangıç varsayımları gibi notlar.</small>
              </label>
            </>
          ) : (
            <>
              <div className="section-heading">
                <span>04</span>
                <div>
                  <h2>İncele ve yayınla</h2>
                  <p>Paylaşım bağlantısını oluşturmadan önce son kontrolleri tamamla.</p>
                </div>
              </div>
              <div className="review-summary">
                <div className="review-project">
                  <span className="review-logo">N</span>
                  <span>
                    <small>{company}</small>
                    <strong>{projectName}</strong>
                  </span>
                  <button type="button" onClick={() => setStep(0)}>
                    Düzenle
                  </button>
                </div>
                <div className="review-grid">
                  <span>
                    <small>Toplam</small>
                    <strong>{formatAmount(total, currency)}</strong>
                  </span>
                  <span>
                    <small>Süre</small>
                    <strong>{duration}</strong>
                  </span>
                  <span>
                    <small>Geçerlilik</small>
                    <strong>{formatDate(validUntil)}</strong>
                  </span>
                </div>
              </div>
              <div className="publish-checklist">
                <h3>Yayın kontrolü</h3>
                {[
                  {
                    label: "Müşteri ve proje bilgileri",
                    value: "Tamamlandı",
                    valid: Boolean(clientName.trim() && company.trim() && projectName.trim() && summary.trim()),
                  },
                  {
                    label: "Kapsam ve teslimatlar",
                    value: "Tamamlandı",
                    valid: Boolean(scope.trim() && deliverables.trim() && duration.trim()),
                  },
                  {
                    label: String(items.length) + " hizmet kalemi",
                    value: formatAmount(total, currency),
                    valid: Boolean(
                      items.length &&
                        items.every(
                          (item) => item.description.trim() && item.quantity > 0 && item.unitPrice > 0,
                        ) &&
                        total > 0,
                    ),
                  },
                  {
                    label: "Geçerlilik tarihi",
                    value: formatDate(validUntil),
                    valid: Boolean(startDate && validUntil && validUntil >= startDate),
                  },
                ].map(({ label, value, valid }) => (
                  <div key={label} className={cx(!valid && "is-incomplete")}>
                    <span className="check-circle" aria-hidden="true">
                      {valid ? "✓" : "!"}
                    </span>
                    <span>{label}</span>
                    <strong>{valid ? value : "Eksik"}</strong>
                  </div>
                ))}
              </div>
              {validationIssues.length ? (
                <div className="validation-summary" id="publish-validation" role="alert">
                  <strong>Yayınlamadan önce tamamla</strong>
                  <span>{validationIssues.join(", ")}</span>
                </div>
              ) : null}
              <div className="legal-note">
                <span aria-hidden="true">i</span>
                <p>
                  Yayınlanan bağlantı müşteri hesabı gerektirmez. Görüntülenme verileri yaklaşık sinyaldir;
                  hukuki okuma veya kimlik kanıtı değildir.
                </p>
              </div>
              <button
                type="button"
                className="publish-button"
                onClick={() => {
                  if (validationIssues.length) {
                    notify("Yayınlama için eksik veya geçersiz alanları tamamla.");
                    return;
                  }
                  setPublishModal(true);
                }}
              >
                <span>
                  <strong>Yayınla ve paylaşım bağlantısı oluştur</strong>
                  <small>Linki istediğin iletişim kanalından sen gönderirsin.</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </>
          )}

          <footer className="editor-card-footer">
            <button
              type="button"
              className="button button--ghost"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              ← Geri
            </button>
            {step < editorSteps.length - 1 ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => setStep((current) => Math.min(editorSteps.length - 1, current + 1))}
              >
                Devam et →
              </button>
            ) : null}
          </footer>
        </section>

        <aside className={cx("live-preview", aiPanel && "live-preview--ai")}>
          {aiPanel ? (
            <div className="ai-panel">
              <div className="ai-panel__header">
                <span className="spark" aria-hidden="true">
                  ✦
                </span>
                <span>
                  <strong>AI teklif asistanı</strong>
                  <small>Düzenlenebilir taslak · fiyat üretmez</small>
                </span>
                <button type="button" onClick={() => setAiPanel(false)} aria-label="AI panelini kapat">
                  ×
                </button>
              </div>
              {aiLoading ? (
                <div className="ai-loading" role="status" aria-live="polite">
                  <span className="ai-pulse">✦</span>
                  <strong>Proje bağlamını düzenliyorum…</strong>
                  <p>Kapsam, teslimatlar ve hariç işleri ayrı alanlar halinde hazırlıyorum.</p>
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              ) : (
                <>
                  <div className="ai-ready">
                    <span>3 alan için taslak hazır</span>
                    <small>Yalnız seçtiklerin forma uygulanır.</small>
                  </div>
                  <label className="ai-suggestion">
                    <input
                      type="checkbox"
                      checked={aiSelections.summary}
                      onChange={(event) =>
                        setAiSelections((current) => ({ ...current, summary: event.target.checked }))
                      }
                    />
                    <span>
                      <strong>Proje özeti</strong>
                      <p>
                        NovaWorks’ün B2B SaaS ürününü daha anlaşılır anlatan ve nitelikli demo taleplerini
                        artırmaya odaklanan responsive web deneyimi.
                      </p>
                    </span>
                  </label>
                  <label className="ai-suggestion">
                    <input
                      type="checkbox"
                      checked={aiSelections.scope}
                      onChange={(event) =>
                        setAiSelections((current) => ({ ...current, scope: event.target.checked }))
                      }
                    />
                    <span>
                      <strong>Proje kapsamı</strong>
                      <p>
                        Mevcut deneyimin analizi, bilgi mimarisinin sadeleştirilmesi ve ana dönüşüm
                        akışlarının yeniden tasarlanması.
                      </p>
                    </span>
                  </label>
                  <label className="ai-suggestion">
                    <input
                      type="checkbox"
                      checked={aiSelections.excluded}
                      onChange={(event) =>
                        setAiSelections((current) => ({ ...current, excluded: event.target.checked }))
                      }
                    />
                    <span>
                      <strong>Hariç tutulan işler</strong>
                      <p>Frontend geliştirme, içerik üretimi, hosting ve üçüncü taraf lisans maliyetleri.</p>
                    </span>
                  </label>
                  <div className="ai-guardrail">
                    <span aria-hidden="true">◇</span>
                    AI fiyat belirlemez ve mevcut metnini onayın olmadan değiştirmez.
                  </div>
                  <button type="button" className="button button--primary button--full" onClick={applyAi}>
                    Seçili önerileri uygula
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="preview-label">
                <span>CANLI ÖNİZLEME</span>
                <button type="button" onClick={() => onPreview(createSnapshot())}>
                  Tam ekran ↗
                </button>
              </div>
              <div className="preview-paper">
                <div className="preview-paper__header">
                    <span className="preview-brand">{initials(profile.brand)}</span>
                    <span>
                      <strong>{profile.brand}</strong>
                      <small>{profile.profession}</small>
                  </span>
                  <span className="preview-number">TEKLİF · 1048</span>
                </div>
                <div className="preview-paper__hero">
                  <span>{company || "Müşteri şirketi"} için hazırlandı</span>
                  <h2>{projectName || "Proje adı"}</h2>
                  <p>{summary || "Proje özeti burada görünecek."}</p>
                </div>
                <div className="preview-meta">
                  <span>
                    <small>SÜRE</small>
                    <strong>{duration}</strong>
                  </span>
                  <span>
                    <small>BAŞLANGIÇ</small>
                    <strong>{formatDate(startDate)}</strong>
                  </span>
                  <span>
                    <small>GEÇERLİLİK</small>
                    <strong>{formatDate(validUntil)}</strong>
                  </span>
                </div>
                <div className="preview-section">
                  <span>01</span>
                  <div>
                    <h3>Proje kapsamı</h3>
                    <p>{scope}</p>
                  </div>
                </div>
                <div className="preview-section">
                  <span>02</span>
                  <div className="preview-price">
                    <h3>Yatırım</h3>
                    <strong>{formatAmount(total, currency)}</strong>
                    <small>{taxLabel(taxInfo)}</small>
                  </div>
                </div>
                <div className="preview-disclaimer">Bu belge fatura yerine geçmez.</div>
              </div>
            </>
          )}
        </aside>
      </div>

      <ProductFooter />

      {publishModal ? (
        <Modal
          title="Teklifi yayınlamaya hazır mısın?"
          description="Yayınlama sonrasında güvenli bir paylaşım bağlantısı oluşur. Prototipte içerik kilitlenir; değişiklik için teklifi çoğaltabilirsin."
          confirmLabel="Yayınla ve bağlantıyı oluştur"
          onClose={() => setPublishModal(false)}
          onConfirm={() => {
            setPublishModal(false);
            onPublish(createSnapshot());
          }}
        />
      ) : null}
      </main>
    </div>
  );
}

function ProposalDetail({
  draft,
  profile,
  decision,
  views,
  linkRevoked,
  customerMessage,
  onOpenPublic,
  onRevoke,
  onDuplicate,
  notify,
}: {
  draft: DraftSnapshot;
  profile: ProfileSnapshot;
  decision: "accepted" | "rejected" | null;
  views: number;
  linkRevoked: boolean;
  customerMessage: string;
  onOpenPublic: () => void;
  onRevoke: () => void;
  onDuplicate: () => void;
  notify: (message: string) => void;
}) {
  const [scenario, setScenario] = useState(followUpScenarios[0]);
  const [tone, setTone] = useState(followUpTones[0]);
  const [message, setMessage] = useState(() =>
    buildFollowUpMessage(followUpScenarios[0], followUpTones[0], draft, profile),
  );
  const [generating, setGenerating] = useState(false);
  const [messageDirty, setMessageDirty] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const generationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (generationTimerRef.current) window.clearTimeout(generationTimerRef.current);
    };
  }, []);

  const generateFollowUp = () => {
    if (generationTimerRef.current) window.clearTimeout(generationTimerRef.current);
    setGenerating(true);
    generationTimerRef.current = window.setTimeout(() => {
      const nextMessage = buildFollowUpMessage(scenario, tone, draft, profile);
      if (messageDirty && message.trim()) {
        setPendingMessage(nextMessage);
      } else {
        setMessage(nextMessage);
        setMessageDirty(false);
      }
      setGenerating(false);
      generationTimerRef.current = null;
    }, 700);
  };

  const visibleStatus: Proposal["status"] = linkRevoked
    ? "Erişim iptal edildi"
    : decision === "accepted"
      ? "Kabul edildi"
      : decision === "rejected"
        ? "Reddedildi"
        : views > 0
          ? "Görüntülendi"
          : "Yayınlandı";

  return (
    <div className="detail-content">
      <div className="detail-title-row">
        <div className="detail-title">
          <span className="company-monogram">N</span>
          <div>
            <div className="detail-badges">
              <StatusPill status={visibleStatus} />
              {!decision && !linkRevoked ? <StatusPill status="Yanıt bekleniyor" /> : null}
            </div>
            <h2>{draft.projectName}</h2>
            <p>{draft.company} · TKL-1048 · Yayınlandı 15 Tem 2026</p>
          </div>
        </div>
        <div className="detail-actions">
          <button type="button" className="button button--ghost" onClick={onDuplicate}>
            Çoğalt
          </button>
          <button type="button" className="button button--soft" onClick={onOpenPublic} disabled={linkRevoked}>
            Müşteri görünümü ↗
          </button>
        </div>
      </div>

      <section className={cx("share-card", linkRevoked && "share-card--revoked")}>
        <div className="share-icon" aria-hidden="true">
          {linkRevoked ? "×" : "↗"}
        </div>
        <div>
          <span className="card-eyebrow">{linkRevoked ? "BAĞLANTI İPTAL EDİLDİ" : "PAYLAŞIM BAĞLANTISI"}</span>
          <strong>
            {linkRevoked
              ? "Bu bağlantı artık müşteri tarafından açılamaz."
              : "Bu cihazdaki demo · #musteri-teklifi"}
          </strong>
          <small>
            {linkRevoked
              ? "Geçmiş görüntülenme ve yanıtlar korunur."
              : "Linki kopyalamak teklifi otomatik olarak göndermez."}
          </small>
        </div>
        {!linkRevoked ? (
          <div className="share-actions">
            <button
              type="button"
              className="button button--light"
              onClick={async () =>
                notify(
                  (await copyText(
                    window.location.origin + window.location.pathname + "#musteri-teklifi",
                  ))
                    ? "Demo bağlantısı panoya kopyalandı. Aynı tarayıcıdaki sentetik veriyi açar; henüz gönderilmiş sayılmaz."
                    : "Bağlantı kopyalanamadı. Tarayıcı iznini kontrol edip tekrar dene.",
                )
              }
            >
              Bağlantıyı kopyala
            </button>
            <button type="button" className="revoke-link" onClick={onRevoke}>
              Erişimi iptal et
            </button>
          </div>
        ) : null}
      </section>

      <section className="tracking-grid">
        <article>
          <span className="tracking-icon" aria-hidden="true">
            ◉
          </span>
          <div>
            <small>İLK GÖRÜNTÜLENME</small>
            <strong>{views ? "17 Tem, 11:42" : "Henüz görüntülenmedi"}</strong>
            <span>{views ? "Bugün" : "—"}</span>
          </div>
        </article>
        <article>
          <span className="tracking-icon" aria-hidden="true">
            ↗
          </span>
          <div>
            <small>SON GÖRÜNTÜLENME</small>
            <strong>{views ? "17 Tem, 14:18" : "Henüz görüntülenmedi"}</strong>
            <span>{views ? "24 dakika önce" : "—"}</span>
          </div>
        </article>
        <article className="tracking-total">
          <span>
            <small>TOPLAM GÖRÜNTÜLENME</small>
            <strong>{views}</strong>
          </span>
          <div className="tracking-sparkline" aria-hidden="true">
            {[18, 28, 24, 42, 36, 64, 58, 88, 72, 94].map((height, index) => (
              <i key={index} style={{ height: height + "%" }} />
            ))}
          </div>
        </article>
      </section>

      <div className="tracking-notice">
        <span aria-hidden="true">i</span>
        Görüntülenme verileri botlar, bağlantı önizlemeleri, gizlilik ayarları ve teknik engeller nedeniyle
        yaklaşık olabilir.
      </div>

      <div className="detail-grid">
        <section className="panel activity-card">
          <div className="panel-header">
            <div>
              <h2>Teklif hareketleri</h2>
              <p>Yaklaşık görüntülenme ve müşteri aksiyonları</p>
            </div>
            <button
              type="button"
              className="dots-button"
              disabled
              title="Sonraki prototip aşamasında"
              aria-label="Hareket seçenekleri"
            >
              ···
            </button>
          </div>
          <div className="timeline">
            {decision ? (
              <div className="timeline-item timeline-item--decision">
                <span className="timeline-marker" aria-hidden="true">
                  {decision === "accepted" ? "✓" : "×"}
                </span>
                <div>
                  <strong>Teklif {decision === "accepted" ? "kabul edildi" : "reddedildi"}</strong>
                  <p>Müşteri bağlantı üzerinden kararını onayladı.</p>
                  <small>Bugün, 15:06</small>
                </div>
              </div>
            ) : null}
            {customerMessage ? (
              <div className="timeline-item">
                <span className="timeline-marker" aria-hidden="true">
                  “
                </span>
                <div>
                  <strong>Müşteri mesaj bıraktı</strong>
                  <p>{customerMessage}</p>
                  <small>Bugün, 14:34</small>
                </div>
              </div>
            ) : null}
            {views > 0 ? (
              <>
                {views > 1 ? (
                  <div className="timeline-item">
                    <span className="timeline-marker" aria-hidden="true">
                      ◉
                    </span>
                    <div>
                      <strong>Teklif yeniden görüntülendi</strong>
                      <p>Bu, aynı veya farklı bir kişi olabilir.</p>
                      <small>Bugün, 14:18</small>
                    </div>
                  </div>
                ) : null}
                <div className="timeline-item">
                  <span className="timeline-marker" aria-hidden="true">
                    ◉
                  </span>
                  <div>
                    <strong>İlk nitelikli görüntülenme</strong>
                    <p>Bağlantı başarılı biçimde açıldı.</p>
                    <small>Bugün, 11:42</small>
                  </div>
                </div>
              </>
            ) : null}
            <div className="timeline-item">
              <span className="timeline-marker" aria-hidden="true">
                ↗
              </span>
              <div>
                <strong>Teklif yayınlandı</strong>
                <p>Güvenli paylaşım bağlantısı oluşturuldu.</p>
                <small>15 Tem, 16:20</small>
              </div>
            </div>
          </div>
        </section>

        <section className="panel follow-card">
          <div className="follow-heading">
            <span className="spark" aria-hidden="true">
              ✦
            </span>
            <div>
              <span className="card-eyebrow">AI TAKİP ASİSTANI</span>
              <h2>Doğru tonda takip et.</h2>
              <p>Mesaj yalnızca taslak olarak hazırlanır; otomatik gönderilmez.</p>
            </div>
          </div>
          <div className="field-grid field-grid--two">
            <label className="field field--compact">
              <span>Senaryo</span>
              <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
                {followUpScenarios.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="field field--compact">
              <span>Ton</span>
              <select value={tone} onChange={(event) => setTone(event.target.value)}>
                {followUpTones.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="button button--dark button--full"
            onClick={generateFollowUp}
            disabled={generating || Boolean(decision)}
          >
            <span className="spark" aria-hidden="true">
              ✦
            </span>
            {decision ? "Terminal karardan sonra kapalı" : generating ? "Mesaj hazırlanıyor…" : "Takip mesajı oluştur"}
          </button>
          <label className="generated-message">
            <span>Oluşturulan taslak</span>
            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setMessageDirty(true);
              }}
              rows={7}
            />
          </label>
          <div className="follow-footer">
            <span>{message.length} karakter · Düzenlenebilir</span>
            <button
              type="button"
              onClick={async () =>
                notify(
                  (await copyText(message))
                    ? "Takip mesajı panoya kopyalandı."
                    : "Mesaj kopyalanamadı. Tarayıcı iznini kontrol edip tekrar dene.",
                )
              }
            >
              Kopyala
            </button>
          </div>
        </section>
      </div>
      {pendingMessage ? (
        <Modal
          title="Düzenlediğin mesaj değiştirilsin mi?"
          description="Yeni taslak mevcut metnin yerine geçecek. Vazgeçersen düzenlediğin mesaj korunur."
          confirmLabel="Yeni taslağı kullan"
          onClose={() => setPendingMessage(null)}
          onConfirm={() => {
            setMessage(pendingMessage);
            setMessageDirty(false);
            setPendingMessage(null);
          }}
        />
      ) : null}
    </div>
  );
}

function PublicProposal({
  draft,
  profile,
  preview,
  decision,
  linkRevoked,
  onBack,
  onDecision,
  onMessage,
}: {
  draft: DraftSnapshot;
  profile: ProfileSnapshot;
  preview: boolean;
  decision: "accepted" | "rejected" | null;
  linkRevoked: boolean;
  onBack: () => void;
  onDecision: (value: "accepted" | "rejected") => void;
  onMessage: (value: string) => void;
}) {
  const [confirm, setConfirm] = useState<"accepted" | "rejected" | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("Teslim planındaki geliştirme desteğini ayrıca konuşabilir miyiz?");

  if (linkRevoked) {
    return (
      <main className="public-error">
        <BrandMark />
        <div className="public-error-card">
          <span aria-hidden="true">×</span>
          <h1>Bu teklif artık erişilebilir değil.</h1>
          <p>Bağlantı iptal edilmiş veya geçerlilik süresi dolmuş olabilir. Detay için teklifi gönderen kişiyle iletişime geçebilirsin.</p>
          <button type="button" className="button button--soft" onClick={onBack}>
            Demo paneline dön
          </button>
        </div>
        <small>Güvenli teklif bağlantısı · İçerik paylaşılmadı</small>
      </main>
    );
  }

  return (
    <div className="public-page">
      {preview ? (
        <div className="owner-preview-bar">
          <span>
            <strong>Sahip önizlemesi</strong>
            Bu görüntülenme sayılmaz ve müşteriye özel aksiyonları kaydetmez.
          </span>
          <button type="button" className="button button--light" onClick={onBack}>
            Editöre dön
          </button>
        </div>
      ) : (
        <div className="public-security-bar">
          <span className="security-note">
            <span aria-hidden="true">◇</span>
            Bu sayfa güvenli bir teklif bağlantısıyla paylaşıldı.
          </span>
          <button type="button" className="text-button" onClick={onBack}>
            Demo paneline dön →
          </button>
        </div>
      )}
      <header className="public-header">
        <div className="public-header__inner">
          <div className="public-brand">
            <span>{initials(profile.brand)}</span>
            <div>
              <strong>{profile.brand}</strong>
              <small>{profile.profession}</small>
            </div>
          </div>
          <div className="public-contact">
            <span>{profile.name}</span>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </div>
        </div>
      </header>

      <main className="proposal-document">
        <section className="document-hero">
          <div className="document-meta-top">
            <span>TEKLİF NO · TKL-1048</span>
            <span>17 TEMMUZ 2026</span>
          </div>
          <span className="document-kicker">{draft.company} için hazırlandı</span>
          <h1>{draft.projectName}</h1>
          <p>{draft.summary}</p>
          <div className="document-facts">
            <div>
              <small>PROJE SÜRESİ</small>
              <strong>{draft.duration}</strong>
            </div>
            <div>
              <small>BAŞLANGIÇ</small>
              <strong>{formatDate(draft.startDate)}</strong>
            </div>
            <div>
              <small>TEKLİF GEÇERLİLİĞİ</small>
              <strong>{formatDate(draft.validUntil)}</strong>
            </div>
          </div>
        </section>

        <section className="document-section">
          <span className="document-index">01</span>
          <div>
            <span className="document-label">PROJE YAKLAŞIMI</span>
            <h2>Daha net bir anlatı, daha güçlü bir ilk izlenim.</h2>
            <p>{draft.scope}</p>
          </div>
        </section>

        <section className="document-section">
          <span className="document-index">02</span>
          <div>
            <span className="document-label">KAPSAM & TESLİMATLAR</span>
            <h2>Birlikte üreteceklerimiz.</h2>
            <div className="deliverable-grid">
              {draft.deliverables
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .map((title, index) => (
                <article key={title + String(index)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>Teklif kapsamındaki planlı teslimata ve ilgili onay adımına dahildir.</p>
                </article>
              ))}
            </div>
            <div className="excluded-box">
              <strong>Kapsam dışında kalanlar</strong>
              <span>{draft.excluded.split("\n").filter(Boolean).join(" · ")}</span>
            </div>
          </div>
        </section>

        <section className="document-section investment-section">
          <span className="document-index">03</span>
          <div>
            <span className="document-label">YATIRIM</span>
            <h2>Proje bütçesi.</h2>
            <div className="investment-table">
              {draft.items.map((item) => (
                <div key={item.id}>
                  <span>{item.description}</span>
                  <strong>{formatAmount(item.quantity * item.unitPrice, draft.currency)}</strong>
                </div>
              ))}
              <div className="investment-total">
                <span>
                  <small>TOPLAM</small>
                  {taxLabel(draft.taxInfo)}
                </span>
                <strong>{formatAmount(draft.total, draft.currency)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="document-section">
          <span className="document-index">04</span>
          <div>
            <span className="document-label">ÇALIŞMA KOŞULLARI</span>
            <h2>Şeffaf ve öngörülebilir bir süreç.</h2>
            <div className="terms-grid">
              <article>
                <small>ÖDEME PLANI</small>
                <strong>Planlı ödeme</strong>
                <p>{draft.paymentPlan}</p>
              </article>
              <article>
                <small>REVİZYON</small>
                <strong>{draft.revision} tur</strong>
                <p>Her ana tasarım teslimi için toplu revizyon turu dahildir.</p>
              </article>
              <article>
                <small>EK KOŞULLAR</small>
                <strong>Takvim varsayımı</strong>
                <p>{draft.additionalTerms}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="document-end">
          <span className="document-label">SONRAKİ ADIM</span>
          <h2>Birlikte çalışmaya hazır mısınız?</h2>
          <p>Teklifi kabul edebilir, reddedebilir veya aklınızdaki soruyu Deniz’e iletebilirsiniz.</p>
          {decision ? (
            <div className={cx("decision-result", decision === "rejected" && "decision-result--rejected")}>
              <span aria-hidden="true">{decision === "accepted" ? "✓" : "×"}</span>
              <div>
                <strong>Teklif {decision === "accepted" ? "kabul edildi" : "reddedildi"}.</strong>
                <p>Kararınız kaydedildi. {profile.name} bu durumu kendi panelinde görebilir.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="public-actions">
                <button
                  type="button"
                  className="button button--accept"
                  disabled={preview}
                  onClick={() => setConfirm("accepted")}
                >
                  Teklifi kabul et
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  className="button button--reject"
                  disabled={preview}
                  onClick={() => setConfirm("rejected")}
                >
                  Teklifi reddet
                </button>
                <button
                  type="button"
                  className="button button--message"
                  disabled={preview}
                  onClick={() => setShowMessage(true)}
                >
                  Mesaj bırak
                </button>
              </div>
              {preview ? (
                <span className="preview-action-note">
                  Sahip önizlemesinde müşteri kararları ve mesajları kaydedilmez.
                </span>
              ) : null}
            </>
          )}
          <small className="decision-disclaimer">
            Bağlantı üzerinden verilen yanıt, elektronik imza veya hukuki kimlik doğrulaması değildir.
          </small>
        </section>
      </main>

      <footer className="public-footer" id="privacy">
        <div>
          <BrandMark />
          <span>Profesyonel teklif deneyimi</span>
        </div>
        <p>
          Görüntülenme bilgileri yaklaşık olabilir. <a href="#privacy">Gizlilik ve takip bildirimi</a>
        </p>
        <small>Bu belge fatura yerine geçmez.</small>
      </footer>

      {confirm ? (
        <Modal
          title={confirm === "accepted" ? "Teklifi kabul ediyor musunuz?" : "Teklifi reddediyor musunuz?"}
          description={
            confirm === "accepted"
              ? "Onayınız kaydedilecek ve teklifi hazırlayan kişi bilgilendirilecektir."
              : "Ret kararınız kaydedilecek. Dilerseniz ayrıca kısa bir mesaj bırakabilirsiniz."
          }
          confirmLabel={confirm === "accepted" ? "Evet, kabul ediyorum" : "Evet, reddediyorum"}
          tone={confirm === "accepted" ? "primary" : "danger"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            onDecision(confirm);
            setConfirm(null);
          }}
        />
      ) : null}

      {showMessage ? (
        <Modal
          title="Deniz’e mesaj bırak"
          description="Sorunuzu veya notunuzu düz metin olarak iletebilirsiniz. Mesajınız kabul/ret kararını değiştirmez."
          confirmLabel="Mesajı gönder"
          confirmDisabled={!message.trim()}
          onClose={() => setShowMessage(false)}
          onConfirm={() => {
            onMessage(message);
            setShowMessage(false);
          }}
        >
          <label className="field modal-field">
            <span>Mesajınız</span>
            <textarea
              rows={5}
              maxLength={500}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <small>{message.length} / 500 karakter</small>
          </label>
        </Modal>
      ) : null}
    </div>
  );
}

function DemoTour({
  screen,
  onSelect,
}: {
  screen: Screen;
  onSelect: (screen: Screen) => void;
}) {
  const activeScreen = screen === "proposals" ? "dashboard" : screen;

  return (
    <header className="demo-tour">
      <div className="demo-tour__intro">
        <span>CANLI ÜRÜN TURU</span>
        <p>Örnek verilerle Kapsam’ın temel akışlarını keşfet.</p>
      </div>
      <nav className="demo-tour__steps" aria-label="Demo adımları">
        {demoTourSteps.map((step) => (
          <button
            key={step.screen}
            type="button"
            className={cx(activeScreen === step.screen && "is-active")}
            aria-current={activeScreen === step.screen ? "step" : undefined}
            onClick={() => onSelect(step.screen)}
          >
            <span>{step.marker}</span>
            {step.label}
          </button>
        ))}
      </nav>
      <div className="demo-tour__actions">
        <Link href="/">Landing’e dön</Link>
        <Link className="demo-tour__cta" href="/#waitlist">Alpha sürümüne katıl</Link>
      </div>
    </header>
  );
}

export function PrototypeApp({ mode = "alpha" }: { mode?: "alpha" | "demo" }) {
  const isDemo = mode === "demo";
  const [screen, setScreen] = useState<Screen>(() => isDemo ? "dashboard" : "onboarding");
  const [profile, setProfile] = useState<ProfileSnapshot>(defaultProfile);
  const [draftSnapshot, setDraftSnapshot] = useState<DraftSnapshot>(() => ({
    ...defaultDraftSnapshot,
    items: defaultDraftSnapshot.items.map((item) => ({ ...item })),
  }));
  const [toast, setToast] = useState("");
  const [publicPreview, setPublicPreview] = useState(false);
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);
  const [views, setViews] = useState(3);
  const [linkRevoked, setLinkRevoked] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [revokeModal, setRevokeModal] = useState(false);
  const [publicCounted, setPublicCounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    if (isDemo) return;

    const openSharedDemo = () => {
      if (window.location.hash !== "#musteri-teklifi") return;

      try {
        const saved = window.localStorage.getItem("kapsam-prototype-state-v1");
        if (saved) {
          const parsed = JSON.parse(saved) as {
            profile?: ProfileSnapshot;
            draft?: DraftSnapshot;
          };
          if (parsed.profile) setProfile({ ...defaultProfile, ...parsed.profile });
          if (parsed.draft) {
            setDraftSnapshot({
              ...defaultDraftSnapshot,
              ...parsed.draft,
              items: Array.isArray(parsed.draft.items)
                ? parsed.draft.items.map((item) => ({ ...item }))
                : defaultDraftSnapshot.items.map((item) => ({ ...item })),
            });
          }
        }
      } catch {
        // Demo state unavailable: continue with the synthetic fallback proposal.
      }

      setPublicPreview(false);
      setScreen("public");
      setPublicCounted((counted) => {
        if (!counted) setViews((current) => current + 1);
        return true;
      });
    };

    openSharedDemo();
    const hydrationTimer = window.setTimeout(() => setHydrated(true), 0);
    window.addEventListener("hashchange", openSharedDemo);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("hashchange", openSharedDemo);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [isDemo]);

  useEffect(() => {
    if (isDemo || !hydrated) return;
    try {
      window.localStorage.setItem(
        "kapsam-prototype-state-v1",
        JSON.stringify({ profile, draft: draftSnapshot }),
      );
    } catch {
      // Private browsing may block storage; the in-session prototype still works.
    }
  }, [draftSnapshot, hydrated, isDemo, profile]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const navigate = (next: Screen) => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setPublicPreview(false);
    setScreen(isDemo && next === "onboarding" ? "dashboard" : next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPublic = (preview: boolean) => {
    const shouldPreview = isDemo || preview;
    setPublicPreview(shouldPreview);
    if (!shouldPreview) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + "#musteri-teklifi",
      );
    }
    if (!shouldPreview && !publicCounted && !linkRevoked) {
      setViews((current) => current + 1);
      setPublicCounted(true);
    }
    setScreen("public");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewDraft = (currencyOverride?: Currency) => {
    const currency =
      typeof currencyOverride === "string" ? currencyOverride : profile.currency;
    setDraftSnapshot({
      ...defaultDraftSnapshot,
      currency,
      items: defaultDraftSnapshot.items.map((item) => ({ ...item })),
    });
    setDecision(null);
    setViews(0);
    setLinkRevoked(false);
    setCustomerMessage("");
    setPublicCounted(false);
    navigate("editor");
  };

  const selectDemoStep = (next: Screen) => {
    if (next === "public") {
      openPublic(true);
      return;
    }
    navigate(next);
  };

  const withDemoTour = (content: ReactNode) => {
    if (!isDemo) return content;
    return (
      <div className="demo-experience">
        <DemoTour screen={screen} onSelect={selectDemoStep} />
        <div className="demo-experience__content">{content}</div>
      </div>
    );
  };

  if (screen === "onboarding") {
    return withDemoTour(
      <>
        <Onboarding
          initialProfile={profile}
          onSkip={() => navigate("dashboard")}
          onComplete={(nextProfile) => {
            setProfile(nextProfile);
            startNewDraft(nextProfile.currency);
            notify("Profilin hazır. İlk teklifini oluşturmaya başlayabilirsin.");
          }}
        />
        <Toast message={toast} />
      </>,
    );
  }

  if (screen === "editor" || (screen === "public" && publicPreview)) {
    return withDemoTour(
      <>
        <div
          className={cx("editor-keeper", screen !== "editor" && "is-hidden")}
          hidden={screen !== "editor"}
        >
          <ProposalEditor
            initialDraft={draftSnapshot}
            profile={profile}
            onBack={() => navigate("proposals")}
            onSave={setDraftSnapshot}
            onPreview={(draft) => {
              setDraftSnapshot(draft);
              openPublic(true);
            }}
            onPublish={(draft) => {
              setDraftSnapshot(draft);
              navigate("detail");
              notify("Teklif yayınlandı ve paylaşım bağlantısı oluşturuldu.");
            }}
            onNavigate={navigate}
            notify={notify}
            demoMode={isDemo}
          />
        </div>
        {screen === "public" ? (
          <PublicProposal
            draft={draftSnapshot}
            profile={profile}
            preview
            decision={decision}
            linkRevoked={linkRevoked}
            onBack={() => navigate("editor")}
            onDecision={() => undefined}
            onMessage={() => undefined}
          />
        ) : null}
        <Toast message={toast} />
      </>,
    );
  }

  if (screen === "public") {
    return withDemoTour(
      <>
        <PublicProposal
          draft={draftSnapshot}
          profile={profile}
          preview={publicPreview}
          decision={decision}
          linkRevoked={linkRevoked}
          onBack={() => navigate(publicPreview ? "editor" : "detail")}
          onDecision={(value) => {
            setDecision(value);
            notify(value === "accepted" ? "Müşteri teklifi kabul etti." : "Müşteri teklifi reddetti.");
          }}
          onMessage={(value) => {
            setCustomerMessage(value);
            notify("Mesaj güvenli biçimde kaydedildi.");
          }}
        />
        <Toast message={toast} />
      </>,
    );
  }

  const title =
    screen === "dashboard"
      ? "Tekliflerinin nabzı"
      : screen === "proposals"
        ? "Teklifler"
        : "Teklif detayı";
  const eyebrow =
    screen === "dashboard"
      ? "GENEL BAKIŞ"
      : screen === "proposals"
        ? "TEKLİF YÖNETİMİ"
        : "NOVAworks · TKL-1048";

  return withDemoTour(
    <>
      <AppShell
        screen={screen}
        profile={profile}
        title={title}
        eyebrow={eyebrow}
        onNavigate={navigate}
        onRestart={() => navigate(isDemo ? "dashboard" : "onboarding")}
        onCreate={startNewDraft}
        demoMode={isDemo}
      >
        {screen === "dashboard" ? (
          <Dashboard
            profile={profile}
            onCreate={startNewDraft}
            onResumeDraft={() => navigate("editor")}
            onOpenProposal={() => navigate("detail")}
            onViewAll={() => navigate("proposals")}
          />
        ) : screen === "proposals" ? (
          <ProposalTable
            onOpenProposal={() => navigate("detail")}
            onResumeDraft={() => navigate("editor")}
          />
        ) : (
          <ProposalDetail
            draft={draftSnapshot}
            profile={profile}
            decision={decision}
            views={views}
            linkRevoked={linkRevoked}
            customerMessage={customerMessage}
            onOpenPublic={() => openPublic(false)}
            onRevoke={() => setRevokeModal(true)}
            onDuplicate={() => {
              setDraftSnapshot((current) => ({
                ...current,
                projectName: current.projectName + " — Kopya",
                items: current.items.map((item) => ({ ...item })),
              }));
              setDecision(null);
              setViews(0);
              setLinkRevoked(false);
              setCustomerMessage("");
              setPublicCounted(false);
              navigate("editor");
              notify("Teklif yeni bir taslak olarak çoğaltıldı. Görüntülenme ve yanıtlar kopyalanmadı.");
            }}
            notify={notify}
          />
        )}
      </AppShell>
      <Toast message={toast} />
      {revokeModal ? (
        <Modal
          title="Paylaşım erişimini iptal et?"
          description="Eski bağlantı anında geçersiz olur. Geçmiş görüntülenmeler, kararlar ve mesajlar korunur."
          confirmLabel="Evet, erişimi iptal et"
          tone="danger"
          onClose={() => setRevokeModal(false)}
          onConfirm={() => {
            setLinkRevoked(true);
            setRevokeModal(false);
            notify("Paylaşım bağlantısı iptal edildi.");
          }}
        />
      ) : null}
    </>,
  );
}
