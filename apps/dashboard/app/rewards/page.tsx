"use client";

import { useEffect, useMemo, useState } from "react";
import { CockpitShell } from "../../components/cockpit-shell";

const EcoCoin = ({ size = 16, className = "", style = {} }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <span className={`eco-coin-icon ${className}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
      {/* Outer Coin Circle with gold gradient */}
      <circle cx="12" cy="12" r="11" fill="url(#coinOuterGrad)" stroke="#EAB308" strokeWidth="0.5" />
      
      {/* Inner Coin Circle with slightly darker gold gradient */}
      <circle cx="12" cy="12" r="8.5" fill="url(#coinInnerGrad)" stroke="#CA8A04" strokeWidth="0.5" />
      
      {/* Leaf Symbol in center with gold gradient */}
      <g transform="translate(4.5, 4.5) scale(0.62)">
        <path 
          d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z" 
          fill="url(#coinLeafGrad)" 
          stroke="#9A3412" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M9 22v-4h-4" 
          stroke="#9A3412" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </g>
      <defs>
        {/* Gradients */}
        <linearGradient id="coinOuterGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" /> {/* Yellow 300 */}
          <stop offset="50%" stopColor="#EAB308" /> {/* Yellow 500 */}
          <stop offset="100%" stopColor="#A16207" /> {/* Yellow 700 */}
        </linearGradient>
        <linearGradient id="coinInnerGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAB308" />
          <stop offset="50%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>
        <linearGradient id="coinLeafGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" /> {/* Yellow 200 */}
          <stop offset="50%" stopColor="#FDE047" /> {/* Yellow 300 */}
          <stop offset="100%" stopColor="#CA8A04" /> {/* Yellow 600 */}
        </linearGradient>
      </defs>
    </svg>
  </span>
);

type RewardCategory = "Food & Drinks" | "EV Benefits" | "Shopping" | "Eco Impact";
type CategoryFilter = "All" | RewardCategory;
type SortOption = "Most Popular" | "Lowest EcoCoins" | "Highest EcoCoins" | "Newest";

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
  status: "Unused";
};

const categories: CategoryFilter[] = ["All", "Food & Drinks", "EV Benefits", "Shopping", "Eco Impact"];

const rewards: Reward[] = [
  {
    id: "premium-coffee",
    title: "Premium Coffee",
    partner: "The Daily Grind",
    description: "Enjoy one handcrafted hot or iced premium coffee.",
    cost: 500,
    stock: 18,
    badge: "Popular",
    category: "Food & Drinks",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 5 days",
    expiryUrgent: true
  },
  {
    id: "bubble-tea",
    title: "Bubble Tea Voucher",
    partner: "Boba Avenue",
    description: "Redeem any regular-sized signature milk tea or fruit tea.",
    cost: 650,
    stock: 24,
    badge: "New",
    category: "Food & Drinks",
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "healthy-lunch",
    title: "Healthy Lunch Voucher",
    partner: "Green Bowl Kitchen",
    description: "A balanced plant-forward lunch bowl with a refreshing drink.",
    cost: 950,
    stock: 12,
    badge: "Best Value",
    category: "Food & Drinks",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 14 days"
  },
  {
    id: "ice-cream",
    title: "Ice Cream Voucher",
    partner: "Scoop Society",
    description: "Choose two scoops from a rotating menu of artisan flavours.",
    cost: 600,
    stock: 8,
    badge: "Limited",
    category: "Food & Drinks",
    image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 7 days",
    expiryUrgent: true
  },
  {
    id: "charging-credit",
    title: "EV Charging Credit",
    partner: "GreenCharge Bay",
    description: "Apply RM20 charging credit at participating fast chargers.",
    cost: 900,
    stock: 20,
    badge: "Best Value",
    category: "EV Benefits",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "ev-parking",
    title: "Reserved EV Parking",
    partner: "Campus Mobility",
    description: "Reserve a preferred EV parking bay for one full day.",
    cost: 1200,
    stock: 6,
    badge: "Popular",
    category: "EV Benefits",
    image: "https://images.unsplash.com/photo-1597404294360-feeeda04612e?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 3 days",
    expiryUrgent: true
  },
  {
    id: "eco-car-wash",
    title: "Eco Car Wash",
    partner: "AquaLess Auto Care",
    description: "A complete water-saving exterior wash for your vehicle.",
    cost: 1450,
    stock: 10,
    badge: "New",
    category: "EV Benefits",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 21 days"
  },
  {
    id: "battery-check",
    title: "Battery Health Check",
    partner: "VoltCare Service",
    description: "Professional EV battery diagnostics with a digital report.",
    cost: 1800,
    stock: 7,
    badge: "Limited",
    category: "EV Benefits",
    image: "https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 30 Nov 2026"
  },
  {
    id: "tshirt",
    title: "EcoDrive T-Shirt",
    partner: "EcoDrive Official",
    description: "A premium organic-cotton tee in the EcoDrive signature green.",
    cost: 3500,
    stock: 14,
    badge: "Popular",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "tote-bag",
    title: "Eco Tote Bag",
    partner: "EarthKind Goods",
    description: "A durable everyday tote made from recycled cotton canvas.",
    cost: 1600,
    stock: 22,
    badge: "New",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 30 days"
  },
  {
    id: "steel-bottle",
    title: "Stainless Steel Bottle",
    partner: "Refill Malaysia",
    description: "A double-wall insulated bottle that keeps drinks cold all day.",
    cost: 2200,
    stock: 11,
    badge: "Best Value",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "wireless-charger",
    title: "Wireless Phone Charger",
    partner: "LoopTech",
    description: "A compact fast-charging pad made with recycled materials.",
    cost: 4200,
    stock: 5,
    badge: "Limited",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1622037022824-0c71d511ef3c?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 6 days",
    expiryUrgent: true
  },
  {
    id: "plant-tree",
    title: "Plant a Tree",
    partner: "Reforest Malaysia",
    description: "Fund one native tree and receive a digital planting update.",
    cost: 800,
    stock: 50,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "carbon-certificate",
    title: "Carbon Offset Certificate",
    partner: "Climate Action MY",
    description: "Offset 25 kg of verified emissions with a named certificate.",
    cost: 1300,
    stock: 35,
    badge: "Best Value",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 18 days"
  },
  {
    id: "green-donation",
    title: "Green Donation",
    partner: "Eco Community Fund",
    description: "Support local recycling and environmental education projects.",
    cost: 1000,
    stock: 40,
    badge: "New",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=900&q=85",
    expiry: "Valid until 31 Dec 2026"
  },
  {
    id: "recycled-notebook",
    title: "Recycled Notebook",
    partner: "PaperAgain Studio",
    description: "A premium ruled notebook crafted from 100% recycled paper.",
    cost: 750,
    stock: 9,
    badge: "Limited",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85",
    expiry: "Expires in 4 days",
    expiryUrgent: true
  }
];

export default function RewardsPage() {
  const [yieldCoins, setYieldCoins] = useState(12500);
  const [selectedReward, setSelectedReward] = useState(rewards[0]);
  const [redeemedReward, setRedeemedReward] = useState<Reward | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("Most Popular");
  const [detailReward, setDetailReward] = useState<Reward | null>(null);
  const [myRewardsOpen, setMyRewardsOpen] = useState(false);
  const [myRewardsTab, setMyRewardsTab] = useState<"Rewards" | "History">("Rewards");
  const [redemptionHistory, setRedemptionHistory] = useState<RedeemedEntry[]>([]);

  const qrCells = useMemo(() => {
    const seed = selectedReward.id.length + selectedReward.cost;
    return Array.from(
      { length: 81 },
      (_, index) => index % 10 === 0 || (index + seed) % 4 === 0 || (index * seed) % 17 === 0
    );
  }, [selectedReward]);

  useEffect(() => {
    if (!redeemedReward) return;
    const redeemedAt = new Date();
    setRedemptionHistory((current) => [{
      id: `${redeemedReward.id}-${yieldCoins}-${redeemedAt.getTime()}`,
      reward: redeemedReward,
      redeemedAt,
      expiresAt: new Date(redeemedAt.getTime() + 30 * 86_400_000),
      status: "Unused"
    }, ...current]);
  }, [redeemedReward, yieldCoins]);

  const visibleRewards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = rewards.filter((reward) =>
      (activeCategory === "All" || reward.category === activeCategory) &&
      (!query || reward.title.toLowerCase().includes(query) || reward.partner.toLowerCase().includes(query))
    );
    return [...filtered].sort((first, second) => {
      if (sortOption === "Lowest EcoCoins") return first.cost - second.cost;
      if (sortOption === "Highest EcoCoins") return second.cost - first.cost;
      if (sortOption === "Newest") return Number(second.badge === "New") - Number(first.badge === "New");
      return Number(second.badge === "Popular") - Number(first.badge === "Popular") || second.stock - first.stock;
    });
  }, [activeCategory, searchQuery, sortOption]);

  function redeemReward(reward: Reward) {
    if (yieldCoins < reward.cost) return;
    setYieldCoins((coins) => coins - reward.cost);
    setSelectedReward(reward);
    setRedeemedReward(reward);
  }

  void qrCells;

  return (
    <CockpitShell activeMode="rewards">
      <main className="rewards-page-shell">
        <section className="marketplace-frame" aria-labelledby="rewards-title">
          <header className="marketplace-hero">
            <div className="marketplace-hero-copy">
              <p className="marketplace-eyebrow">Rewards Marketplace</p>
              <h1 id="rewards-title">Good drives deserve great rewards.</h1>
              <p>Turn every sustainable journey into useful perks, exclusive products, and positive impact.</p>
            </div>

            <div className="marketplace-balance" aria-label="Available EcoCoins">
              <span className="balance-label">Available EcoCoins</span>
              <strong style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <EcoCoin size={40} />
                {yieldCoins.toLocaleString()}
              </strong>
              <span className="balance-earned">+120 earned this week</span>
              <div className="balance-expiry">
                <span className="expiry-alert" aria-hidden="true">!</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <small>Expiring Soon</small>
                  <b style={{ display: "inline-flex", alignItems: "center" }}>
                    <EcoCoin size={12} style={{ marginRight: "4px" }} />
                    320 EcoCoins expire in 5 days
                  </b>
                </div>
              </div>
            </div>
          </header>

          <div className="marketplace-category-row">
            <nav className="marketplace-categories" aria-label="Reward categories">
              {categories.map((category) => (
                <button
                  aria-pressed={activeCategory === category}
                  className={activeCategory === category ? "category-pill category-pill--active" : "category-pill"}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </nav>
            <button className="my-rewards-button" onClick={() => setMyRewardsOpen(true)} type="button">
              My Rewards <span>{redemptionHistory.length}</span>
            </button>
          </div>

          <div className="marketplace-tools">
            <label className="marketplace-search">
              <span>Search</span>
              <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search rewards..." type="search" value={searchQuery} />
            </label>
            <label className="marketplace-sort">
              <span>Sort by</span>
              <select onChange={(event) => setSortOption(event.target.value as SortOption)} value={sortOption}>
                <option>Most Popular</option>
                <option>Lowest EcoCoins</option>
                <option>Highest EcoCoins</option>
                <option>Newest</option>
              </select>
            </label>
          </div>

          <div className="marketplace-section-heading">
            <div><span>{activeCategory}</span><h2>{activeCategory === "All" ? "Explore all rewards" : `${activeCategory} rewards`}</h2></div>
            <small>{visibleRewards.length} rewards available</small>
          </div>

          <section className="marketplace-grid" aria-label="Available rewards">
            {visibleRewards.map((reward) => {
              const canRedeem = yieldCoins >= reward.cost;
              const isSelected = selectedReward.id === reward.id;

              return (
                <article
                  className={isSelected ? "marketplace-card marketplace-card--selected" : "marketplace-card"}
                  key={reward.id}
                  onClick={() => { setSelectedReward(reward); setDetailReward(reward); }}
                >
                  <button className="marketplace-image-button" onClick={() => setSelectedReward(reward)} type="button">
                    <img alt={reward.title} loading="lazy" referrerPolicy="no-referrer" src={reward.image} />
                    <span className={badgeClassName(reward.badge)}>{reward.badge}</span>
                    <span className="marketplace-image-shade" />
                  </button>

                  <div className="marketplace-card-body">
                    <div className="marketplace-title-group">
                      <h3>{reward.title}</h3>
                      <span>{reward.partner}</span>
                    </div>
                    <p>{reward.description}</p>

                    <div className="marketplace-price" aria-label={`${reward.cost.toLocaleString()} EcoCoins`} style={{ alignItems: "center" }}>
                      <EcoCoin size={18} />
                      <strong>{reward.cost.toLocaleString()}</strong>
                      <small>EcoCoins</small>
                    </div>

                    <div className="marketplace-meta">
                      <span>{reward.stock} remaining</span>
                      <span className={reward.expiryUrgent ? "marketplace-expiry marketplace-expiry--urgent" : "marketplace-expiry"}>
                        {reward.expiryUrgent ? <i aria-hidden="true">!</i> : null}{reward.expiry}
                      </span>
                    </div>

                    <button className="marketplace-redeem" disabled={!canRedeem} onClick={(event) => { event.stopPropagation(); redeemReward(reward); }} type="button">
                      {canRedeem ? "Redeem now" : "Not enough EcoCoins"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          {!visibleRewards.length ? (
            <div className="marketplace-empty"><strong>No rewards found</strong><span>Try another title, partner, or category.</span></div>
          ) : null}
        </section>
      </main>

      {myRewardsOpen ? (
        <div className="marketplace-overlay" onClick={() => setMyRewardsOpen(false)} role="presentation">
          <section aria-label="My Rewards" className="my-rewards-panel" onClick={(event) => event.stopPropagation()}>
            <header className="marketplace-modal-header">
              <div><span>Your collection</span><h2>My Rewards</h2></div>
              <button aria-label="Close My Rewards" onClick={() => setMyRewardsOpen(false)} type="button">×</button>
            </header>
            <div className="my-rewards-tabs" role="tablist">
              <button aria-selected={myRewardsTab === "Rewards"} className={myRewardsTab === "Rewards" ? "active" : ""} onClick={() => setMyRewardsTab("Rewards")} role="tab" type="button">Rewards</button>
              <button aria-selected={myRewardsTab === "History"} className={myRewardsTab === "History" ? "active" : ""} onClick={() => setMyRewardsTab("History")} role="tab" type="button">History</button>
            </div>
            {!redemptionHistory.length ? (
              <div className="my-rewards-empty"><strong>No rewards redeemed yet.</strong><span>Your redeemed vouchers and history will appear here.</span></div>
            ) : myRewardsTab === "Rewards" ? (
              <div className="my-rewards-list">
                {redemptionHistory.map((entry) => (
                  <article className="owned-reward" key={entry.id}>
                    <img alt={entry.reward.title} src={entry.reward.image} />
                    <div className="owned-reward-copy">
                      <h3>{entry.reward.title}</h3>
                      <dl><div><dt>Redeemed</dt><dd>{formatDate(entry.redeemedAt)}</dd></div><div><dt>Status</dt><dd className="status-unused">{entry.status}</dd></div><div><dt>Expires</dt><dd>{formatDate(entry.expiresAt)}</dd></div></dl>
                      <button onClick={() => { setMyRewardsOpen(false); setDetailReward(entry.reward); }} type="button">View Voucher</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="reward-history-list">
                {redemptionHistory.map((entry) => (
                  <article className="reward-history-item" key={entry.id}>
                    <div><strong>{entry.reward.title}</strong><span>{formatDate(entry.redeemedAt)}</span></div>
                    <div>
                      <b style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
                        -<EcoCoin size={10} style={{ marginLeft: "2px", marginRight: "3px" }} />
                        {entry.reward.cost.toLocaleString()} EcoCoins
                      </b>
                      <span>Completed</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {detailReward ? (
        <div className="marketplace-overlay marketplace-overlay--center" onClick={() => setDetailReward(null)} role="presentation">
          <section aria-label={`${detailReward.title} details`} className="reward-detail-modal" onClick={(event) => event.stopPropagation()}>
            <button aria-label="Close reward details" className="reward-detail-close" onClick={() => setDetailReward(null)} type="button">×</button>
            <div className="reward-detail-image"><img alt={detailReward.title} src={detailReward.image} /><span className={badgeClassName(detailReward.badge)}>{detailReward.badge}</span></div>
            <div className="reward-detail-content">
              <span className="reward-detail-partner">{detailReward.partner}</span>
              <h2>{detailReward.title}</h2>
              <p>{detailReward.description}</p>
              <div className="reward-detail-price" style={{ alignItems: "center" }}>
                <EcoCoin size={22} />
                <strong>{detailReward.cost.toLocaleString()}</strong>
                <small>EcoCoins</small>
              </div>
              <div className="reward-detail-facts"><span><small>Stock</small><strong>{detailReward.stock} remaining</strong></span><span><small>Expiry</small><strong>{detailReward.expiry}</strong></span></div>
              <div className="reward-terms"><strong>Terms & Conditions</strong><p>One redemption per transaction. Subject to partner availability. Present the generated voucher before its expiry date. Vouchers are non-transferable and cannot be exchanged for cash.</p></div>
              <button className="marketplace-redeem reward-detail-redeem" disabled={yieldCoins < detailReward.cost} onClick={() => redeemReward(detailReward)} type="button">
                {yieldCoins >= detailReward.cost ? "Redeem reward" : "Not enough EcoCoins"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function badgeClassName(badge: Reward["badge"]) {
  if (badge === "Best Value") return "marketplace-badge marketplace-badge--value";
  if (badge === "Limited") return "marketplace-badge marketplace-badge--limited";
  if (badge === "New") return "marketplace-badge marketplace-badge--new";
  return "marketplace-badge";
}

const styleSheet = `
  .rewards-page-shell { min-height: 100vh; padding: 88px 24px 112px; }
  .marketplace-frame { background: radial-gradient(circle at 90% 0%, rgba(55,229,143,.1), transparent 26%), linear-gradient(145deg, rgba(12,22,22,.98), rgba(5,12,13,.99)); border: 1px solid rgba(81,111,104,.28); border-radius: 20px; box-shadow: 0 28px 90px rgba(0,0,0,.32); margin: 0 auto; max-width: 1460px; overflow: hidden; padding: 24px; }
  .marketplace-hero { align-items: stretch; background: linear-gradient(115deg, rgba(16,31,29,.96), rgba(8,18,18,.92)); border: 1px solid rgba(77,113,103,.3); border-radius: 18px; display: grid; gap: 24px; grid-template-columns: minmax(0,1fr) minmax(320px,390px); padding: 28px; }
  .marketplace-hero-copy { align-self: center; }
  .marketplace-eyebrow { color: #37e58f; font-size: 12px; font-weight: 900; letter-spacing: .12em; margin: 0; text-transform: uppercase; }
  .marketplace-hero h1 { color: #f4fff9; font-size: clamp(34px,4vw,54px); font-weight: 900; letter-spacing: -.04em; line-height: 1.02; margin: 10px 0 0; max-width: 760px; }
  .marketplace-hero-copy > p:last-child { color: #9db3ad; font-size: 15px; line-height: 1.65; margin: 15px 0 0; max-width: 680px; }
  .marketplace-balance { background: radial-gradient(circle at 90% 10%, rgba(55,229,143,.18), transparent 36%), #0b1a17; border: 1px solid rgba(55,229,143,.38); border-radius: 16px; box-shadow: 0 18px 50px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.04); display: flex; flex-direction: column; padding: 22px; }
  .balance-label { color: #a8bdb7; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .marketplace-balance > strong { color: #f4fff9; font-size: clamp(52px,6vw,72px); font-weight: 950; letter-spacing: -.06em; line-height: .96; margin-top: 8px; }
  .balance-earned { color: #37e58f; font-size: 12px; font-weight: 800; margin-top: 8px; }
  .balance-expiry { align-items: center; background: rgba(245,166,35,.09); border: 1px solid rgba(245,166,35,.28); border-radius: 11px; display: flex; gap: 10px; margin-top: 18px; padding: 11px; }
  .expiry-alert { align-items: center; background: #f5a623; border-radius: 50%; color: #171006; display: flex; flex: 0 0 auto; font-size: 11px; font-weight: 950; height: 22px; justify-content: center; width: 22px; }
  .balance-expiry div { display: grid; gap: 2px; }
  .balance-expiry small { color: #f5a623; font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .balance-expiry b { color: #ffcf78; font-size: 11px; }
  .marketplace-category-row { align-items: center; display: flex; gap: 14px; margin: 22px 0 14px; }
  .marketplace-categories { display: flex; flex: 1; gap: 9px; min-width: 0; overflow-x: auto; padding: 2px 1px 8px; scrollbar-width: none; }
  .marketplace-categories::-webkit-scrollbar { display: none; }
  .category-pill { background: #151f1f; border: 1px solid rgba(117,143,137,.16); border-radius: 999px; color: #91a49f; cursor: pointer; flex: 0 0 auto; font-size: 12px; font-weight: 800; padding: 10px 17px; transition: background .2s ease, border-color .2s ease, color .2s ease, transform .2s ease; }
  .category-pill:hover { border-color: rgba(55,229,143,.36); color: #d8e9e4; transform: translateY(-1px); }
  .category-pill--active { background: rgba(55,229,143,.14); border-color: rgba(55,229,143,.7); color: #37e58f; box-shadow: 0 8px 22px rgba(55,229,143,.08); }
  .my-rewards-button { align-items: center; background: linear-gradient(145deg,rgba(55,229,143,.16),rgba(55,229,143,.08)); border: 1px solid rgba(55,229,143,.5); border-radius: 999px; color: #b8f9d4; cursor: pointer; display: flex; flex: 0 0 auto; font-size: 11px; font-weight: 900; gap: 8px; padding: 9px 13px; }
  .my-rewards-button span { align-items: center; background: #37e58f; border-radius: 50%; color: #04120c; display: flex; font-size: 8px; height: 19px; justify-content: center; min-width: 19px; padding: 0 4px; }
  .category-pill:focus-visible, .marketplace-image-button:focus-visible, .marketplace-redeem:focus-visible, .my-rewards-button:focus-visible { outline: 2px solid #37e58f; outline-offset: 3px; }
  .marketplace-tools { align-items: end; background: rgba(13,24,23,.7); border: 1px solid rgba(86,113,107,.2); border-radius: 13px; display: grid; gap: 12px; grid-template-columns: minmax(220px,1fr) minmax(180px,240px); margin-bottom: 20px; padding: 10px; }
  .marketplace-search,.marketplace-sort { display: grid; gap: 5px; }
  .marketplace-search > span,.marketplace-sort > span { color: #7f958f; font-size: 8px; font-weight: 900; letter-spacing: .08em; padding-left: 3px; text-transform: uppercase; }
  .marketplace-search input,.marketplace-sort select { background: #0b1716; border: 1px solid rgba(105,134,127,.28); border-radius: 9px; color: #eafff5; font: inherit; font-size: 11px; height: 42px; outline: 0; padding: 0 13px; transition: border-color .18s ease,box-shadow .18s ease; width: 100%; }
  .marketplace-search input::placeholder { color: #60736e; }
  .marketplace-search input:focus,.marketplace-sort select:focus { border-color: rgba(55,229,143,.68); box-shadow: 0 0 0 3px rgba(55,229,143,.08); }
  .marketplace-sort select { cursor: pointer; }
  .marketplace-section-heading { align-items: end; display: flex; gap: 18px; justify-content: space-between; margin: 2px 1px 18px; }
  .marketplace-section-heading div { display: grid; gap: 4px; }
  .marketplace-section-heading span { color: #37e58f; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .marketplace-section-heading h2 { color: #f4fff9; font-size: 24px; letter-spacing: -.025em; margin: 0; }
  .marketplace-section-heading > small { color: #78908a; font-size: 11px; }
  .marketplace-grid { align-items: stretch; display: grid; gap: 18px; grid-template-columns: repeat(4,minmax(0,1fr)); }
  .marketplace-card { background: linear-gradient(180deg, rgba(18,30,29,.98), rgba(9,18,18,.98)); border: 1px solid rgba(91,119,112,.24); border-radius: 17px; box-shadow: 0 17px 44px rgba(0,0,0,.22); cursor: pointer; display: flex; flex-direction: column; min-width: 0; overflow: hidden; transition: border-color .24s ease, box-shadow .24s ease, transform .24s ease; }
  .marketplace-card:hover, .marketplace-card:focus-within { border-color: rgba(55,229,143,.48); box-shadow: 0 25px 64px rgba(0,0,0,.36), 0 0 0 1px rgba(55,229,143,.07); transform: translateY(-5px); }
  .marketplace-card--selected { border-color: rgba(55,229,143,.66); }
  .marketplace-image-button { background: #12201e; border: 0; cursor: pointer; display: block; height: 190px; overflow: hidden; padding: 0; position: relative; width: 100%; }
  .marketplace-image-button img { height: 100%; object-fit: cover; transition: transform .45s ease; width: 100%; }
  .marketplace-card:hover .marketplace-image-button img { transform: scale(1.055); }
  .marketplace-image-shade { background: linear-gradient(180deg, transparent 54%, rgba(4,10,10,.52)); inset: 0; pointer-events: none; position: absolute; }
  .marketplace-badge { backdrop-filter: blur(12px); background: rgba(6,17,15,.82); border: 1px solid rgba(55,229,143,.4); border-radius: 999px; color: #37e58f; font-size: 9px; font-weight: 900; left: 12px; letter-spacing: .04em; padding: 6px 9px; position: absolute; text-transform: uppercase; top: 12px; z-index: 2; }
  .marketplace-badge--value { border-color: rgba(56,189,248,.58); color: #70d4ff; }
  .marketplace-badge--limited { border-color: rgba(245,166,35,.62); color: #ffc562; }
  .marketplace-badge--new { border-color: rgba(255,255,255,.45); color: #fff; }
  .marketplace-card-body { display: flex; flex: 1; flex-direction: column; padding: 17px; }
  .marketplace-title-group { display: grid; gap: 4px; }
  .marketplace-title-group h3 { color: #f4fff9; font-size: 17px; font-weight: 900; letter-spacing: -.015em; line-height: 1.25; margin: 0; }
  .marketplace-title-group span { color: #65a990; font-size: 10px; font-weight: 800; }
  .marketplace-card-body > p { color: #9eb1ac; flex: 1; font-size: 12px; line-height: 1.52; margin: 10px 0 15px; min-height: 37px; }
  .marketplace-price { align-items: baseline; color: #37e58f; display: flex; gap: 6px; }
  .yield-coin { align-items: center; background: rgba(55,229,143,.14); border: 1px solid rgba(55,229,143,.42); border-radius: 50%; display: flex; font-size: 10px; font-weight: 950; height: 23px; justify-content: center; width: 23px; }
  .marketplace-price strong { font-size: 27px; font-weight: 950; letter-spacing: -.04em; }
  .marketplace-price small { color: #77a795; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .marketplace-meta { border-top: 1px solid rgba(93,119,113,.18); display: grid; gap: 6px; margin-top: 12px; padding-top: 11px; }
  .marketplace-meta > span:first-child { color: #81958f; font-size: 10px; }
  .marketplace-expiry { align-items: center; color: #91a49f; display: flex; font-size: 10px; gap: 5px; }
  .marketplace-expiry--urgent { color: #ffb44f; font-weight: 800; }
  .marketplace-expiry i { align-items: center; background: rgba(245,166,35,.15); border: 1px solid rgba(245,166,35,.4); border-radius: 50%; display: flex; font-size: 8px; font-style: normal; font-weight: 950; height: 15px; justify-content: center; width: 15px; }
  .marketplace-redeem { border: 0; border-radius: 10px; font-size: 11px; font-weight: 950; height: 42px; margin-top: 14px; transition: background .18s ease, box-shadow .18s ease, transform .18s ease; width: 100%; }
  .marketplace-redeem:not(:disabled) { background: #37e58f; box-shadow: 0 12px 28px rgba(55,229,143,.14); color: #03120b; cursor: pointer; }
  .marketplace-redeem:not(:disabled):hover { background: #54f0a3; box-shadow: 0 16px 34px rgba(55,229,143,.22); transform: translateY(-1px); }
  .marketplace-redeem:disabled { background: #202d2b; color: #667a75; cursor: not-allowed; }
  .marketplace-empty { align-items: center; background: rgba(15,27,26,.72); border: 1px dashed rgba(105,134,127,.3); border-radius: 14px; display: grid; gap: 5px; justify-items: center; margin-top: 18px; padding: 42px 20px; text-align: center; }
  .marketplace-empty strong { color: #eafff5; font-size: 16px; }.marketplace-empty span { color: #81968f; font-size: 11px; }
  .marketplace-overlay { align-items: stretch; background: rgba(2,8,8,.76); backdrop-filter: blur(10px); display: flex; inset: 0; justify-content: flex-end; padding: 0; position: fixed; z-index: 1000; }
  .my-rewards-panel { background: radial-gradient(circle at 100% 0,rgba(55,229,143,.11),transparent 28%),#091514; border-left: 1px solid rgba(93,124,116,.32); box-shadow: -28px 0 80px rgba(0,0,0,.46); display: flex; flex-direction: column; max-width: 480px; overflow-y: auto; padding: 23px; width: min(92vw,480px); }
  .marketplace-modal-header { align-items: flex-start; display: flex; gap: 16px; justify-content: space-between; }
  .marketplace-modal-header span { color: #37e58f; font-size: 9px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .marketplace-modal-header h2 { color: #f4fff9; font-size: 30px; letter-spacing: -.04em; margin: 5px 0 0; }
  .marketplace-modal-header button,.reward-detail-close { background: rgba(126,153,146,.1); border: 1px solid rgba(126,153,146,.22); border-radius: 50%; color: #b9cbc6; cursor: pointer; font-size: 22px; height: 36px; line-height: 1; width: 36px; }
  .my-rewards-tabs { background: #0d1c1a; border: 1px solid rgba(93,124,116,.2); border-radius: 10px; display: grid; gap: 4px; grid-template-columns: 1fr 1fr; margin: 22px 0 16px; padding: 4px; }
  .my-rewards-tabs button { background: transparent; border: 0; border-radius: 7px; color: #7e928c; cursor: pointer; font-size: 10px; font-weight: 900; height: 36px; }.my-rewards-tabs button.active { background: rgba(55,229,143,.13); color: #37e58f; }
  .my-rewards-empty { align-content: center; display: grid; flex: 1; gap: 6px; justify-items: center; min-height: 280px; text-align: center; }.my-rewards-empty strong { color: #eafff5; font-size: 15px; }.my-rewards-empty span { color: #7d918b; font-size: 10px; }
  .my-rewards-list,.reward-history-list { display: grid; gap: 10px; }
  .owned-reward { background: linear-gradient(145deg,rgba(17,31,29,.96),rgba(9,19,18,.96)); border: 1px solid rgba(93,124,116,.23); border-radius: 13px; display: grid; gap: 12px; grid-template-columns: 105px minmax(0,1fr); overflow: hidden; padding: 9px; }
  .owned-reward > img { border-radius: 9px; height: 100%; min-height: 142px; object-fit: cover; width: 105px; }.owned-reward-copy h3 { color: #f4fff9; font-size: 14px; margin: 2px 0 8px; }.owned-reward-copy dl { display: grid; gap: 5px; margin: 0; }.owned-reward-copy dl div { align-items: center; display: flex; justify-content: space-between; }.owned-reward-copy dt { color: #728780; font-size: 8px; }.owned-reward-copy dd { color: #bdcec9; font-size: 9px; font-weight: 800; margin: 0; }.owned-reward-copy .status-unused { color: #f5b84b; }.owned-reward-copy button { background: rgba(55,229,143,.12); border: 1px solid rgba(55,229,143,.38); border-radius: 7px; color: #37e58f; cursor: pointer; font-size: 9px; font-weight: 900; margin-top: 10px; padding: 7px 9px; width: 100%; }
  .reward-history-item { align-items: center; background: rgba(14,27,25,.9); border: 1px solid rgba(93,124,116,.2); border-radius: 11px; display: flex; gap: 12px; justify-content: space-between; padding: 13px; }.reward-history-item > div { display: grid; gap: 4px; }.reward-history-item > div:last-child { text-align: right; }.reward-history-item strong { color: #eefcf6; font-size: 11px; }.reward-history-item span { color: #778d86; font-size: 8px; }.reward-history-item b { color: #37e58f; font-size: 10px; }
  .marketplace-overlay--center { align-items: center; justify-content: center; padding: 20px; }
  .reward-detail-modal { background: #091514; border: 1px solid rgba(94,126,118,.34); border-radius: 18px; box-shadow: 0 35px 100px rgba(0,0,0,.55); display: grid; grid-template-columns: minmax(280px,.92fr) minmax(330px,1.08fr); max-height: min(760px,90vh); max-width: 900px; overflow: hidden; position: relative; width: min(94vw,900px); }
  .reward-detail-close { position: absolute; right: 14px; top: 14px; z-index: 4; }.reward-detail-image { min-height: 540px; overflow: hidden; position: relative; }.reward-detail-image img { height: 100%; object-fit: cover; width: 100%; }.reward-detail-image::after { background: linear-gradient(90deg,transparent,rgba(9,21,20,.32)); content:""; inset:0; position:absolute; }.reward-detail-image .marketplace-badge { z-index: 3; }
  .reward-detail-content { align-self: center; max-height: 90vh; overflow-y: auto; padding: 34px; }.reward-detail-partner { color: #37e58f; font-size: 10px; font-weight: 900; letter-spacing: .05em; }.reward-detail-content h2 { color: #f4fff9; font-size: 32px; letter-spacing: -.035em; line-height: 1.05; margin: 7px 0 0; }.reward-detail-content > p { color: #9db1ab; font-size: 12px; line-height: 1.55; margin: 12px 0 18px; }.reward-detail-price { align-items: baseline; color: #37e58f; display: flex; gap: 7px; }.reward-detail-price strong { font-size: 36px; letter-spacing: -.045em; }.reward-detail-price small { color: #769b8d; font-size: 10px; font-weight: 900; text-transform: uppercase; }
  .reward-detail-facts { display: grid; gap: 9px; grid-template-columns: 1fr 1fr; margin: 19px 0; }.reward-detail-facts > span { background: rgba(17,30,28,.82); border: 1px solid rgba(91,119,112,.2); border-radius: 9px; display: grid; gap: 4px; padding: 10px; }.reward-detail-facts small { color: #71857f; font-size: 8px; text-transform: uppercase; }.reward-detail-facts strong { color: #d8e9e4; font-size: 10px; }
  .reward-terms { border-top: 1px solid rgba(92,120,113,.2); padding-top: 16px; }.reward-terms strong { color: #dcebe7; font-size: 10px; }.reward-terms p { color: #748983; font-size: 9px; line-height: 1.55; margin: 6px 0 0; }.reward-detail-redeem { height: 48px; margin-top: 18px; }
  @media (max-width: 1199px) { .marketplace-hero { grid-template-columns: 1fr; } .marketplace-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  @media (max-width: 640px) { .rewards-page-shell { padding: 72px 11px 108px; } .marketplace-frame { border-radius: 13px; padding: 13px; } .marketplace-hero { border-radius: 13px; padding: 18px; } .marketplace-hero h1 { font-size: 34px; } .marketplace-balance > strong { font-size: 56px; } .marketplace-category-row { align-items: stretch; flex-direction: column; } .marketplace-categories { margin-left: -13px; margin-right: -13px; padding-left: 13px; padding-right: 13px; } .my-rewards-button { align-self: flex-start; } .marketplace-tools { grid-template-columns: 1fr; } .marketplace-section-heading { align-items: start; flex-direction: column; gap: 6px; } .marketplace-grid { grid-template-columns: 1fr; } .marketplace-image-button { height: 220px; } .reward-detail-modal { display: block; max-height: 92vh; overflow-y: auto; } .reward-detail-image { height: 260px; min-height: 0; } .reward-detail-content { max-height: none; padding: 23px 18px; } .reward-detail-content h2 { font-size: 27px; } .reward-detail-facts { grid-template-columns: 1fr; } .my-rewards-panel { padding: 18px; } }
`;
