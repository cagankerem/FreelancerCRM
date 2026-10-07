"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type Screen = "onboarding" | "dashboard" | "proposals" | "editor" | "detail" | "public";

type Item = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Currency = "TRY" | "USD" | "EUR";
type TaxInfo = "excluded" | "included" | "none";
type Decision = "accepted" | "rejected" | null;
type PrototypeLayout = "page" | "embedded";

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
  excluded: "Frontend geliştirme\nMetin yazarlığı\nHosting ve domain\nÜcretli stok lisansları",
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

const proposalFilters = [
  "Tümü",
  "Taslak",
  "Yayınlandı",
  "Görüntülendi",
  "Kabul edildi",
  "Reddedildi",
];

const currencyOptions: Array<[Currency, string, string]> = [
  ["TRY", "TL", "Türk Lirası"],
  ["USD", "$", "Amerikan Doları"],
  ["EUR", "€", "Euro"],
];
const revisionOptions = [
  ["1", "1 revizyon turu"],
  ["2", "2 revizyon turu"],
  ["3", "3 revizyon turu"],
] as const;
const editorCurrencyOptions = [
  ["TRY", "TL — Türk Lirası"],
  ["USD", "USD — Amerikan Doları"],
  ["EUR", "EUR — Euro"],
] as const;
const taxOptions = [
  ["excluded", "KDV hariç"],
  ["included", "KDV dahil"],
  ["none", "Vergi uygulanmıyor"],
] as const;

const aiSuggestions = [
  {
    key: "summary",
    title: "Proje özeti",
    preview:
      "NovaWorks’ün B2B SaaS ürününü daha anlaşılır anlatan ve nitelikli demo taleplerini artırmaya odaklanan responsive web deneyimi.",
    value:
      "NovaWorks’ün B2B SaaS ürününü daha anlaşılır anlatan ve nitelikli demo taleplerini artırmaya odaklanan, dönüşüm odaklı responsive web deneyimi.",
  },
  {
    key: "scope",
    title: "Proje kapsamı",
    preview:
      "Mevcut deneyimin analizi, bilgi mimarisinin sadeleştirilmesi ve ana dönüşüm akışlarının yeniden tasarlanması.",
    value:
      "Mevcut site ve rakip deneyimlerinin analizi; bilgi mimarisinin sadeleştirilmesi; ana dönüşüm akışlarının wireframe, UI ve responsive component seviyesinde yeniden tasarlanması.",
  },
  {
    key: "excluded",
    title: "Hariç tutulan işler",
    preview: "Frontend geliştirme, içerik üretimi, hosting ve üçüncü taraf lisans maliyetleri.",
    value:
      "Frontend geliştirme\nİçerik üretimi\nHosting ve domain\nÜçüncü taraf lisans maliyetleri",
  },
] as const;

const metricCards = [
  {
    tone: "orange",
    icon: "↗",
    change: "+2 bu ay",
    value: "8",
    label: "Aktif teklif",
    footer: (
      <div className="mini-bars" aria-hidden="true">
        {[28, 38, 30, 48, 58, 50, 72, 86, 76, 92].map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
    ),
  },
  {
    tone: "green",
    icon: "◉",
    change: "Son 30 gün",
    value: "%72",
    label: "Görüntülenme oranı",
    footer: (
      <div className="metric-progress" aria-hidden="true">
        <span style={{ width: "72%" }} />
      </div>
    ),
  },
  {
    tone: "navy",
    icon: "✓",
    change: "1 yanıt bekliyor",
    value: "3",
    label: "Kabul edilen",
    footer: (
      <div className="avatar-stack" aria-hidden="true">
        <span>FY</span>
        <span>NA</span>
        <span>MK</span>
      </div>
    ),
  },
] as const;

type AiSuggestionKey = (typeof aiSuggestions)[number]["key"];
type StringKey<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
type FieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
type TextFieldProps = {
  label: string;
  value: string;
  onChange: (event: FieldEvent) => void;
  hint?: ReactNode;
  className?: string;
  rows?: number;
  type?: string;
  required?: boolean;
  invalid?: boolean;
  maxLength?: number;
};
type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (event: FieldEvent) => void;
  options: readonly (string | readonly [string, string])[];
  className?: string;
};

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
  return value === "included"
    ? "KDV dahil"
    : value === "excluded"
      ? "KDV hariç"
      : "Vergi uygulanmıyor";
}

