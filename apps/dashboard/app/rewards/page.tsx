"use client";

import { useMemo, useState } from "react";

import { CockpitShell } from "../../components/cockpit-shell";

type RewardCategory = "Food & Drinks" | "EV Benefits" | "Shopping" | "Eco Impact";
type CategoryFilter = "All" | RewardCategory;

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

  const qrCells = useMemo(() => {
    const seed = selectedReward.id.length + selectedReward.cost;
    return Array.from(
      { length: 81 },
      (_, index) => index % 10 === 0 || (index + seed) % 4 === 0 || (index * seed) % 17 === 0
    );
  }, [selectedReward]);

  const visibleRewards = activeCategory === "All"
    ? rewards
    : rewards.filter((reward) => reward.category === activeCategory);

  function redeemReward(reward: Reward) {
    if (yieldCoins < reward.cost) return;
    setYieldCoins((coins) => coins - reward.cost);
    setSelectedReward(reward);
    setRedeemedReward(reward);
  }

  void redeemedReward;
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

            <div className="marketplace-balance" aria-label="Available Yield Coins">
              <span className="balance-label">Available Yield Coins</span>
              <strong>{yieldCoins.toLocaleString()}</strong>
              <span className="balance-earned">+120 earned this week</span>
              <div className="balance-expiry">
                <span className="expiry-alert" aria-hidden="true">!</span>
                <div><small>Expiring Soon</small><b>320 Points expire in 5 days</b></div>
              </div>
            </div>
          </header>

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

          <div className="marketplace-section-heading">
            <div><span>{activeCategory}</span><h2>{activeCategory === "All" ? "Explore all rewards" : `${activeCategory} rewards`}</h2></div>
            <small>{visibleRewards.length} rewards available</small>
          </div>

          <section className="marketplace-grid" aria-label="Available rewards">
            {visibleRewards.map((reward) => {
              const canRedeem = yieldCoins >= reward.cost;
              const isSelected = selectedReward.id === reward.id;

              return (
                <article className={isSelected ? "marketplace-card marketplace-card--selected" : "marketplace-card"} key={reward.id}>
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

                    <div className="marketplace-price" aria-label={`${reward.cost.toLocaleString()} Yield Coin points`}>
                      <span className="yield-coin" aria-hidden="true">Y</span>
                      <strong>{reward.cost.toLocaleString()}</strong>
                      <small>Points</small>
                    </div>

                    <div className="marketplace-meta">
                      <span>{reward.stock} remaining</span>
                      <span className={reward.expiryUrgent ? "marketplace-expiry marketplace-expiry--urgent" : "marketplace-expiry"}>
                        {reward.expiryUrgent ? <i aria-hidden="true">!</i> : null}{reward.expiry}
                      </span>
                    </div>

                    <button className="marketplace-redeem" disabled={!canRedeem} onClick={() => redeemReward(reward)} type="button">
                      {canRedeem ? "Redeem now" : "Not enough points"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      </main>

      <style>{styleSheet}</style>
    </CockpitShell>
  );
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
  .marketplace-categories { display: flex; gap: 9px; margin: 22px 0; overflow-x: auto; padding: 2px 1px 8px; scrollbar-width: none; }
  .marketplace-categories::-webkit-scrollbar { display: none; }
  .category-pill { background: #151f1f; border: 1px solid rgba(117,143,137,.16); border-radius: 999px; color: #91a49f; cursor: pointer; flex: 0 0 auto; font-size: 12px; font-weight: 800; padding: 10px 17px; transition: background .2s ease, border-color .2s ease, color .2s ease, transform .2s ease; }
  .category-pill:hover { border-color: rgba(55,229,143,.36); color: #d8e9e4; transform: translateY(-1px); }
  .category-pill--active { background: rgba(55,229,143,.14); border-color: rgba(55,229,143,.7); color: #37e58f; box-shadow: 0 8px 22px rgba(55,229,143,.08); }
  .category-pill:focus-visible, .marketplace-image-button:focus-visible, .marketplace-redeem:focus-visible { outline: 2px solid #37e58f; outline-offset: 3px; }
  .marketplace-section-heading { align-items: end; display: flex; gap: 18px; justify-content: space-between; margin: 2px 1px 18px; }
  .marketplace-section-heading div { display: grid; gap: 4px; }
  .marketplace-section-heading span { color: #37e58f; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .marketplace-section-heading h2 { color: #f4fff9; font-size: 24px; letter-spacing: -.025em; margin: 0; }
  .marketplace-section-heading > small { color: #78908a; font-size: 11px; }
  .marketplace-grid { align-items: stretch; display: grid; gap: 18px; grid-template-columns: repeat(4,minmax(0,1fr)); }
  .marketplace-card { background: linear-gradient(180deg, rgba(18,30,29,.98), rgba(9,18,18,.98)); border: 1px solid rgba(91,119,112,.24); border-radius: 17px; box-shadow: 0 17px 44px rgba(0,0,0,.22); display: flex; flex-direction: column; min-width: 0; overflow: hidden; transition: border-color .24s ease, box-shadow .24s ease, transform .24s ease; }
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
  @media (max-width: 1199px) { .marketplace-hero { grid-template-columns: 1fr; } .marketplace-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  @media (max-width: 640px) { .rewards-page-shell { padding: 72px 11px 108px; } .marketplace-frame { border-radius: 13px; padding: 13px; } .marketplace-hero { border-radius: 13px; padding: 18px; } .marketplace-hero h1 { font-size: 34px; } .marketplace-balance > strong { font-size: 56px; } .marketplace-categories { margin-left: -13px; margin-right: -13px; padding-left: 13px; padding-right: 13px; } .marketplace-section-heading { align-items: start; flex-direction: column; gap: 6px; } .marketplace-grid { grid-template-columns: 1fr; } .marketplace-image-button { height: 220px; } }
`;
