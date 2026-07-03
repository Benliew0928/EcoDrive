"use client";

import { useEffect, useMemo, useState } from "react";
import { CockpitShell } from "../../components/cockpit-shell";

/* ─── EcoCoin SVG icon (unchanged) ─── */
const EcoCoin = ({ size = 16, className = "", style = {} }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <span className={`eco-coin-icon ${className}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="11" fill="url(#coinOuterGrad)" stroke="#EAB308" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="8.5" fill="url(#coinInnerGrad)" stroke="#CA8A04" strokeWidth="0.5" />
      <g transform="translate(4.5, 4.5) scale(0.62)">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z" fill="url(#coinLeafGrad)" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22v-4h-4" stroke="#9A3412" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <linearGradient id="coinOuterGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
        <linearGradient id="coinInnerGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAB308" />
          <stop offset="50%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>
        <linearGradient id="coinLeafGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
    </svg>
  </span>
);

/* ─── Types (unchanged) ─── */
type RewardCategory = "Food & Drinks" | "EV Benefits" | "Shopping" | "Eco Impact";
type WalletTab = "Active" | "Used" | "Expired";
type MainView = "home" | "category" | "wallet";

type Reward = {
  id: string;
  title: string;
  partner: string;
  description: string;
  cost: number;
  stock: number;
  badge: "Popular" | "Best Value" | "Limited" | "New";
  category: RewardCategory;
  image: string;
  expiry: string;
  expiryUrgent?: boolean;
};

type RedeemedEntry = {
  id: string;
  reward: Reward;
  redeemedAt: Date;
  expiresAt: Date;
  status: "Active" | "Used" | "Expired";
};

/* ─── Category metadata ─── */
const categoryMeta: Record<RewardCategory, { emoji: string; desc: string; image: string; color: string }> = {
  "EV Benefits":   { emoji: "⚡", desc: "Charging credits, parking & vehicle care", image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=80", color: "rgba(56,189,248,0.18)" },
  "Food & Drinks": { emoji: "☕", desc: "Coffee, bubble tea, meals & treats",       image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", color: "rgba(251,146,60,0.18)"  },
  "Shopping":      { emoji: "🛍", desc: "Eco merchandise, gadgets & lifestyle",     image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", color: "rgba(167,139,250,0.18)" },
  "Eco Impact":    { emoji: "🌱", desc: "Plant trees, offset carbon & give back",   image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80", color: "rgba(55,229,143,0.18)"  },
};
const categoryOrder: RewardCategory[] = ["EV Benefits", "Food & Drinks", "Shopping", "Eco Impact"];

/* ─── Reward data (unchanged) ─── */
const rewards: Reward[] = [
  { id: "premium-coffee",   title: "Premium Coffee",          partner: "The Daily Grind",     description: "Enjoy one handcrafted hot or iced premium coffee.",                        cost: 500,  stock: 18, badge: "Popular",    category: "Food & Drinks", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 5 days",          expiryUrgent: true },
  { id: "bubble-tea",       title: "Bubble Tea Voucher",      partner: "Boba Avenue",         description: "Redeem any regular-sized signature milk tea or fruit tea.",               cost: 650,  stock: 24, badge: "New",         category: "Food & Drinks", image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "healthy-lunch",    title: "Healthy Lunch Voucher",   partner: "Green Bowl Kitchen",  description: "A balanced plant-forward lunch bowl with a refreshing drink.",             cost: 950,  stock: 12, badge: "Best Value",  category: "Food & Drinks", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 14 days" },
  { id: "ice-cream",        title: "Ice Cream Voucher",       partner: "Scoop Society",       description: "Choose two scoops from a rotating menu of artisan flavours.",             cost: 600,  stock: 8,  badge: "Limited",     category: "Food & Drinks", image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 7 days",          expiryUrgent: true },
  { id: "charging-credit",  title: "EV Charging Credit",      partner: "GreenCharge Bay",     description: "Apply RM20 charging credit at participating fast chargers.",              cost: 900,  stock: 20, badge: "Best Value",  category: "EV Benefits",   image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "ev-parking",       title: "Reserved EV Parking",     partner: "Campus Mobility",     description: "Reserve a preferred EV parking bay for one full day.",                   cost: 1200, stock: 6,  badge: "Popular",    category: "EV Benefits",   image: "https://images.unsplash.com/photo-1597404294360-feeeda04612e?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 3 days",          expiryUrgent: true },
  { id: "eco-car-wash",     title: "Eco Car Wash",            partner: "AquaLess Auto Care",  description: "A complete water-saving exterior wash for your vehicle.",                 cost: 1450, stock: 10, badge: "New",         category: "EV Benefits",   image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 21 days" },
  { id: "battery-check",    title: "Battery Health Check",    partner: "VoltCare Service",    description: "Professional EV battery diagnostics with a digital report.",             cost: 1800, stock: 7,  badge: "Limited",     category: "EV Benefits",   image: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 30 Nov 2026" },
  { id: "tshirt",           title: "EcoDrive T-Shirt",        partner: "EcoDrive Official",   description: "A premium organic-cotton tee in the EcoDrive signature green.",          cost: 3500, stock: 14, badge: "Popular",    category: "Shopping",      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "tote-bag",         title: "Eco Tote Bag",            partner: "EarthKind Goods",     description: "A durable everyday tote made from recycled cotton canvas.",               cost: 1600, stock: 22, badge: "New",         category: "Shopping",      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 30 days" },
  { id: "steel-bottle",     title: "Stainless Steel Bottle",  partner: "Refill Malaysia",     description: "A double-wall insulated bottle that keeps drinks cold all day.",          cost: 2200, stock: 11, badge: "Best Value",  category: "Shopping",      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "wireless-charger", title: "Wireless Phone Charger",  partner: "LoopTech",            description: "A compact fast-charging pad made with recycled materials.",               cost: 4200, stock: 5,  badge: "Limited",     category: "Shopping",      image: "https://images.unsplash.com/photo-1622037022824-0c71d511ef3c?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 6 days",          expiryUrgent: true },
  { id: "plant-tree",       title: "Plant a Tree",            partner: "Reforest Malaysia",   description: "Fund one native tree and receive a digital planting update.",             cost: 800,  stock: 50, badge: "Popular",    category: "Eco Impact",    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "carbon-certificate",title:"Carbon Offset Certificate",partner:"Climate Action MY",   description: "Offset 25 kg of verified emissions with a named certificate.",           cost: 1300, stock: 35, badge: "Best Value",  category: "Eco Impact",    image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 18 days" },
  { id: "green-donation",   title: "Green Donation",          partner: "Eco Community Fund",  description: "Support local recycling and environmental education projects.",           cost: 1000, stock: 40, badge: "New",         category: "Eco Impact",    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=85", expiry: "Valid until 31 Dec 2026" },
  { id: "recycled-notebook",title: "Recycled Notebook",       partner: "PaperAgain Studio",   description: "A premium ruled notebook crafted from 100% recycled paper.",             cost: 750,  stock: 9,  badge: "Limited",     category: "Eco Impact",    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85", expiry: "Expires in 4 days",          expiryUrgent: true },
];

const CARDS_PER_PAGE = 4;

/* ─── QR helper (unchanged) ─── */
function makeQrCells(reward: Reward) {
  const seed = reward.id.length + reward.cost;
  return Array.from({ length: 81 }, (_, i) => i % 10 === 0 || (i + seed) % 4 === 0 || (i * seed) % 17 === 0);
}

/* ─── Badge helper (unchanged) ─── */
function badgeClass(badge: Reward["badge"]) {
  if (badge === "Best Value") return "rd-badge rd-badge--value";
  if (badge === "Limited")    return "rd-badge rd-badge--limited";
  if (badge === "New")        return "rd-badge rd-badge--new";
  return "rd-badge";
}

/* ─── Date formatter (unchanged) ─── */
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/* ════════════════════════════════════════════════════════════
   Main page component
════════════════════════════════════════════════════════════ */
export default function RewardsPage() {
  /* ── Balance & redemption state (unchanged logic) ── */
  const [yieldCoins, setYieldCoins]         = useState(12500);
  const [selectedReward, setSelectedReward] = useState(rewards[0]);
  const [redeemedReward, setRedeemedReward] = useState<Reward | null>(null);
  const [redemptionHistory, setRedemptionHistory] = useState<RedeemedEntry[]>([]);
  const [successRedemption, setSuccessRedemption] = useState<{
    reward: Reward; coinsSpent: number; remaining: number; redeemedAt: Date;
  } | null>(null);

  /* ── Navigation state ── */
  const [mainView, setMainView]           = useState<MainView>("home");
  const [activeCategory, setActiveCategory] = useState<RewardCategory>("EV Benefits");
  const [categoryPage, setCategoryPage]   = useState(0);
  const [walletTab, setWalletTab]         = useState<WalletTab>("Active");
  const [detailReward, setDetailReward]   = useState<Reward | null>(null);

  /* ── Build redemption history (unchanged) ── */
  useEffect(() => {
    if (!redeemedReward) return;
    const redeemedAt = new Date();
    setRedemptionHistory(cur => [{
      id: `${redeemedReward.id}-${yieldCoins}-${redeemedAt.getTime()}`,
      reward: redeemedReward,
      redeemedAt,
      expiresAt: new Date(redeemedAt.getTime() + 30 * 86_400_000),
      status: "Active",
    }, ...cur]);
  }, [redeemedReward]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Redeem function (unchanged logic, no double deduct) ── */
  function redeemReward(reward: Reward) {
    if (yieldCoins < reward.cost) return;
    const remaining = yieldCoins - reward.cost;
    setYieldCoins(remaining);
    setSelectedReward(reward);
    setRedeemedReward(reward);
    setSuccessRedemption({ reward, coinsSpent: reward.cost, remaining, redeemedAt: new Date() });
  }

  /* ── Category view helpers ── */
  const categoryRewards = useMemo(
    () => rewards.filter(r => r.category === activeCategory),
    [activeCategory]
  );
  const totalPages    = Math.ceil(categoryRewards.length / CARDS_PER_PAGE);
  const pagedRewards  = categoryRewards.slice(categoryPage * CARDS_PER_PAGE, (categoryPage + 1) * CARDS_PER_PAGE);

  function openCategory(cat: RewardCategory) {
    setActiveCategory(cat);
    setCategoryPage(0);
    setMainView("category");
  }

  /* ── Wallet helpers ── */
  const walletEntries = useMemo(() => {
    const now = Date.now();
    return redemptionHistory.map(e => ({
      ...e,
      status: (now > e.expiresAt.getTime() ? "Expired" : e.status) as RedeemedEntry["status"],
    }));
  }, [redemptionHistory]);
  const walletFiltered = walletEntries.filter(e => e.status === walletTab);

  /* ── QR for detail modal ── */
  const qrCells = useMemo(() => makeQrCells(selectedReward), [selectedReward]);

  /* ── Progress bar: fictional next tier ── */
  const nextTier = 15000;
  const progress = Math.min(100, Math.round((yieldCoins / nextTier) * 100));

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <CockpitShell activeMode="rewards">
      <main className="cockpit-main cockpit-main--rewards rewards-page-shell">
        <section className="primary-panel rd-frame" aria-label="Rewards Marketplace">

          {/* ── Top bar ── */}
          <header className="rd-topbar">
            <div className="rd-topbar-left">
              {mainView !== "home" && (
                <button className="rd-back-btn" onClick={() => setMainView("home")} type="button" aria-label="Back to home">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back
                </button>
              )}
              <div>
                <p className="rd-eyebrow">EcoDrive+ Rewards</p>
                <h1 className="rd-title">
                  {mainView === "home"     ? "Good drives deserve great rewards." :
                   mainView === "wallet"   ? "My Wallet" :
                   categoryMeta[activeCategory].emoji + " " + activeCategory}
                </h1>
              </div>
            </div>

            {/* Tab strip */}
            <nav className="rd-tabs" aria-label="Main navigation">
              <button className={mainView === "home"   ? "rd-tab rd-tab--active" : "rd-tab"} onClick={() => setMainView("home")}   type="button">Marketplace</button>
              <button className={mainView === "wallet" ? "rd-tab rd-tab--active" : "rd-tab"} onClick={() => setMainView("wallet")} type="button">
                Wallet
                {walletEntries.filter(e => e.status === "Active").length > 0 && (
                  <span className="rd-tab-badge">{walletEntries.filter(e => e.status === "Active").length}</span>
                )}
              </button>
            </nav>
          </header>

          {/* ════════ HOME VIEW ════════ */}
          {mainView === "home" && (
            <div className="rd-home">
              {/* Balance card */}
              <div className="rd-balance-card" aria-label="EcoCoins balance">
                <div className="rd-balance-main">
                  <span className="rd-balance-label">Available EcoCoins</span>
                  <strong className="rd-balance-amount">
                    <EcoCoin size={36} style={{ marginRight: 10 }} />
                    {yieldCoins.toLocaleString()}
                  </strong>
                  <span className="rd-balance-earned">+120 earned this week</span>
                </div>
                <div className="rd-balance-meta">
                  <div className="rd-balance-expiry-pill" aria-label="Expiring coins">
                    <span className="rd-expiry-dot" aria-hidden="true">!</span>
                    <div>
                      <small>Expiring Soon</small>
                      <b><EcoCoin size={11} style={{ marginRight: 3 }} />320 coins in 5 days</b>
                    </div>
                  </div>
                  <div className="rd-tier-wrap">
                    <div className="rd-tier-row">
                      <span>Next tier</span>
                      <span>{yieldCoins.toLocaleString()} / {nextTier.toLocaleString()}</span>
                    </div>
                    <div className="rd-tier-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="rd-tier-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="rd-tier-label">Platinum at {nextTier.toLocaleString()} EcoCoins</span>
                  </div>
                </div>
              </div>

              {/* Category cards */}
              <div className="rd-section-label">Browse by Category</div>
              <div className="rd-cat-grid">
                {categoryOrder.map(cat => {
                  const meta  = categoryMeta[cat];
                  const count = rewards.filter(r => r.category === cat).length;
                  return (
                    <button
                      key={cat}
                      className="rd-cat-card"
                      onClick={() => openCategory(cat)}
                      type="button"
                      style={{ "--cat-color": meta.color } as React.CSSProperties}
                    >
                      <div className="rd-cat-img-wrap">
                        <img src={meta.image} alt={cat} loading="lazy" />
                        <div className="rd-cat-img-overlay" />
                      </div>
                      <div className="rd-cat-body">
                        <span className="rd-cat-emoji" aria-hidden="true">{meta.emoji}</span>
                        <h2 className="rd-cat-name">{cat}</h2>
                        <p className="rd-cat-desc">{meta.desc}</p>
                        <div className="rd-cat-footer">
                          <span className="rd-cat-count">{count} rewards</span>
                          <span className="rd-cat-cta">View Rewards →</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ CATEGORY VIEW ════════ */}
          {mainView === "category" && (
            <div className="rd-category-view">
              {/* Mini balance strip */}
              <div className="rd-mini-balance">
                <EcoCoin size={14} />
                <span>{yieldCoins.toLocaleString()} EcoCoins available</span>
              </div>

              {/* Reward grid — exactly 4 cards */}
              <div className="rd-reward-grid">
                {pagedRewards.map(reward => {
                  const canRedeem = yieldCoins >= reward.cost;
                  return (
                    <article key={reward.id} className="rd-reward-card">
                      <button
                        className="rd-reward-img-btn"
                        onClick={() => { setSelectedReward(reward); setDetailReward(reward); }}
                        type="button"
                        aria-label={`View ${reward.title} details`}
                      >
                        <img src={reward.image} alt={reward.title} loading="lazy" />
                        <span className="rd-reward-img-shade" aria-hidden="true" />
                        <span className={badgeClass(reward.badge)}>{reward.badge}</span>
                      </button>
                      <div className="rd-reward-body">
                        <div className="rd-reward-title-group">
                          <h3>{reward.title}</h3>
                          <span>{reward.partner}</span>
                        </div>
                        <p>{reward.description}</p>
                        <div className="rd-reward-price" aria-label={`${reward.cost.toLocaleString()} EcoCoins`}>
                          <EcoCoin size={16} />
                          <strong>{reward.cost.toLocaleString()}</strong>
                          <small>EcoCoins</small>
                        </div>
                        <div className="rd-reward-meta">
                          <span>{reward.stock} remaining</span>
                          <span className={reward.expiryUrgent ? "rd-expiry rd-expiry--urgent" : "rd-expiry"}>
                            {reward.expiryUrgent && <i aria-hidden="true">!</i>}{reward.expiry}
                          </span>
                        </div>
                        <button
                          className="rd-redeem-btn"
                          disabled={!canRedeem}
                          onClick={() => redeemReward(reward)}
                          type="button"
                        >
                          {canRedeem ? "Redeem now" : "Not enough EcoCoins"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Prev / Next navigation */}
              {totalPages > 1 && (
                <div className="rd-pagination" role="navigation" aria-label="Reward pages">
                  <button
                    className="rd-page-btn"
                    disabled={categoryPage === 0}
                    onClick={() => setCategoryPage(p => p - 1)}
                    type="button"
                    aria-label="Previous page"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Previous
                  </button>
                  <span className="rd-page-info">
                    {categoryPage + 1} of {totalPages}
                  </span>
                  <button
                    className="rd-page-btn"
                    disabled={categoryPage >= totalPages - 1}
                    onClick={() => setCategoryPage(p => p + 1)}
                    type="button"
                    aria-label="Next page"
                  >
                    Next
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════ WALLET VIEW ════════ */}
          {mainView === "wallet" && (
            <div className="rd-wallet-view">
              {/* Tab switcher */}
              <div className="rd-wallet-tabs" role="tablist">
                {(["Active", "Used", "Expired"] as WalletTab[]).map(tab => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={walletTab === tab}
                    className={walletTab === tab ? "rd-wallet-tab rd-wallet-tab--active" : "rd-wallet-tab"}
                    onClick={() => setWalletTab(tab)}
                    type="button"
                  >
                    {tab}
                    <span className="rd-wallet-tab-count">
                      {walletEntries.filter(e => e.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Voucher list */}
              {walletFiltered.length === 0 ? (
                <div className="rd-wallet-empty">
                  <span className="rd-wallet-empty-icon" aria-hidden="true">
                    {walletTab === "Active" ? "🎟" : walletTab === "Used" ? "✅" : "⌛"}
                  </span>
                  <strong>No {walletTab.toLowerCase()} vouchers</strong>
                  <span>
                    {walletTab === "Active"   ? "Redeem a reward to see your vouchers here." :
                     walletTab === "Used"     ? "Your used vouchers will appear here." :
                     "Expired vouchers will appear here."}
                  </span>
                </div>
              ) : (
                <div className="rd-voucher-list">
                  {walletFiltered.map(entry => {
                    const cells = makeQrCells(entry.reward);
                    const voucherId = `ECD-${entry.reward.id.toUpperCase().slice(0, 4)}-${entry.redeemedAt.getTime().toString().slice(-6)}`;
                    return (
                      <article key={entry.id} className="rd-voucher-card">
                        {/* QR code */}
                        <div className="rd-voucher-qr" aria-label={`QR code for ${entry.reward.title}`}>
                          <div className="rd-qr-grid">
                            {cells.map((on, i) => (
                              <span key={i} className={on ? "rd-qr-cell rd-qr-cell--on" : "rd-qr-cell"} />
                            ))}
                          </div>
                        </div>

                        {/* Voucher details */}
                        <div className="rd-voucher-info">
                          <div className="rd-voucher-header">
                            <span className={`rd-voucher-status rd-voucher-status--${walletTab.toLowerCase()}`}>
                              {walletTab === "Active" ? "✓ Ready to Use" : walletTab === "Used" ? "✓ Used" : "⌛ Expired"}
                            </span>
                            <span className="rd-voucher-id">{voucherId}</span>
                          </div>
                          <h3 className="rd-voucher-title">{entry.reward.title}</h3>
                          <span className="rd-voucher-partner">{entry.reward.partner}</span>
                          <dl className="rd-voucher-dl">
                            <div><dt>Redeemed</dt><dd>{fmtDate(entry.redeemedAt)}</dd></div>
                            <div><dt>Expires</dt><dd>{fmtDate(entry.expiresAt)}</dd></div>
                            <div>
                              <dt>Cost</dt>
                              <dd style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <EcoCoin size={10} />{entry.reward.cost.toLocaleString()}
                              </dd>
                            </div>
                          </dl>
                          {walletTab === "Active" && (
                            <button
                              className="rd-voucher-detail-btn"
                              onClick={() => { setSelectedReward(entry.reward); setDetailReward(entry.reward); }}
                              type="button"
                            >
                              View Full Voucher
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* ════════ REWARD DETAIL MODAL (unchanged) ════════ */}
      {detailReward ? (
        <div className="rd-overlay rd-overlay--center" onClick={() => setDetailReward(null)} role="presentation">
          <section
            aria-label={`${detailReward.title} details`}
            className="rd-detail-modal"
            onClick={e => e.stopPropagation()}
          >
            <button aria-label="Close" className="rd-detail-close" onClick={() => setDetailReward(null)} type="button">×</button>
            <div className="rd-detail-img">
              <img alt={detailReward.title} src={detailReward.image} />
              <span className={badgeClass(detailReward.badge)}>{detailReward.badge}</span>
              <div className="rd-detail-img-shade" />
            </div>
            <div className="rd-detail-content">
              <span className="rd-detail-partner">{detailReward.partner}</span>
              <h2>{detailReward.title}</h2>
              <p>{detailReward.description}</p>
              <div className="rd-detail-price">
                <EcoCoin size={22} />
                <strong>{detailReward.cost.toLocaleString()}</strong>
                <small>EcoCoins</small>
              </div>
              <div className="rd-detail-facts">
                <span><small>Stock</small><strong>{detailReward.stock} remaining</strong></span>
                <span><small>Expiry</small><strong>{detailReward.expiry}</strong></span>
              </div>
              {/* QR section */}
              <div className="rd-detail-qr-wrap">
                <div className="rd-qr-grid rd-qr-grid--sm">
                  {qrCells.map((on, i) => <span key={i} className={on ? "rd-qr-cell rd-qr-cell--on" : "rd-qr-cell"} />)}
                </div>
                <span className="rd-detail-qr-label">Scan at partner location</span>
              </div>
              <div className="rd-detail-terms">
                <strong>Terms & Conditions</strong>
                <p>One redemption per transaction. Subject to partner availability. Present the generated voucher before its expiry date. Vouchers are non-transferable and cannot be exchanged for cash.</p>
              </div>
              <button
                className="rd-redeem-btn rd-redeem-btn--lg"
                disabled={yieldCoins < detailReward.cost}
                onClick={() => redeemReward(detailReward)}
                type="button"
              >
                {yieldCoins >= detailReward.cost ? "Redeem reward" : "Not enough EcoCoins"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* ════════ SUCCESS MODAL (unchanged) ════════ */}
      {successRedemption ? (
        <div
          className="rd-overlay rd-overlay--center redemption-success-overlay"
          onClick={() => setSuccessRedemption(null)}
          role="presentation"
        >
          <div
            aria-live="polite"
            aria-modal="true"
            className="redemption-success-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
          >
            <div className="redemption-success-icon" aria-hidden="true">
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" fill="url(#successCircleGrad)" stroke="rgba(55,229,143,0.5)" strokeWidth="1" />
                <path d="M14 26.5l8.5 8.5 15-16" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="successCircleGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#37e58f" />
                    <stop offset="100%" stopColor="#0ea561" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="redemption-success-title">Redemption Successful!</h2>
            <p className="redemption-success-msg">Your reward has been redeemed successfully.</p>
            <div className="redemption-success-details">
              <div className="redemption-success-row"><span>Reward</span><strong>{successRedemption.reward.title}</strong></div>
              <div className="redemption-success-row"><span>Partner</span><strong>{successRedemption.reward.partner}</strong></div>
              <div className="redemption-success-row">
                <span>EcoCoins spent</span>
                <strong style={{ color: "#f87171", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <EcoCoin size={13} />−{successRedemption.coinsSpent.toLocaleString()}
                </strong>
              </div>
              <div className="redemption-success-row">
                <span>Remaining balance</span>
                <strong style={{ color: "#37e58f", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <EcoCoin size={13} />{successRedemption.remaining.toLocaleString()}
                </strong>
              </div>
              <div className="redemption-success-row"><span>Voucher status</span><span className="redemption-success-badge">✓ Ready to Use</span></div>
              <div className="redemption-success-row">
                <span>Redeemed at</span>
                <strong>{successRedemption.redeemedAt.toLocaleString("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
              </div>
            </div>
            <div className="redemption-success-actions">
              <button
                className="redemption-success-btn redemption-success-btn--primary"
                onClick={() => {
                  setSuccessRedemption(null);
                  setDetailReward(successRedemption.reward);
                }}
                type="button"
              >
                View Voucher
              </button>
              <button
                className="redemption-success-btn redemption-success-btn--ghost"
                onClick={() => {
                  setSuccessRedemption(null);
                  setMainView("wallet");
                  setWalletTab("Active");
                }}
                type="button"
              >
                Go to Wallet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

/* ════════════════════════════════════════════════════════════
   Local stylesheet
════════════════════════════════════════════════════════════ */
const styleSheet = `
  /* Shell scroll */
  .cockpit-shell { overflow-y: auto; }
  .rewards-page-shell { box-sizing: border-box; }
  .rd-frame { box-sizing: border-box; display: flex; flex-direction: column; gap: 0; min-height: 0; }

  /* ── Top bar ── */
  .rd-topbar { align-items: flex-start; display: flex; gap: 20px; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; }
  .rd-topbar-left { display: flex; align-items: flex-start; gap: 14px; }
  .rd-back-btn { align-items: center; background: rgba(55,229,143,.1); border: 1px solid rgba(55,229,143,.28); border-radius: 10px; color: #37e58f; cursor: pointer; display: inline-flex; font-size: 12px; font-weight: 800; gap: 6px; padding: 8px 14px; transition: background .18s, transform .18s; flex-shrink: 0; margin-top: 4px; }
  .rd-back-btn:hover { background: rgba(55,229,143,.17); transform: translateX(-2px); }
  .rd-eyebrow { color: #37e58f; font-size: 11px; font-weight: 900; letter-spacing: .1em; margin: 0; text-transform: uppercase; }
  .rd-title { color: #f4fff9; font-size: clamp(20px,3vw,32px); font-weight: 900; letter-spacing: -.03em; line-height: 1.1; margin: 5px 0 0; }

  /* ── Tabs ── */
  .rd-tabs { display: flex; gap: 4px; background: rgba(10,20,20,.6); border: 1px solid rgba(55,229,143,.12); border-radius: 12px; padding: 4px; flex-shrink: 0; }
  .rd-tab { background: transparent; border: 0; border-radius: 8px; color: #7a9490; cursor: pointer; font-size: 12px; font-weight: 800; padding: 8px 18px; transition: background .18s, color .18s; position: relative; }
  .rd-tab--active { background: rgba(55,229,143,.15); color: #37e58f; }
  .rd-tab:hover:not(.rd-tab--active) { color: #c5ddd8; }
  .rd-tab-badge { align-items: center; background: #37e58f; border-radius: 50%; color: #031a0e; display: inline-flex; font-size: 8px; font-weight: 900; height: 16px; justify-content: center; margin-left: 6px; min-width: 16px; padding: 0 3px; vertical-align: middle; }

  /* ── HOME: Balance card ── */
  .rd-home { display: flex; flex-direction: column; gap: 22px; }
  .rd-balance-card { background: radial-gradient(circle at 90% 10%, rgba(55,229,143,.18), transparent 40%), linear-gradient(140deg, rgba(8,22,18,.98), rgba(4,12,12,.98)); border: 1px solid rgba(55,229,143,.32); border-radius: 18px; box-shadow: 0 18px 50px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.04); display: grid; grid-template-columns: 1fr auto; gap: 20px; padding: 24px 28px; }
  .rd-balance-main { display: flex; flex-direction: column; gap: 4px; }
  .rd-balance-label { color: #8aada7; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .rd-balance-amount { align-items: center; color: #f4fff9; display: inline-flex; font-size: clamp(38px,5vw,58px); font-weight: 950; letter-spacing: -.05em; line-height: 1; margin-top: 6px; }
  .rd-balance-earned { color: #37e58f; font-size: 11px; font-weight: 800; margin-top: 4px; }
  .rd-balance-meta { display: flex; flex-direction: column; gap: 14px; justify-content: center; min-width: 200px; }
  .rd-balance-expiry-pill { align-items: center; background: rgba(245,166,35,.09); border: 1px solid rgba(245,166,35,.28); border-radius: 11px; display: flex; gap: 10px; padding: 10px 13px; }
  .rd-expiry-dot { align-items: center; background: #f5a623; border-radius: 50%; color: #171006; display: flex; flex-shrink: 0; font-size: 10px; font-weight: 950; height: 20px; justify-content: center; width: 20px; }
  .rd-balance-expiry-pill div { display: grid; gap: 2px; }
  .rd-balance-expiry-pill small { color: #f5a623; font-size: 9px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
  .rd-balance-expiry-pill b { align-items: center; color: #ffcf78; display: inline-flex; font-size: 11px; gap: 3px; }
  .rd-tier-wrap { display: grid; gap: 5px; }
  .rd-tier-row { display: flex; justify-content: space-between; }
  .rd-tier-row span { color: #6f8f89; font-size: 10px; font-weight: 700; }
  .rd-tier-row span:last-child { color: #9db3ad; }
  .rd-tier-bar { background: rgba(55,229,143,.12); border-radius: 99px; height: 7px; overflow: hidden; }
  .rd-tier-fill { background: linear-gradient(90deg, #37e58f, #0ea561); border-radius: 99px; height: 100%; transition: width .6s ease; }
  .rd-tier-label { color: #5a7872; font-size: 9px; font-weight: 700; }

  /* ── HOME: Section label ── */
  .rd-section-label { color: #37e58f; font-size: 10px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }

  /* ── HOME: Category grid ── */
  .rd-cat-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0,1fr)); }
  .rd-cat-card { background: linear-gradient(160deg, rgba(12,24,22,.98), rgba(6,14,14,.98)); border: 1px solid rgba(91,119,112,.2); border-radius: 18px; cursor: pointer; display: flex; flex-direction: column; overflow: hidden; padding: 0; position: relative; text-align: left; transition: border-color .24s, box-shadow .24s, transform .24s; }
  .rd-cat-card:hover { border-color: rgba(55,229,143,.48); box-shadow: 0 20px 60px rgba(0,0,0,.4), 0 0 0 1px rgba(55,229,143,.07); transform: translateY(-5px); }
  .rd-cat-card:hover .rd-cat-cta { color: #37e58f; }
  .rd-cat-img-wrap { height: 130px; overflow: hidden; position: relative; flex-shrink: 0; }
  .rd-cat-img-wrap img { height: 100%; object-fit: cover; transition: transform .45s ease; width: 100%; }
  .rd-cat-card:hover .rd-cat-img-wrap img { transform: scale(1.06); }
  .rd-cat-img-overlay { background: linear-gradient(180deg, transparent 30%, rgba(6,14,14,.88)); inset: 0; pointer-events: none; position: absolute; }
  .rd-cat-body { display: flex; flex-direction: column; flex: 1; gap: 5px; padding: 14px 16px 16px; }
  .rd-cat-emoji { font-size: 22px; line-height: 1; }
  .rd-cat-name { color: #f4fff9; font-size: 15px; font-weight: 900; letter-spacing: -.02em; margin: 2px 0 0; }
  .rd-cat-desc { color: #7a9490; font-size: 11px; line-height: 1.45; margin: 0; flex: 1; }
  .rd-cat-footer { align-items: center; display: flex; justify-content: space-between; margin-top: 10px; }
  .rd-cat-count { background: var(--cat-color, rgba(55,229,143,.14)); border-radius: 999px; color: #37e58f; font-size: 9px; font-weight: 900; padding: 4px 10px; }
  .rd-cat-cta { color: #5a7872; font-size: 11px; font-weight: 800; transition: color .18s; }

  /* ── CATEGORY VIEW ── */
  .rd-category-view { display: flex; flex-direction: column; gap: 18px; }
  .rd-mini-balance { align-items: center; background: rgba(55,229,143,.07); border: 1px solid rgba(55,229,143,.18); border-radius: 10px; color: #37e58f; display: inline-flex; font-size: 12px; font-weight: 800; gap: 7px; padding: 8px 16px; align-self: flex-start; }

  /* 4-card reward grid */
  .rd-reward-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0,1fr)); }
  .rd-reward-card { background: linear-gradient(180deg, rgba(14,26,24,.98), rgba(7,16,16,.98)); border: 1px solid rgba(91,119,112,.22); border-radius: 16px; box-shadow: 0 14px 40px rgba(0,0,0,.2); display: flex; flex-direction: column; overflow: hidden; transition: border-color .22s, box-shadow .22s, transform .22s; }
  .rd-reward-card:hover { border-color: rgba(55,229,143,.45); box-shadow: 0 22px 60px rgba(0,0,0,.32), 0 0 0 1px rgba(55,229,143,.06); transform: translateY(-4px); }
  .rd-reward-img-btn { background: #0e1e1c; border: 0; cursor: pointer; display: block; height: 160px; overflow: hidden; padding: 0; position: relative; width: 100%; }
  .rd-reward-img-btn img { height: 100%; object-fit: cover; transition: transform .4s ease; width: 100%; }
  .rd-reward-card:hover .rd-reward-img-btn img { transform: scale(1.05); }
  .rd-reward-img-shade { background: linear-gradient(180deg, transparent 50%, rgba(4,10,10,.55)); inset: 0; pointer-events: none; position: absolute; }
  .rd-reward-body { display: flex; flex: 1; flex-direction: column; padding: 14px; }
  .rd-reward-title-group { display: grid; gap: 3px; margin-bottom: 7px; }
  .rd-reward-title-group h3 { color: #f4fff9; font-size: 14px; font-weight: 900; letter-spacing: -.01em; line-height: 1.25; margin: 0; }
  .rd-reward-title-group span { color: #5a9080; font-size: 10px; font-weight: 800; }
  .rd-reward-body > p { color: #8eaaa4; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: 11px; line-height: 1.45; margin: 0 0 10px; overflow: hidden; flex: 1; }
  .rd-reward-price { align-items: center; color: #37e58f; display: flex; gap: 5px; margin-bottom: 8px; }
  .rd-reward-price strong { font-size: 22px; font-weight: 950; letter-spacing: -.04em; }
  .rd-reward-price small { color: #6a9085; font-size: 9px; font-weight: 900; text-transform: uppercase; }
  .rd-reward-meta { border-top: 1px solid rgba(91,119,112,.16); display: flex; justify-content: space-between; margin-bottom: 10px; padding-top: 8px; }
  .rd-reward-meta > span { color: #6a8680; font-size: 9px; }
  .rd-expiry { align-items: center; display: flex; font-size: 9px; gap: 4px; }
  .rd-expiry--urgent { color: #ffb44f; font-weight: 800; }
  .rd-expiry i { align-items: center; background: rgba(245,166,35,.15); border: 1px solid rgba(245,166,35,.4); border-radius: 50%; display: flex; font-size: 7px; font-style: normal; font-weight: 950; height: 13px; justify-content: center; width: 13px; }

  /* Badge */
  .rd-badge { backdrop-filter: blur(12px); background: rgba(6,17,15,.82); border: 1px solid rgba(55,229,143,.4); border-radius: 999px; color: #37e58f; font-size: 8px; font-weight: 900; left: 10px; letter-spacing: .04em; padding: 4px 8px; position: absolute; text-transform: uppercase; top: 10px; z-index: 2; }
  .rd-badge--value { border-color: rgba(56,189,248,.58); color: #70d4ff; }
  .rd-badge--limited { border-color: rgba(245,166,35,.62); color: #ffc562; }
  .rd-badge--new { border-color: rgba(255,255,255,.45); color: #fff; }

  /* Redeem button */
  .rd-redeem-btn { background: #37e58f; border: 0; border-radius: 10px; box-shadow: 0 10px 24px rgba(55,229,143,.14); color: #031a0e; cursor: pointer; font-size: 11px; font-weight: 950; height: 38px; margin-top: auto; transition: background .18s, box-shadow .18s, transform .18s; width: 100%; }
  .rd-redeem-btn:hover:not(:disabled) { background: #54f0a3; box-shadow: 0 14px 30px rgba(55,229,143,.22); transform: translateY(-1px); }
  .rd-redeem-btn:disabled { background: #1e2e2b; color: #556560; cursor: not-allowed; }
  .rd-redeem-btn--lg { height: 48px; font-size: 13px; }

  /* Pagination */
  .rd-pagination { align-items: center; display: flex; gap: 16px; justify-content: center; margin-top: 8px; }
  .rd-page-btn { align-items: center; background: rgba(55,229,143,.08); border: 1px solid rgba(55,229,143,.24); border-radius: 10px; color: #37e58f; cursor: pointer; display: inline-flex; font-size: 12px; font-weight: 800; gap: 7px; padding: 10px 20px; transition: background .18s, transform .18s; }
  .rd-page-btn:hover:not(:disabled) { background: rgba(55,229,143,.16); transform: translateX(-2px); }
  .rd-page-btn:last-child:hover:not(:disabled) { transform: translateX(2px); }
  .rd-page-btn:disabled { border-color: rgba(91,119,112,.18); color: #3d5550; cursor: not-allowed; }
  .rd-page-info { color: #6a8680; font-size: 12px; font-weight: 700; }

  /* ── WALLET VIEW ── */
  .rd-wallet-view { display: flex; flex-direction: column; gap: 18px; }
  .rd-wallet-tabs { background: rgba(10,20,20,.6); border: 1px solid rgba(55,229,143,.12); border-radius: 12px; display: flex; gap: 4px; padding: 4px; align-self: flex-start; }
  .rd-wallet-tab { align-items: center; background: transparent; border: 0; border-radius: 8px; color: #7a9490; cursor: pointer; display: inline-flex; font-size: 12px; font-weight: 800; gap: 6px; padding: 8px 18px; transition: background .18s, color .18s; }
  .rd-wallet-tab--active { background: rgba(55,229,143,.15); color: #37e58f; }
  .rd-wallet-tab:hover:not(.rd-wallet-tab--active) { color: #c5ddd8; }
  .rd-wallet-tab-count { align-items: center; background: rgba(55,229,143,.18); border-radius: 999px; color: #37e58f; display: inline-flex; font-size: 9px; font-weight: 900; height: 17px; justify-content: center; min-width: 17px; padding: 0 4px; }
  .rd-wallet-empty { align-items: center; background: rgba(12,24,22,.6); border: 1px dashed rgba(91,119,112,.28); border-radius: 16px; display: flex; flex-direction: column; gap: 8px; justify-content: center; min-height: 260px; padding: 40px; text-align: center; }
  .rd-wallet-empty-icon { font-size: 40px; }
  .rd-wallet-empty strong { color: #eafff5; font-size: 16px; }
  .rd-wallet-empty span { color: #6a8680; font-size: 12px; }
  .rd-voucher-list { display: grid; gap: 14px; }
  .rd-voucher-card { background: linear-gradient(135deg, rgba(12,24,22,.98), rgba(7,16,16,.98)); border: 1px solid rgba(91,119,112,.22); border-radius: 16px; display: grid; grid-template-columns: 130px minmax(0,1fr); gap: 0; overflow: hidden; }

  /* QR grid inside voucher */
  .rd-voucher-qr { align-items: center; background: rgba(6,14,12,.9); border-right: 1px solid rgba(91,119,112,.18); display: flex; justify-content: center; padding: 16px; }
  .rd-qr-grid { display: grid; gap: 2px; grid-template-columns: repeat(9, 10px); grid-template-rows: repeat(9, 10px); }
  .rd-qr-cell { border-radius: 2px; height: 10px; width: 10px; }
  .rd-qr-cell--on { background: #37e58f; }
  .rd-qr-grid--sm .rd-qr-cell { height: 7px; width: 7px; }
  .rd-qr-grid--sm { gap: 1.5px; grid-template-columns: repeat(9, 7px); grid-template-rows: repeat(9, 7px); }

  .rd-voucher-info { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; }
  .rd-voucher-header { align-items: center; display: flex; justify-content: space-between; gap: 10px; }
  .rd-voucher-status { border-radius: 999px; font-size: 10px; font-weight: 900; padding: 4px 10px; }
  .rd-voucher-status--active { background: rgba(55,229,143,.15); border: 1px solid rgba(55,229,143,.4); color: #37e58f; }
  .rd-voucher-status--used { background: rgba(100,116,139,.12); border: 1px solid rgba(100,116,139,.3); color: #94a3b8; }
  .rd-voucher-status--expired { background: rgba(245,166,35,.1); border: 1px solid rgba(245,166,35,.3); color: #f5a623; }
  .rd-voucher-id { color: #3d5550; font-family: monospace; font-size: 10px; }
  .rd-voucher-title { color: #f4fff9; font-size: 15px; font-weight: 900; letter-spacing: -.015em; margin: 0; }
  .rd-voucher-partner { color: #5a9080; font-size: 10px; font-weight: 800; }
  .rd-voucher-dl { display: grid; gap: 4px; grid-template-columns: repeat(3,auto); justify-content: start; margin: 4px 0 0; }
  .rd-voucher-dl div { display: grid; gap: 2px; }
  .rd-voucher-dl dt { color: #4a6560; font-size: 8px; font-weight: 700; text-transform: uppercase; }
  .rd-voucher-dl dd { color: #b5cdc7; font-size: 10px; font-weight: 800; margin: 0; }
  .rd-voucher-detail-btn { background: rgba(55,229,143,.1); border: 1px solid rgba(55,229,143,.34); border-radius: 8px; color: #37e58f; cursor: pointer; font-size: 10px; font-weight: 900; margin-top: 6px; padding: 7px 12px; transition: background .18s; width: 100%; }
  .rd-voucher-detail-btn:hover { background: rgba(55,229,143,.18); }

  /* ── DETAIL MODAL (overlay + modal) ── */
  .rd-overlay { align-items: center; background: rgba(2,8,8,.78); backdrop-filter: blur(12px); display: flex; inset: 0; justify-content: center; padding: 20px; position: fixed; z-index: 1000; }
  .rd-overlay--center { align-items: center; justify-content: center; }
  .rd-detail-modal { background: radial-gradient(circle at 20% 0%, rgba(55,229,143,.08), transparent 40%), #091514; border: 1px solid rgba(91,119,112,.34); border-radius: 20px; box-shadow: 0 40px 100px rgba(0,0,0,.6); display: grid; grid-template-columns: minmax(260px,.9fr) minmax(320px,1.1fr); max-height: min(760px,90vh); max-width: 880px; overflow: hidden; position: relative; width: min(94vw,880px); }
  .rd-detail-close { background: rgba(126,153,146,.1); border: 1px solid rgba(126,153,146,.22); border-radius: 50%; color: #b9cbc6; cursor: pointer; font-size: 22px; height: 36px; line-height: 1; position: absolute; right: 14px; top: 14px; width: 36px; z-index: 4; }
  .rd-detail-img { min-height: 480px; overflow: hidden; position: relative; }
  .rd-detail-img img { height: 100%; object-fit: cover; width: 100%; }
  .rd-detail-img-shade { background: linear-gradient(90deg, transparent, rgba(9,21,20,.35)); inset: 0; pointer-events: none; position: absolute; }
  .rd-detail-content { align-self: center; display: flex; flex-direction: column; gap: 12px; max-height: 90vh; overflow-y: auto; padding: 32px; }
  .rd-detail-partner { color: #37e58f; font-size: 10px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
  .rd-detail-content h2 { color: #f4fff9; font-size: 28px; font-weight: 900; letter-spacing: -.03em; line-height: 1.05; margin: 0; }
  .rd-detail-content > p { color: #9db1ab; font-size: 13px; line-height: 1.55; margin: 0; }
  .rd-detail-price { align-items: center; color: #37e58f; display: flex; gap: 7px; }
  .rd-detail-price strong { font-size: 32px; font-weight: 950; letter-spacing: -.04em; }
  .rd-detail-price small { color: #6a9085; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .rd-detail-facts { display: grid; gap: 9px; grid-template-columns: 1fr 1fr; }
  .rd-detail-facts > span { background: rgba(14,26,24,.9); border: 1px solid rgba(91,119,112,.2); border-radius: 9px; display: grid; gap: 4px; padding: 10px 12px; }
  .rd-detail-facts small { color: #5a7870; font-size: 8px; font-weight: 800; text-transform: uppercase; }
  .rd-detail-facts strong { color: #d8e9e4; font-size: 11px; }
  .rd-detail-qr-wrap { align-items: center; background: rgba(6,14,12,.8); border: 1px solid rgba(55,229,143,.14); border-radius: 12px; display: flex; flex-direction: column; gap: 8px; padding: 14px; }
  .rd-detail-qr-label { color: #5a7870; font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .rd-detail-terms { border-top: 1px solid rgba(91,119,112,.18); padding-top: 12px; }
  .rd-detail-terms strong { color: #d0e5de; font-size: 10px; }
  .rd-detail-terms p { color: #6a8680; font-size: 10px; line-height: 1.55; margin: 5px 0 0; }

  /* ── SUCCESS MODAL (unchanged) ── */
  @keyframes successFadeIn { from { opacity: 0; transform: scale(0.88) translateY(18px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .redemption-success-overlay { z-index: 1100; }
  .redemption-success-modal { animation: successFadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); background: radial-gradient(circle at 20% 0%, rgba(55,229,143,0.13), transparent 50%), linear-gradient(160deg, rgba(8,22,20,0.97), rgba(4,12,12,0.98)); border: 1px solid rgba(55,229,143,0.3); border-radius: 22px; box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(55,229,143,0.08), inset 0 1px rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; gap: 0; max-width: 420px; padding: 38px 32px 30px; text-align: center; width: min(92vw, 420px); }
  .redemption-success-icon { filter: drop-shadow(0 0 18px rgba(55,229,143,0.5)); height: 64px; margin-bottom: 18px; width: 64px; }
  .redemption-success-icon svg { display: block; height: 64px; width: 64px; }
  .redemption-success-title { color: #f4fff9; font-size: 22px; font-weight: 900; letter-spacing: -0.03em; margin: 0 0 8px; }
  .redemption-success-msg { color: #9db3ad; font-size: 13px; line-height: 1.55; margin: 0 0 20px; }
  .redemption-success-details { background: rgba(255,255,255,0.03); border: 1px solid rgba(55,229,143,0.14); border-radius: 13px; display: grid; gap: 0; margin-bottom: 22px; overflow: hidden; width: 100%; }
  .redemption-success-row { align-items: center; border-bottom: 1px solid rgba(55,229,143,0.08); display: flex; gap: 12px; justify-content: space-between; padding: 10px 14px; }
  .redemption-success-row:last-child { border-bottom: none; }
  .redemption-success-row > span:first-child { color: #7a9490; flex-shrink: 0; font-size: 11px; font-weight: 600; text-align: left; }
  .redemption-success-row > strong { color: #e2f5ee; font-size: 12px; text-align: right; }
  .redemption-success-badge { background: rgba(55,229,143,0.15); border: 1px solid rgba(55,229,143,0.45); border-radius: 999px; color: #37e58f; font-size: 10px; font-weight: 800; letter-spacing: 0.04em; padding: 4px 10px; }
  .redemption-success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .redemption-success-btn { border: 0; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 900; height: 44px; letter-spacing: 0.01em; transition: background 0.18s, box-shadow 0.18s, transform 0.18s; width: 100%; }
  .redemption-success-btn--primary { background: linear-gradient(135deg, #37e58f, #0ea561); box-shadow: 0 10px 28px rgba(55,229,143,0.25); color: #031a0e; }
  .redemption-success-btn--primary:hover { background: linear-gradient(135deg, #54f0a3, #1dc976); box-shadow: 0 14px 36px rgba(55,229,143,0.35); transform: translateY(-1px); }
  .redemption-success-btn--ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #9db3ad; }
  .redemption-success-btn--ghost:hover { background: rgba(255,255,255,0.09); color: #d4e9e2; transform: translateY(-1px); }

  /* ── RESPONSIVE ── */
  @media (max-width: 1199px) {
    .rd-cat-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .rd-reward-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .rd-balance-card { grid-template-columns: 1fr; }
    .rd-balance-meta { flex-direction: row; flex-wrap: wrap; }
  }
  @media (max-width: 720px) {
    .rd-topbar { flex-direction: column; gap: 12px; }
    .rd-cat-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .rd-reward-grid { grid-template-columns: 1fr; }
    .rd-title { font-size: 22px; }
    .rd-detail-modal { display: block; max-height: 92vh; overflow-y: auto; }
    .rd-detail-img { height: 200px; min-height: 0; }
    .rd-detail-content { max-height: none; padding: 20px; }
    .rd-detail-content h2 { font-size: 22px; }
    .rd-detail-facts { grid-template-columns: 1fr; }
    .rd-voucher-card { grid-template-columns: 1fr; }
    .rd-voucher-qr { border-right: none; border-bottom: 1px solid rgba(91,119,112,.18); }
  }
  @media (max-width: 480px) {
    .rd-cat-grid { grid-template-columns: 1fr; }
  }
`;