function validateDraft(draft: DraftSnapshot, total: number) {
  const {
    clientName,
    company,
    projectName,
    summary,
    scope,
    deliverables,
    duration,
    startDate,
    validUntil,
    items,
    paymentPlan,
  } = draft;
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
  if (!Number.isFinite(total) || total <= 0 || total > 1000000000)
    issues.push("geçerli teklif toplamı");
  if (!paymentPlan.trim()) issues.push("ödeme planı");
  return issues;
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

function cloneDraft(draft: DraftSnapshot): DraftSnapshot {
  return { ...draft, items: draft.items.map((item) => ({ ...item })) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCurrency(value: unknown): value is Currency {
  return value === "TRY" || value === "USD" || value === "EUR";
}

function isTaxInfo(value: unknown): value is TaxInfo {
  return value === "excluded" || value === "included" || value === "none";
}

function isItem(value: unknown): value is Item {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.description === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unitPrice === "number"
  );
}

function isProfileSnapshot(value: unknown): value is ProfileSnapshot {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.profession === "string" &&
    typeof value.brand === "string" &&
    typeof value.email === "string" &&
    isCurrency(value.currency)
  );
}

function isDraftSnapshot(value: unknown): value is DraftSnapshot {
  return (
    isRecord(value) &&
    typeof value.projectName === "string" &&
    typeof value.clientName === "string" &&
    typeof value.company === "string" &&
    typeof value.summary === "string" &&
    typeof value.scope === "string" &&
    typeof value.deliverables === "string" &&
    typeof value.excluded === "string" &&
    typeof value.duration === "string" &&
    typeof value.startDate === "string" &&
    typeof value.validUntil === "string" &&
    typeof value.revision === "string" &&
    isCurrency(value.currency) &&
    isTaxInfo(value.taxInfo) &&
    typeof value.paymentPlan === "string" &&
    typeof value.additionalTerms === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isItem) &&
    typeof value.total === "number"
  );
}

function readStoredPrototypeState(value: string) {
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed)) return {};

  return {
    ...(isProfileSnapshot(parsed.profile) ? { profile: parsed.profile } : {}),
    ...(isDraftSnapshot(parsed.draft) ? { draft: parsed.draft } : {}),
  };
}

function useStringFields<T extends object>(initialValue: T | (() => T)) {
  const [fields, setFields] = useState<T>(initialValue);
  const bind = <K extends StringKey<T>>(key: K) => ({
    value: String(fields[key]),
    onChange: (event: FieldEvent) =>
      setFields((current) => ({ ...current, [key]: event.target.value })),
  });
  return [fields, setFields, bind] as const;
}

function useTimeoutRef() {
  const timerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );
  return timerRef;
}

function TextField({ label, hint, className, rows, invalid, ...controlProps }: TextFieldProps) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      {rows ? (
        <textarea rows={rows} aria-invalid={invalid} {...controlProps} />
      ) : (
        <input aria-invalid={invalid} {...controlProps} />
      )}
      {hint === undefined ? null : <small>{hint}</small>}
    </label>
  );
}

