import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Bot,
  ShoppingBag,
  Phone,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  TrendingUp,
  Users,
  Gauge,
  MapPin,
  X,
  Zap,
  ChefHat,
  CalendarCheck,
  AlertTriangle,
  IndianRupee,
  Wand2,
  PartyPopper,
  Scissors,
  Briefcase,
  Croissant,
  Send,
  UserRound,
  Percent,
  BadgeCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Category = "Order" | "Booking" | "Escalation";
type FilterKey = "all" | "orders" | "bookings" | "escalations";
type BusinessType = "Cafe" | "Bakery" | "Salon" | "CA Firm";
type OrderStatus = "pending" | "preparing" | "completed";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface StreamCard {
  id: string;
  customerName: string;
  phone: string;
  category: Category;
  business: BusinessType;
  summary: string;
  amount: number;
  confidence: number;
  status: OrderStatus;
  unread: number;
  ago: string;
  items: OrderItem[];
  address: string;
  mapQuery: string;
  rawPayload: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Dummy Data — Cafe, Bakery, Salon, CA Firm                           */
/* ------------------------------------------------------------------ */

const STREAM: StreamCard[] = [
  {
    id: "wa-8821",
    customerName: "Ananya Sharma",
    phone: "+91 98213",
    category: "Order",
    business: "Cafe",
    summary: "2× Cappuccino, 1× Truffle Pasta",
    amount: 640,
    confidence: 0.97,
    status: "pending",
    unread: 3,
    ago: "just now",
    items: [
      { name: "Cappuccino (Large)", qty: 2, price: 220 },
      { name: "Truffle Mushroom Pasta", qty: 1, price: 200 },
    ],
    address: "Flat 12B, Sea Breeze Apartments, Bandra West, Mumbai 400050",
    mapQuery: "Bandra West Mumbai 400050",
    rawPayload: {
      intent: "place_order",
      entities: {
        items: [
          { product: "cappuccino_large", qty: 2, unit_price: 220 },
          { product: "truffle_pasta", qty: 1, unit_price: 200 },
        ],
        delivery_window: "45min",
        payment_preference: "upi",
      },
      language_detected: "hinglish",
      model: "agento-extract-v3",
      tokens: 412,
    },
  },
  {
    id: "wa-8822",
    customerName: "Rohan Mehta",
    phone: "+91 99870",
    category: "Order",
    business: "Bakery",
    summary: "1× Red Velvet Cake (500g), 4× Croissants",
    amount: 1180,
    confidence: 0.94,
    status: "preparing",
    unread: 1,
    ago: "4 min ago",
    items: [
      { name: "Red Velvet Cake (500g)", qty: 1, price: 850 },
      { name: "Butter Croissant", qty: 4, price: 330 },
    ],
    address: "Shop 4, Sunrise Enclave, Koramangala 5th Block, Bengaluru 560095",
    mapQuery: "Koramangala 5th Block Bengaluru",
    rawPayload: {
      intent: "place_order",
      entities: {
        items: [
          { product: "red_velvet_cake_500g", qty: 1, unit_price: 850 },
          { product: "croissant_butter", qty: 4, unit_price: 330 },
        ],
        occasion: "birthday",
        message_on_cake: "Happy Birthday Kavya!",
      },
      language_detected: "english",
      model: "agento-extract-v3",
      tokens: 388,
    },
  },
  {
    id: "wa-8823",
    customerName: "Priya Nair",
    phone: "+91 90045",
    category: "Booking",
    business: "Salon",
    summary: "Hair Spa + Global Colour, Sat 11:00 AM",
    amount: 3200,
    confidence: 0.92,
    status: "pending",
    unread: 2,
    ago: "9 min ago",
    items: [
      { name: "L'Oréal Hair Spa", qty: 1, price: 1200 },
      { name: "Global Hair Colour", qty: 1, price: 2000 },
    ],
    address: "Villa 22, Palm Grove, Powai, Mumbai 400076",
    mapQuery: "Powai Mumbai 400076",
    rawPayload: {
      intent: "book_appointment",
      entities: {
        services: ["hair_spa", "global_colour"],
        slot: "2026-08-29T11:00:00+05:30",
        stylist_preference: "senior_female",
      },
      language_detected: "english",
      model: "agento-extract-v3",
      tokens: 445,
    },
  },
  {
    id: "wa-8824",
    customerName: "Vikram Deshpande",
    phone: "+91 98200",
    category: "Booking",
    business: "CA Firm",
    summary: "ITR Filing (Salaried) consult, Mon 4:30 PM",
    amount: 2500,
    confidence: 0.96,
    status: "pending",
    unread: 0,
    ago: "14 min ago",
    items: [
      { name: "ITR Filing — Salaried Individual", qty: 1, price: 2500 },
    ],
    address: "Video Consultation (Zoom link auto-sent)",
    mapQuery: "remote",
    rawPayload: {
      intent: "book_appointment",
      entities: {
        service: "itr_filing_salaried",
        slot: "2026-08-31T16:30:00+05:30",
        mode: "video",
        documents_pending: ["form16", "bank_statement"],
      },
      language_detected: "english",
      model: "agento-extract-v3",
      tokens: 356,
    },
  },
  {
    id: "wa-8825",
    customerName: "Sana Khan",
    phone: "+91 91378",
    category: "Escalation",
    business: "Cafe",
    summary: "Refund request — cold delivery, order #4417",
    amount: 480,
    confidence: 0.71,
    status: "pending",
    unread: 5,
    ago: "17 min ago",
    items: [{ name: "Refund — Order #4417", qty: 1, price: 480 }],
    address: "Customer declined address share",
    mapQuery: "unavailable",
    rawPayload: {
      intent: "complaint_refund",
      entities: {
        order_ref: "#4417",
        reason: "food_cold_on_delivery",
        sentiment: "negative",
        amount_claimed: 480,
      },
      escalation_reason: "sentiment < -0.6",
      language_detected: "hinglish",
      model: "agento-extract-v3",
      tokens: 521,
    },
  },
  {
    id: "wa-8826",
    customerName: "Aditya Rao",
    phone: "+91 96190",
    category: "Order",
    business: "Bakery",
    summary: "2× Sourdough Loaf, 1× Chicken Puff (6-pack)",
    amount: 760,
    confidence: 0.95,
    status: "completed",
    unread: 0,
    ago: "31 min ago",
    items: [
      { name: "Sourdough Loaf", qty: 2, price: 440 },
      { name: "Chicken Puff (6-pack)", qty: 1, price: 320 },
    ],
    address: "B-702, Orchid Towers, HSR Layout Sector 2, Bengaluru 560102",
    mapQuery: "HSR Layout Sector 2 Bengaluru",
    rawPayload: {
      intent: "place_order",
      entities: {
        items: [
          { product: "sourdough_loaf", qty: 2, unit_price: 220 },
          { product: "chicken_puff_6", qty: 1, unit_price: 320 },
        ],
        payment: "paid_upi",
      },
      language_detected: "english",
      model: "agento-extract-v3",
      tokens: 364,
    },
  },
];

const AVAILABILITY = ["Online", "Busy", "Away"] as const;

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const CATEGORY_STYLES: Record<
  Category,
  { pill: string; icon: React.ReactNode }
> = {
  Order: {
    pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: <ShoppingBag className="h-3 w-3" />,
  },
  Booking: {
    pill: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    icon: <CalendarCheck className="h-3 w-3" />,
  },
  Escalation: {
    pill: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const BUSINESS_ICON: Record<BusinessType, React.ReactNode> = {
  Cafe: <ChefHat className="h-3.5 w-3.5" />,
  Bakery: <Croissant className="h-3.5 w-3.5" />,
  Salon: <Scissors className="h-3.5 w-3.5" />,
  "CA Firm": <Briefcase className="h-3.5 w-3.5" />,
};

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 90
      ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/10"
      : pct >= 80
        ? "text-indigo-300 border-indigo-400/40 bg-indigo-500/10"
        : "text-amber-300 border-amber-400/40 bg-amber-500/10";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${tone}`}
      title="AI extraction confidence"
    >
      <Sparkles className="h-3 w-3" />
      {pct}%
    </span>
  );
}

function StatusDot({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    pending: "bg-amber-400",
    preparing: "bg-indigo-400 animate-pulse",
    completed: "bg-emerald-400",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${map[status]} opacity-60 animate-ping`}
      />
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${map[status]}`}
      />
    </span>
  );
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "bookings", label: "Bookings" },
  { key: "escalations", label: "Escalations" },
];

/* ------------------------------------------------------------------ */
/* Hero metric cards                                                   */
/* ------------------------------------------------------------------ */

function MetricCard({
  icon,
  title,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40 ${accent}`}
      />
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <span className={`rounded-lg p-1.5 ${accent} text-white`}>
            {icon}
          </span>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slide-over drawer                                                   */
/* ------------------------------------------------------------------ */

function OrderDrawer({
  card,
  onClose,
  onAction,
}: {
  card: StreamCard;
  onClose: () => void;
  onAction: (id: string, action: string) => void;
}) {
  const subtotal = card.items.reduce((s, i) => s + i.price, 0);
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    card.mapQuery,
  )}&z=14&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-800/80 bg-slate-900/95 shadow-2xl backdrop-blur-2xl duration-300 animate-in slide-in-from-right">
        {/* Drawer header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 p-5 backdrop-blur-2xl">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {card.customerName}
              </h3>
              {card.unread > 0 && (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {card.unread} new
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Phone className="h-3 w-3" /> {card.phone} ·{" "}
              <span className="inline-flex items-center gap-1">
                {BUSINESS_ICON[card.business]}
                {card.business}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* AI extraction */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Wand2 className="h-3.5 w-3.5" /> AI Extraction
            </h4>
            <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[card.category].pill}`}
                >
                  {CATEGORY_STYLES[card.category].icon}
                  {card.category}
                </span>
                <ConfidenceRing value={card.confidence} />
              </div>
              <p className="mt-3 text-sm text-slate-200">{card.summary}</p>
            </div>
          </section>

          {/* Items breakdown */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ShoppingBag className="h-3.5 w-3.5" /> Items
            </h4>
            <ul className="divide-y divide-slate-800/80 rounded-xl border border-slate-800/80 bg-slate-950/40">
              {card.items.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-slate-300">
                    <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-semibold text-slate-300 tabular-nums">
                      {item.qty}×
                    </span>
                    {item.name}
                  </span>
                  <span className="font-medium text-white tabular-nums">
                    {inr(item.price)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between bg-slate-900/60 px-4 py-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">
                  Total
                </span>
                <span className="flex items-center text-base font-bold text-emerald-300">
                  <IndianRupee className="h-4 w-4" />
                  {subtotal.toLocaleString("en-IN")}
                </span>
              </li>
            </ul>
          </section>

          {/* Address / map */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> Delivery Address
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-800/80">
              <div className="h-36 w-full bg-slate-950">
                <iframe
                  title={`Map — ${card.customerName}`}
                  src={mapSrc}
                  className="h-full w-full opacity-90 grayscale-[0.3]"
                  loading="lazy"
                />
              </div>
              <p className="flex items-start gap-2 border-t border-slate-800/80 bg-slate-950/40 px-4 py-3 text-xs leading-relaxed text-slate-300">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {card.address}
              </p>
            </div>
          </section>

          {/* Raw payload */}
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Bot className="h-3.5 w-3.5" /> Raw AI Payload
            </h4>
            <pre className="max-h-56 overflow-auto rounded-xl border border-violet-500/20 bg-slate-950/80 p-4 text-[11px] leading-relaxed text-violet-200/90">
              {JSON.stringify(card.rawPayload, null, 2)}
            </pre>
          </section>
        </div>

        {/* Sticky actions */}
        <div className="sticky bottom-0 mt-auto grid grid-cols-3 gap-2 border-t border-slate-800/80 bg-slate-900/90 p-4 backdrop-blur-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => onAction(card.id, "approve")}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" /> Approve
          </button>
          <button
            onClick={() => onAction(card.id, "upi")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            <CreditCard className="h-4 w-4" /> UPI Link
          </button>
          <button
            onClick={() => onAction(card.id, "takeover")}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            <UserRound className="h-4 w-4" /> Takeover
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function LiveWhatsAppCommandCenter() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return STREAM;
    if (filter === "orders") return STREAM.filter((c) => c.category === "Order");
    if (filter === "bookings")
      return STREAM.filter((c) => c.category === "Booking");
    return STREAM.filter((c) => c.category === "Escalation");
  }, [filter]);

  const activeCard = STREAM.find((c) => c.id === activeId) ?? null;
  const unreadTotal = STREAM.reduce((s, c) => s + c.unread, 0);
  const completed = STREAM.filter((c) => c.status === "completed").length;
  const preparing = STREAM.filter((c) => c.status === "preparing").length;

  const fireAction = (id: string, action: string) => {
    const card = STREAM.find((c) => c.id === id);
    const label =
      action === "approve"
        ? `Order approved for ${card?.customerName}`
        : action === "upi"
          ? `UPI link sent to ${card?.phone}`
          : `You took over ${card?.customerName}'s chat`;
    setToast(label);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.07),transparent_55%)] px-4 py-6 pb-28 text-slate-100 sm:px-6 lg:px-10 lg:pb-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ---------------------------------------------------- Header */}
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Live WhatsApp Command Center
              </h1>
              <p className="text-xs text-slate-400">
                Agento AI · Multi-business inbox
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              Live · AI Handling
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <strong className="text-white tabular-nums">
                {STREAM.length + 47}
              </strong>{" "}
              active sessions
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300">
              <Gauge className="h-3.5 w-3.5 text-violet-400" />
              <span className="tabular-nums text-emerald-300">242ms</span>
              token latency
            </span>
          </div>
        </header>

        {/* ------------------------------------------------ Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filter === f.key
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              {f.label}
              {f.key === "escalations" && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                  {STREAM.filter((c) => c.category === "Escalation").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------------------------------------------- Metric cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="WhatsApp Revenue"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="bg-emerald-500"
          >
            <div className="flex items-end justify-between">
              <p className="flex items-center text-3xl font-bold tracking-tight text-white">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
                2,84,560
              </p>
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> +18.4%
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              vs. last week · today 6:00 AM onward
            </p>
          </MetricCard>

          <MetricCard
            title="AI Orders Captured"
            icon={<ShoppingBag className="h-4 w-4" />}
            accent="bg-indigo-500"
          >
            <p className="text-3xl font-bold tracking-tight text-white tabular-nums">
              {STREAM.length + 128}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {completed + 121} completed
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-300">
                <Clock className="h-3 w-3" /> {preparing + 9} preparing
              </span>
            </div>
          </MetricCard>

          <MetricCard
            title="Active Conversations"
            icon={<MessageCircle className="h-4 w-4" />}
            accent="bg-violet-500"
          >
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold tracking-tight text-white tabular-nums">
                {STREAM.length + 12}
              </p>
              <div className="flex -space-x-2">
                {["A", "R", "P", "V", "S"].map((ch, i) => (
                  <span
                    key={ch}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-white ${
                      [
                        "bg-emerald-500",
                        "bg-indigo-500",
                        "bg-violet-500",
                        "bg-amber-500",
                        "bg-sky-500",
                      ][i]
                    }`}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              {unreadTotal} unread messages
            </p>
          </MetricCard>

          <MetricCard
            title="AI Accuracy & Sentiment"
            icon={<Sparkles className="h-4 w-4" />}
            accent="bg-amber-500"
          >
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold tracking-tight text-white tabular-nums">
                97.4%
              </p>
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                <PartyPopper className="h-3 w-3" /> 99.2% positive
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[97.4%] rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300" />
            </div>
          </MetricCard>
        </section>

        {/* -------------------------------------------- Live stream */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => (
            <article
              key={card.id}
              onClick={() => setActiveId(card.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 ${
                card.category === "Escalation"
                  ? "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] to-slate-900/80 hover:border-amber-500/50"
                  : "border-slate-800/80 bg-slate-900/80 hover:border-emerald-500/40"
              }`}
            >
              {card.unread > 0 && (
                <span className="absolute right-4 top-4 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/40">
                  {card.unread}
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-white">
                    {card.customerName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-slate-900 bg-emerald-500 p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {card.customerName}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" /> {card.phone} ·{" "}
                    <span className="inline-flex items-center gap-1">
                      {BUSINESS_ICON[card.business]}
                      {card.business}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_STYLES[card.category].pill}`}
                >
                  {CATEGORY_STYLES[card.category].icon}
                  {card.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-950/60 px-2.5 py-0.5 text-[11px] text-slate-300">
                  <StatusDot status={card.status} />
                  {card.ago}
                </span>
                <ConfidenceRing value={card.confidence} />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                <p className="truncate text-xs text-slate-300">
                  {card.summary}
                </p>
                <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300 tabular-nums">
                  {inr(card.amount)}
                </span>
              </div>

              {/* Actions — full on desktop, icon-compact on mobile */}
              <div
                className="mt-4 grid grid-cols-3 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => fireAction(card.id, "approve")}
                  className="flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-2 text-[11px] font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Approve</span>
                </button>
                <button
                  onClick={() => fireAction(card.id, "upi")}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-2 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">UPI Link</span>
                </button>
                <button
                  onClick={() => fireAction(card.id, "takeover")}
                  className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-2 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Takeover</span>
                </button>
              </div>
            </article>
          ))}
        </section>

        <footer className="flex items-center justify-center gap-2 pb-2 text-[11px] text-slate-600">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
          Agento AI · End-to-end encrypted WhatsApp Business API sessions
        </footer>
      </div>

      {/* ------------------------------------------------ Mobile dock */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-slate-900/90 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl backdrop-blur-2xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-[10px] font-medium text-slate-400">
          {[
            { icon: <MessageCircle className="h-5 w-5" />, label: "Stream", on: true },
            { icon: <ShoppingBag className="h-5 w-5" />, label: "Orders" },
            { icon: <CalendarCheck className="h-5 w-5" />, label: "Bookings" },
            { icon: <Percent className="h-5 w-5" />, label: "Insights" },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex flex-col items-center gap-1 rounded-lg py-1.5 ${
                tab.on ? "text-emerald-400" : "hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ---------------------------------------------------- Drawer */}
      {activeCard && (
        <OrderDrawer
          card={activeCard}
          onClose={() => setActiveId(null)}
          onAction={fireAction}
        />
      )}

      {/* ----------------------------------------------------- Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900/95 px-4 py-2.5 text-sm font-medium text-emerald-300 shadow-2xl backdrop-blur-2xl">
            <Zap className="h-4 w-4" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