function SelectField({ label, options, className, ...controlProps }: SelectFieldProps) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      <select {...controlProps}>
        {options.map((option) => {
          const [value, text] = typeof option === "string" ? [option, option] : option;
          return (
            <option value={value} key={value}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function SectionHeading({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="section-heading">
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </div>
  );
}

function PanelHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
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
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Pencereyi kapat"
        >
          ×
        </button>
        <span
          className={cx("modal-icon", tone === "danger" && "modal-icon--danger")}
          aria-hidden="true"
        >
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
  embedded = false,
}: {
  initialProfile: ProfileSnapshot;
  onComplete: (profile: ProfileSnapshot) => void;
  onSkip: () => void;
  embedded?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [profile, setProfile, bind] = useStringFields(initialProfile);
  const { name, brand, currency } = profile;
  const PageRoot = embedded ? "div" : "main";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }
    onComplete(profile);
  };

  return (
    <PageRoot className="onboarding-page">
      <header className="onboarding-header">
        <BrandMark />
        <button type="button" className="text-button" onClick={onSkip}>
          Demo verileriyle geç <span aria-hidden="true">→</span>
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
                  Bu bilgiler yeni tekliflerde başlangıç değeri olur. Dilediğin zaman
                  değiştirebilirsin.
                </p>
                <TextField label="Adın soyadın" required {...bind("name")} />
                <TextField label="Ne iş yapıyorsun?" required {...bind("profession")} />
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
                <TextField label="Marka veya şirket adı" required {...bind("brand")} />
                <TextField label="İletişim e-postası" required type="email" {...bind("email")} />
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
                  {currencyOptions.map(([value, symbol, label]) => (
                    <label key={value} className={cx(currency === value && "is-selected")}>
                      <input
                        type="radio"
                        name="currency"
                        value={value}
                        checked={currency === value}
                        onChange={() => setProfile((current) => ({ ...current, currency: value }))}
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
                    <strong>Hazırsın, {name.split(" ")[0]}.</strong> Profilin {brand} adıyla
                    oluşturulacak.
                  </p>
                </div>
              </>
            )}

            <div className="form-footer">
              {step > 0 ? (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setStep((current) => current - 1)}
                >
                  Geri
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="button button--primary button--large">
                {step === 2 ? "İlk teklifimi oluştur" : "Devam et"}{" "}
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
    </PageRoot>
  );
}

function Sidebar({
  screen,
  profile,
  onNavigate,
  onRestart,
  demoMode = false,
  embedded = false,
}: {
  screen: Screen;
  profile: ProfileSnapshot;
  onNavigate: (next: Screen) => void;
  onRestart: () => void;
  demoMode?: boolean;
  embedded?: boolean;
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
        <button
          type="button"
          className="nav-item"
          disabled
          title={demoMode ? "Alpha üyeliği gerektirir" : "Sonraki prototip aşamasında"}
        >
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
          <p>
            {demoMode
              ? "Değişiklikler yalnız bu demo oturumunda tutulur."
              : "Bu ay 1 aktif teklif hakkın kaldı."}
          </p>
          {demoMode ? (
            embedded ? (
              <a href="#waitlist">Alpha sürümüne katıl →</a>
            ) : (
              <Link href="/#waitlist">Alpha sürümüne katıl →</Link>
            )
          ) : (
            <button type="button">Pro planı keşfet →</button>
          )}
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
  embedded = false,
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
  embedded?: boolean;
}) {
  const AppContent = embedded ? "div" : "main";
  const handleNavigate = (next: Screen) => {
    if (next === "editor") {
      onCreate();
      return;
    }
    onNavigate(next);
  };

  return (
    <div className="app-shell">
      <Sidebar
        screen={screen}
        profile={profile}
        onNavigate={handleNavigate}
        onRestart={onRestart}
        demoMode={demoMode}
        embedded={embedded}
      />
      <AppContent className="app-main">
        <div className="prototype-banner" role="note">
          <span>{demoMode ? "ÜRÜN DEMOSU" : "ALPHA SÜRÜMÜ"}</span>
          {demoMode
            ? "Örnek verilerle çalışır; yaptığın değişiklikler kaydedilmez."
            : "Kişisel çalışma alanın."}
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
              <span aria-hidden="true">＋</span> Yeni teklif
            </button>
          </div>
        </header>
        {children}
        <ProductFooter />
      </AppContent>
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
  const attentionItems = [
    [
      "hot",
      "↗",
      "NovaWorks teklifi görüntülendi",
      "Son görüntülenme 24 dakika önce",
      onOpenProposal,
    ],
    ["clock", "◷", "Atlas teklifinin süresi yaklaşıyor", "2 gün sonra sona erecek", onResumeDraft],
    ["draft", "◫", "Koru taslağı 6 gündür bekliyor", "Düzenlemeye devam et", undefined],
  ] as const;

  return (
    <div className="dashboard-content">
      <section className="welcome-panel">
        <div>
          <span className="welcome-date">CUMA · 17 TEMMUZ</span>
          <h2>Günaydın {profile.name.split(" ")[0] || profile.name}, tekliflerin hareketli.</h2>
          <p>
            NovaWorks teklifin bugün 2 kez görüntülendi. Takip etmek için iyi bir zaman olabilir.
          </p>
        </div>
        <button type="button" className="button button--light" onClick={onOpenProposal}>
          Teklifi aç <span aria-hidden="true">↗</span>
        </button>
        <div className="welcome-shape welcome-shape--one" />
        <div className="welcome-shape welcome-shape--two" />
      </section>

      <section className="metric-grid" aria-label="Teklif özeti">
        {metricCards.map(({ tone, icon, change, value, label, footer }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span className={`metric-icon metric-icon--${tone}`} aria-hidden="true">
                {icon}
              </span>
              <span className={cx("metric-change", tone === "green" && "metric-change--green")}>
                {change}
              </span>
            </div>
            <strong>{value}</strong>
            <span>{label}</span>
            {footer}
          </article>
        ))}
        <article className="metric-card metric-card--dark">
          <span className="metric-kicker">YANIT BEKLEYEN TL DEĞERİ</span>
          <strong>168.000</strong>
          <span>Türk Lirası</span>
          <small>Farklı para birimleri birleştirilmez.</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel proposals-panel">
          <PanelHeader title="Son teklifler" description="En son güncellenen teklifler">
            <button type="button" className="text-button" onClick={onViewAll}>
              Tümünü gör <span aria-hidden="true">→</span>
            </button>
          </PanelHeader>
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
          <PanelHeader
            title="AI takip önerileri"
            description="Teklif davranışlarına göre önerilen aksiyonlar"
          >
            <span className="count-badge">3</span>
          </PanelHeader>
          <div className="attention-list">
            {attentionItems.map(([tone, icon, title, description, onClick]) => (
              <button type="button" onClick={onClick} key={title}>
                <span className={`attention-icon attention-icon--${tone}`} aria-hidden="true">
                  {icon}
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
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

  const normalizedQuery = query.toLocaleLowerCase("tr-TR");
  const filtered = proposals.filter(
    (proposal) =>
      (filter === "Tümü" || proposal.status === filter) &&
      (!normalizedQuery ||
        proposal.title.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        proposal.client.toLocaleLowerCase("tr-TR").includes(normalizedQuery)),
  );

  return (
    <section className="table-panel">
      <div className="table-toolbar">
        <div className="filter-tabs" role="group" aria-label="Teklif filtreleri">
          {proposalFilters.map((item) => (
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
          <button
            type="button"
            className="button button--soft"
            onClick={() => {
              setQuery("");
              setFilter("Tümü");
            }}
          >
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
          <button type="button" disabled>
            2
          </button>
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
  embedded = false,
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
  embedded?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft, bind] = useStringFields(() => cloneDraft(initialDraft));
  const {
    projectName,
    clientName,
    company,
    summary,
    scope,
    deliverables,
    duration,
    startDate,
    validUntil,
    currency,
    taxInfo,
    paymentPlan,
    items,
  } = draft;
  const [aiPanel, setAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [aiSelections, setAiSelections] = useState<Record<AiSuggestionKey, boolean>>({
    summary: true,
    scope: true,
    excluded: false,
  });
  const aiTimerRef = useTimeoutRef();

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const validationIssues = validateDraft(draft, total);
  const EditorContent = embedded ? "div" : "main";

  const createSnapshot = (): DraftSnapshot => cloneDraft({ ...draft, total });
  const updateItems = (update: (current: Item[]) => Item[]) =>
    setDraft((current) => ({ ...current, items: update(current.items) }));

  const updateItem = (id: number, key: keyof Item, value: string | number) => {
    const numericValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
    const normalizedValue =
      key === "quantity"
        ? Math.min(10000, Math.max(1, Math.round(numericValue) || 1))
        : key === "unitPrice"
          ? Math.min(100000000, Math.max(0, numericValue))
          : value;
    updateItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: normalizedValue } : item)),
    );
  };

  const addItem = () =>
    updateItems((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        description: "Yeni hizmet kalemi",
        quantity: 1,
        unitPrice: 0,
      },
    ]);

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
    setDraft((current) => {
      const next = { ...current };
      for (const suggestion of aiSuggestions) {
        if (aiSelections[suggestion.key]) next[suggestion.key] = suggestion.value;
      }
      return next;
    });
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
        embedded={embedded}
      />
      <EditorContent className="editor-page">
        <div className="editor-topbar">
          <button type="button" className="back-button" onClick={onBack}>
            ← <span>Tekliflere dön</span>
          </button>
          <div className="editor-status">
            <span className="save-dot" />
            {demoMode
              ? "Demo değişiklikleri yalnız bu oturumda korunur"
              : "Değişiklikler bu oturumda korunuyor"}
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
            <li
              key={label}
              className={cx(index === step && "is-active", index < step && "is-complete")}
            >
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
                <SectionHeading index="01" title="Müşteri ve proje bilgileri">
                  Teklifin kimin için ve hangi iş için hazırlandığını tanımla.
                </SectionHeading>
                <div className="field-grid field-grid--two">
                  <TextField
                    label="Müşteri adı"
                    required
                    invalid={!clientName.trim()}
                    {...bind("clientName")}
                  />
                  <TextField
                    label="Şirket"
                    required
                    invalid={!company.trim()}
                    {...bind("company")}
                  />
                </div>
                <TextField
                  label="Proje adı"
                  required
                  invalid={!projectName.trim()}
                  hint="Müşterinin göreceği net ve kısa bir başlık kullan."
                  {...bind("projectName")}
                />
                <TextField
                  label="Proje özeti"
                  rows={5}
                  required
                  invalid={!summary.trim()}
                  maxLength={600}
                  hint={`${summary.length} / 600 karakter`}
                  {...bind("summary")}
                />
                <div className="field-grid field-grid--two">
                  <TextField
                    label="Başlangıç tarihi"
                    type="date"
                    required
                    invalid={!startDate}
                    {...bind("startDate")}
                  />
                  <TextField
                    label="Teklif geçerlilik tarihi"
                    type="date"
                    required
                    invalid={!validUntil || Boolean(startDate && validUntil < startDate)}
                    {...bind("validUntil")}
                  />
                </div>
              </>
            ) : step === 1 ? (
              <>
                <SectionHeading index="02" title="Kapsam ve teslimatlar">
                  Projenin sınırlarını iki taraf için de anlaşılır hale getir.
                </SectionHeading>
                <TextField
                  label="Proje kapsamı"
                  rows={6}
                  required
                  invalid={!scope.trim()}
                  {...bind("scope")}
                />
                <div className="field-grid field-grid--two">
                  <TextField
                    label="Teslim edilecekler"
                    rows={9}
                    required
                    invalid={!deliverables.trim()}
                    hint="Her satıra bir teslimat yaz."
                    {...bind("deliverables")}
                  />
                  <TextField
                    label="Hariç tutulan işler"
                    rows={9}
                    hint="Yanlış beklentiyi azaltmak için açık ol."
                    {...bind("excluded")}
                  />
                </div>
                <div className="field-grid field-grid--two">
                  <TextField
                    label="Tahmini proje süresi"
                    required
                    invalid={!duration.trim()}
                    {...bind("duration")}
                  />
                  <SelectField
                    label="Revizyon hakkı"
                    options={revisionOptions}
                    {...bind("revision")}
                  />
                </div>
              </>
            ) : step === 2 ? (
              <>
                <SectionHeading index="03" title="Hizmet ve fiyatlandırma">
                  Kalemleri ve ödeme planını şeffaf biçimde göster.
                </SectionHeading>
                <div className="currency-tax-row">
                  <SelectField
                    label="Para birimi"
                    options={editorCurrencyOptions}
                    {...bind("currency")}
                  />
                  <SelectField label="Vergi bilgisi" options={taxOptions} {...bind("taxInfo")} />
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
                        onChange={(event) =>
                          updateItem(item.id, "quantity", Number(event.target.value))
                        }
                      />
                      <div className="money-field">
                        <input
                          aria-label="Birim fiyat"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(item.id, "unitPrice", Number(event.target.value))
                          }
                        />
                        <span>{currency}</span>
                      </div>
                      <strong>{formatAmount(item.quantity * item.unitPrice, currency)}</strong>
                      <button
                        type="button"
                        aria-label={item.description + " kalemini sil"}
                        onClick={() =>
                          updateItems((current) =>
                            current.filter((candidate) => candidate.id !== item.id),
                          )
                        }
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
                  {[
                    [undefined, "Ara toplam", formatAmount(total, currency)],
                    [undefined, "KDV", taxLabel(taxInfo)],
                    ["pricing-grand", "Proje toplamı", formatAmount(total, currency)],
                  ].map(([className, label, value]) => (
                    <span className={className} key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </span>
                  ))}
                </div>
                <TextField
                  label="Ödeme planı"
                  rows={4}
                  required
                  invalid={!paymentPlan.trim()}
                  {...bind("paymentPlan")}
                />
                <TextField
                  label="Ek koşullar"
                  rows={3}
                  hint="Müşteri onay süreleri veya proje başlangıç varsayımları gibi notlar."
                  {...bind("additionalTerms")}
                />
              </>
            ) : (
              <>
                <SectionHeading index="04" title="İncele ve yayınla">
                  Paylaşım bağlantısını oluşturmadan önce son kontrolleri tamamla.
                </SectionHeading>
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
                    {[
                      ["Toplam", formatAmount(total, currency)],
                      ["Süre", duration],
                      ["Geçerlilik", formatDate(validUntil)],
                    ].map(([label, value]) => (
                      <span key={label}>
                        <small>{label}</small>
                        <strong>{value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="publish-checklist">
                  <h3>Yayın kontrolü</h3>
                  {[
                    {
                      label: "Müşteri ve proje bilgileri",
                      value: "Tamamlandı",
                      valid: Boolean(
                        clientName.trim() && company.trim() && projectName.trim() && summary.trim(),
                      ),
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
                          (item) =>
                            item.description.trim() && item.quantity > 0 && item.unitPrice > 0,
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
                    Yayınlanan bağlantı müşteri hesabı gerektirmez. Görüntülenme verileri yaklaşık
                    sinyaldir; hukuki okuma veya kimlik kanıtı değildir.
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
                  onClick={() =>
                    setStep((current) => Math.min(editorSteps.length - 1, current + 1))
                  }
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
                  <button
                    type="button"
                    onClick={() => setAiPanel(false)}
                    aria-label="AI panelini kapat"
                  >
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
                    {aiSuggestions.map(({ key, title, preview }) => (
                      <label className="ai-suggestion" key={key}>
                        <input
                          type="checkbox"
                          checked={aiSelections[key]}
                          onChange={(event) =>
                            setAiSelections((current) => ({
                              ...current,
                              [key]: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          <strong>{title}</strong>
                          <p>{preview}</p>
                        </span>
                      </label>
                    ))}
                    <div className="ai-guardrail">
                      <span aria-hidden="true">◇</span>
                      AI fiyat belirlemez ve mevcut metnini onayın olmadan değiştirmez.
                    </div>
                    <button
                      type="button"
                      className="button button--primary button--full"
                      onClick={applyAi}
                    >
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
                    {[
                      ["SÜRE", duration],
                      ["BAŞLANGIÇ", formatDate(startDate)],
                      ["GEÇERLİLİK", formatDate(validUntil)],
                    ].map(([label, value]) => (
                      <span key={label}>
                        <small>{label}</small>
                        <strong>{value}</strong>
                      </span>
                    ))}
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
      </EditorContent>
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
  decision: Decision;
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
  const generationTimerRef = useTimeoutRef();

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
  const activities = [
    decision && {
      className: "timeline-item timeline-item--decision",
      marker: decision === "accepted" ? "✓" : "×",
      title: `Teklif ${decision === "accepted" ? "kabul edildi" : "reddedildi"}`,
      text: "Müşteri bağlantı üzerinden kararını onayladı.",
      date: "Bugün, 15:06",
    },
    customerMessage && {
      className: "timeline-item",
      marker: "“",
      title: "Müşteri mesaj bıraktı",
      text: customerMessage,
      date: "Bugün, 14:34",
    },
    views > 1 && {
      className: "timeline-item",
      marker: "◉",
      title: "Teklif yeniden görüntülendi",
      text: "Bu, aynı veya farklı bir kişi olabilir.",
      date: "Bugün, 14:18",
    },
    views > 0 && {
      className: "timeline-item",
      marker: "◉",
      title: "İlk nitelikli görüntülenme",
      text: "Bağlantı başarılı biçimde açıldı.",
      date: "Bugün, 11:42",
    },
    {
      className: "timeline-item",
      marker: "↗",
      title: "Teklif yayınlandı",
      text: "Güvenli paylaşım bağlantısı oluşturuldu.",
      date: "15 Tem, 16:20",
    },
  ];
  const viewStats = [
    [
      "◉",
      "İLK GÖRÜNTÜLENME",
      views ? "17 Tem, 11:42" : "Henüz görüntülenmedi",
      views ? "Bugün" : "—",
    ],
    [
      "↗",
      "SON GÖRÜNTÜLENME",
      views ? "17 Tem, 14:18" : "Henüz görüntülenmedi",
      views ? "24 dakika önce" : "—",
    ],
  ];

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
          <button
            type="button"
            className="button button--soft"
            onClick={onOpenPublic}
            disabled={linkRevoked}
          >
            Müşteri görünümü ↗
          </button>
        </div>
      </div>

      <section className={cx("share-card", linkRevoked && "share-card--revoked")}>
        <div className="share-icon" aria-hidden="true">
          {linkRevoked ? "×" : "↗"}
        </div>
        <div>
          <span className="card-eyebrow">
            {linkRevoked ? "BAĞLANTI İPTAL EDİLDİ" : "PAYLAŞIM BAĞLANTISI"}
          </span>
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
        {viewStats.map(([icon, label, value, relative]) => (
          <article key={label}>
            <span className="tracking-icon" aria-hidden="true">
              {icon}
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
              <span>{relative}</span>
            </div>
          </article>
        ))}
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
        Görüntülenme verileri botlar, bağlantı önizlemeleri, gizlilik ayarları ve teknik engeller
        nedeniyle yaklaşık olabilir.
      </div>

      <div className="detail-grid">
        <section className="panel activity-card">
          <PanelHeader
            title="Teklif hareketleri"
            description="Yaklaşık görüntülenme ve müşteri aksiyonları"
          >
            <button
              type="button"
              className="dots-button"
              disabled
              title="Sonraki prototip aşamasında"
              aria-label="Hareket seçenekleri"
            >
              ···
            </button>
          </PanelHeader>
          <div className="timeline">
            {activities.map(
              (activity) =>
                activity && (
                  <div className={activity.className} key={activity.title}>
                    <span className="timeline-marker" aria-hidden="true">
                      {activity.marker}
                    </span>
                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.text}</p>
                      <small>{activity.date}</small>
                    </div>
                  </div>
                ),
            )}
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
            <SelectField
              className="field--compact"
              label="Senaryo"
              options={followUpScenarios}
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
            />
            <SelectField
              className="field--compact"
              label="Ton"
              options={followUpTones}
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            />
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
            {decision
              ? "Terminal karardan sonra kapalı"
              : generating
                ? "Mesaj hazırlanıyor…"
                : "Takip mesajı oluştur"}
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
  embedded = false,
}: {
  draft: DraftSnapshot;
  profile: ProfileSnapshot;
  preview: boolean;
  decision: Decision;
  linkRevoked: boolean;
  onBack: () => void;
  onDecision: (value: Exclude<Decision, null>) => void;
  onMessage: (value: string) => void;
  embedded?: boolean;
}) {
  const [confirm, setConfirm] = useState<Decision>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState(
    "Teslim planındaki geliştirme desteğini ayrıca konuşabilir miyiz?",
  );
  const ProposalContent = embedded ? "div" : "main";

  if (linkRevoked) {
    return (
      <ProposalContent className="public-error">
        <BrandMark />
        <div className="public-error-card">
          <span aria-hidden="true">×</span>
          <h1>Bu teklif artık erişilebilir değil.</h1>
          <p>
            Bağlantı iptal edilmiş veya geçerlilik süresi dolmuş olabilir. Detay için teklifi
            gönderen kişiyle iletişime geçebilirsin.
          </p>
          <button type="button" className="button button--soft" onClick={onBack}>
            Demo paneline dön
          </button>
        </div>
        <small>Güvenli teklif bağlantısı · İçerik paylaşılmadı</small>
      </ProposalContent>
    );
  }

  return (
    <div className="public-page">
      {preview ? (
        <div className="owner-preview-bar">
          <span>
            <strong>Sahip önizlemesi</strong> Bu görüntülenme sayılmaz ve müşteriye özel aksiyonları
            kaydetmez.
          </span>
          <button type="button" className="button button--light" onClick={onBack}>
            Editöre dön
          </button>
        </div>
      ) : (
        <div className="public-security-bar">
          <span className="security-note">
            <span aria-hidden="true">◇</span> Bu sayfa güvenli bir teklif bağlantısıyla paylaşıldı.
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

      <ProposalContent className="proposal-document">
        <section className="document-hero">
          <div className="document-meta-top">
            <span>TEKLİF NO · TKL-1048</span>
            <span>17 TEMMUZ 2026</span>
          </div>
          <span className="document-kicker">{draft.company} için hazırlandı</span>
          <h1>{draft.projectName}</h1>
          <p>{draft.summary}</p>
          <div className="document-facts">
            {[
              ["PROJE SÜRESİ", draft.duration],
              ["BAŞLANGIÇ", formatDate(draft.startDate)],
              ["TEKLİF GEÇERLİLİĞİ", formatDate(draft.validUntil)],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
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
              {[
                ["ÖDEME PLANI", "Planlı ödeme", draft.paymentPlan],
                [
                  "REVİZYON",
                  `${draft.revision} tur`,
                  "Her ana tasarım teslimi için toplu revizyon turu dahildir.",
                ],
                ["EK KOŞULLAR", "Takvim varsayımı", draft.additionalTerms],
              ].map(([label, title, text]) => (
                <article key={label}>
                  <small>{label}</small>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="document-end">
          <span className="document-label">SONRAKİ ADIM</span>
          <h2>Birlikte çalışmaya hazır mısınız?</h2>
          <p>
            Teklifi kabul edebilir, reddedebilir veya aklınızdaki soruyu Deniz’e iletebilirsiniz.
          </p>
          {decision ? (
            <div
              className={cx(
                "decision-result",
                decision === "rejected" && "decision-result--rejected",
              )}
            >
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
            Bağlantı üzerinden verilen yanıt, elektronik imza veya hukuki kimlik doğrulaması
            değildir.
          </small>
        </section>
      </ProposalContent>

      <footer className="public-footer" id="privacy">
        <div>
          <BrandMark />
          <span>Profesyonel teklif deneyimi</span>
        </div>
        <p>
          Görüntülenme bilgileri yaklaşık olabilir.{" "}
          <a href="#privacy">Gizlilik ve takip bildirimi</a>
        </p>
        <small>Bu belge fatura yerine geçmez.</small>
      </footer>

      {confirm ? (
        <Modal
          title={
            confirm === "accepted" ? "Teklifi kabul ediyor musunuz?" : "Teklifi reddediyor musunuz?"
          }
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
          <TextField
            className="modal-field"
            label="Mesajınız"
            rows={5}
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            hint={`${message.length} / 500 karakter`}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function DemoTour({
  screen,
  onSelect,
  embedded = false,
}: {
  screen: Screen;
  onSelect: (screen: Screen) => void;
  embedded?: boolean;
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
        {embedded ? null : <Link href="/">Landing’e dön</Link>}
        {embedded ? (
          <a className="demo-tour__cta" href="#waitlist">
            Alpha sürümüne katıl
          </a>
        ) : (
          <Link className="demo-tour__cta" href="/#waitlist">
            Alpha sürümüne katıl
          </Link>
        )}
      </div>
    </header>
  );
}

export function PrototypeApp({
  mode = "alpha",
  layout = "page",
}: {
  mode?: "alpha" | "demo";
  layout?: PrototypeLayout;
}) {
  const isDemo = mode === "demo";
  const isEmbedded = isDemo && layout === "embedded";
  const [screen, setScreen] = useState<Screen>(() => (isDemo ? "dashboard" : "onboarding"));
  const [profile, setProfile] = useState<ProfileSnapshot>(defaultProfile);
  const [draftSnapshot, setDraftSnapshot] = useState(() => cloneDraft(defaultDraftSnapshot));
  const [toast, setToast] = useState("");
  const [publicPreview, setPublicPreview] = useState(false);
  const [decision, setDecision] = useState<Decision>(null);
  const [views, setViews] = useState(3);
  const [linkRevoked, setLinkRevoked] = useState(false);
  const [customerMessage, setCustomerMessage] = useState("");
  const [revokeModal, setRevokeModal] = useState(false);
  const [publicCounted, setPublicCounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const toastTimerRef = useTimeoutRef();
  const embeddedRootRef = useRef<HTMLDivElement>(null);
  const embeddedContentRef = useRef<HTMLDivElement>(null);

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
          const parsed = readStoredPrototypeState(saved);
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

  const resetViewport = () => {
    if (!isEmbedded) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    embeddedContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.requestAnimationFrame(() => {
      embeddedContentRef.current?.focus({ preventScroll: true });
    });
  };

  const navigate = (next: Screen) => {
    if (!isEmbedded && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setPublicPreview(false);
    setScreen(isDemo && next === "onboarding" ? "dashboard" : next);
    resetViewport();
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
    resetViewport();
  };

  const startNewDraft = (currencyOverride?: Currency) => {
    const currency = typeof currencyOverride === "string" ? currencyOverride : profile.currency;
    setDraftSnapshot({ ...cloneDraft(defaultDraftSnapshot), currency });
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

  const withDemoTour = (content: ReactNode, overlay?: ReactNode) => {
    const body = (
      <>
        {content}
        <Toast message={toast} />
        {overlay}
      </>
    );
    if (!isDemo) return body;
    return (
      <div
        ref={embeddedRootRef}
        className={cx("demo-experience", isEmbedded && "demo-experience--embedded")}
      >
        <DemoTour screen={screen} onSelect={selectDemoStep} embedded={isEmbedded} />
        <div
          ref={embeddedContentRef}
          className="demo-experience__content"
          role={isEmbedded ? "region" : undefined}
          aria-label={isEmbedded ? "Etkileşimli demo içeriği" : undefined}
          tabIndex={isEmbedded ? -1 : undefined}
        >
          {body}
        </div>
      </div>
    );
  };

  const publicProposal = screen === "public" && (
    <PublicProposal
      draft={draftSnapshot}
      profile={profile}
      preview={publicPreview}
      decision={decision}
      linkRevoked={linkRevoked}
      onBack={() => navigate(publicPreview ? "editor" : "detail")}
      onDecision={(value) => {
        if (publicPreview) return;
        setDecision(value);
        notify(value === "accepted" ? "Müşteri teklifi kabul etti." : "Müşteri teklifi reddetti.");
      }}
      onMessage={(value) => {
        if (publicPreview) return;
        setCustomerMessage(value);
        notify("Mesaj güvenli biçimde kaydedildi.");
      }}
      embedded={isEmbedded}
    />
  );

  if (screen === "onboarding") {
    return withDemoTour(
      <Onboarding
        initialProfile={profile}
        onSkip={() => navigate("dashboard")}
        embedded={isEmbedded}
        onComplete={(nextProfile) => {
          setProfile(nextProfile);
          startNewDraft(nextProfile.currency);
          notify("Profilin hazır. İlk teklifini oluşturmaya başlayabilirsin.");
        }}
      />,
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
            embedded={isEmbedded}
          />
        </div>
        {screen === "public" ? publicProposal : null}
      </>,
    );
  }

  if (screen === "public") {
    return withDemoTour(publicProposal);
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
    <AppShell
      screen={screen}
      profile={profile}
      title={title}
      eyebrow={eyebrow}
      onNavigate={navigate}
      onRestart={() => navigate(isDemo ? "dashboard" : "onboarding")}
      onCreate={startNewDraft}
      demoMode={isDemo}
      embedded={isEmbedded}
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
            notify(
              "Teklif yeni bir taslak olarak çoğaltıldı. Görüntülenme ve yanıtlar kopyalanmadı.",
            );
          }}
          notify={notify}
        />
      )}
    </AppShell>,
    revokeModal ? (
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
    ) : null,
  );
}
