"use client";

import { useMemo, useState } from "react";
import { Coffee, Leaf, ParkingCircle, QrCode, Shirt, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CockpitShell } from "../../components/cockpit-shell";

type Reward = {
  id: string;
  title: string;
  partner: string;
  description: string;
  cost: number;
  stock: number;
  badge: "Popular" | "Best Value" | "Limited" | "New";
  icon: LucideIcon;
};

const rewards: Reward[] = [
  {
    id: "coffee",
    title: "Free Campus Coffee",
    partner: "UTAR Cafe",
    description: "Instant QR voucher for one coffee after converting Yield Coins.",
    cost: 500,
    stock: 18,
    badge: "Popular",
    icon: Coffee
  },
  {
    id: "charging",
    title: "EV Charging Credit",
    partner: "GreenCharge Bay",
    description: "Demo charging credit for drivers who keep eco-driving consistently.",
    cost: 900,
    stock: 9,
    badge: "Best Value",
    icon: Zap
  },
  {
    id: "parking",
    title: "Reserved EV Parking",
    partner: "Campus Mobility",
    description: "Reserve a preferred EV parking bay for one day.",
    cost: 1200,
    stock: 6,
    badge: "New",
    icon: ParkingCircle
  },
  {
    id: "merch",
    title: "Green Merch T-Shirt",
    partner: "UTAR Sustainability",
    description: "Limited EcoDrive+ reward for long-term sustainable drivers.",
    cost: 3500,
    stock: 3,
    badge: "Limited",
    icon: Shirt
  }
];

export default function RewardsPage() {
  const [yieldCoins, setYieldCoins] = useState(1250);
  const [selectedReward, setSelectedReward] = useState(rewards[0]);
  const [redeemedReward, setRedeemedReward] = useState<Reward | null>(null);

  const qrCells = useMemo(() => {
    const seed = selectedReward.id.length + selectedReward.cost;
    return Array.from(
      { length: 81 },
      (_, index) => index % 10 === 0 || (index + seed) % 4 === 0 || (index * seed) % 17 === 0
    );
  }, [selectedReward]);

  function redeemReward(reward: Reward) {
    if (yieldCoins < reward.cost) return;
    setYieldCoins((coins) => coins - reward.cost);
    setSelectedReward(reward);
    setRedeemedReward(reward);
  }

  return (
    <CockpitShell activeMode="rewards">
      <main className="rewards-page-shell">
        <section className="rewards-dashboard-frame" aria-labelledby="rewards-title">
          <header className="rewards-hero">
            <div className="rewards-hero-copy">
              <p className="rewards-eyebrow">Rewards Marketplace</p>
              <h1 id="rewards-title">Exchange Yield Coins for real rewards</h1>
              <p>
                Eco-City assets generate Yield Coins every day. Drivers can redeem those coins for partner rewards like campus coffee, EV parking, and charging credit.
              </p>
            </div>

            <div className="rewards-balance-card" aria-label="Available Yield Coins">
              <span>Available Yield Coins</span>
              <strong>{yieldCoins.toLocaleString()}</strong>
              <small>+86 daily yield from Eco-City</small>
            </div>
          </header>

          <div className="rewards-content-grid">
            <section className="reward-grid" aria-label="Available rewards">
              {rewards.map((reward) => {
                const Icon = reward.icon;
                const canRedeem = yieldCoins >= reward.cost;
                const isSelected = selectedReward.id === reward.id;

                return (
                  <article className={isSelected ? "reward-card reward-card--selected" : "reward-card"} key={reward.id}>
                    <button className="reward-select" onClick={() => setSelectedReward(reward)} type="button">
                      <span className="reward-icon" aria-hidden="true">
                        <Icon size={24} />
                      </span>
                      <span className="reward-title-group">
                        <span className="reward-card-topline">
                          <strong>{reward.title}</strong>
                          <span className={badgeClassName(reward.badge)}>{reward.badge}</span>
                        </span>
                        <small>{reward.partner}</small>
                      </span>
                    </button>

                    <p>{reward.description}</p>

                    <div className="reward-meta">
                      <span>{reward.cost.toLocaleString()} coins</span>
                      <small>{reward.stock} left</small>
                    </div>

                    <button className="redeem-button" disabled={!canRedeem} onClick={() => redeemReward(reward)} type="button">
                      {canRedeem ? "Redeem Reward" : "Not Enough Coins"}
                    </button>
                  </article>
                );
              })}
            </section>

            <aside className="voucher-panel" aria-label="QR voucher preview">
              <div className="voucher-heading">
                <span className="voucher-icon" aria-hidden="true">
                  <QrCode size={22} />
                </span>
                <div>
                  <p>Demo QR Voucher</p>
                  <strong>{redeemedReward ? redeemedReward.title : selectedReward.title}</strong>
                </div>
              </div>

              <div className="qr-card" aria-label="Demo QR voucher code">
                {qrCells.map((isDark, index) => (
                  <span className={isDark ? "qr-cell qr-cell--dark" : "qr-cell"} key={index} />
                ))}
              </div>

              <div className="voucher-status-card">
                <span>{redeemedReward ? "Ready for scan" : "Preview mode"}</span>
                <p>
                  {redeemedReward
                    ? "Voucher generated. Show this QR code at the partner counter during the demo."
                    : "Select and redeem a reward to generate a QR voucher for judges."}
                </p>
                <strong>{redeemedReward ? "ECO-QR-2749" : selectedReward.partner}</strong>
              </div>

              <div className="voucher-proof">
                <Leaf size={16} aria-hidden="true" />
                <span>Proof that Eco-City yield can become a real-world reward.</span>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

function badgeClassName(badge: Reward["badge"]) {
  if (badge === "Best Value") return "reward-badge reward-badge--best-value";
  if (badge === "Limited") return "reward-badge reward-badge--limited";
  if (badge === "New") return "reward-badge reward-badge--new";
  return "reward-badge";
}

const styleSheet = "" +
  ".cockpit-shell--cyan .vehicle-dock .mode-chip--active { background: rgba(55, 229, 143, 0.18); border-color: rgba(55, 229, 143, 0.78); box-shadow: 0 0 0 1px rgba(55, 229, 143, 0.14), 0 16px 36px rgba(55, 229, 143, 0.1); color: #37e58f; }" +
  ".rewards-page-shell { min-height: 100vh; padding: 88px 28px 100px; }" +
  ".rewards-dashboard-frame { background: linear-gradient(135deg, rgba(14, 23, 23, 0.94), rgba(7, 14, 15, 0.98)), radial-gradient(circle at 82% 0%, rgba(55, 229, 143, 0.12), transparent 32%); border: 1px solid rgba(38, 59, 58, 0.82); border-radius: 8px; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.04); display: flex; flex-direction: column; gap: 22px; margin: 0 auto; max-width: 1180px; padding: 22px; }" +
  ".rewards-hero { align-items: stretch; background: rgba(10, 18, 19, 0.74); border: 1px solid rgba(38, 59, 58, 0.78); border-radius: 8px; display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr) minmax(240px, 310px); padding: 22px; }" +
  ".rewards-eyebrow, .voucher-heading p { color: #37e58f; font-size: 12px; font-weight: 800; letter-spacing: 0; margin: 0; text-transform: uppercase; }" +
  ".rewards-hero h1 { color: #f5fffa; font-size: 36px; font-weight: 900; line-height: 1; margin: 8px 0 0; max-width: 720px; }" +
  ".rewards-hero p:not(.rewards-eyebrow) { color: #9fb5b0; font-size: 14px; line-height: 1.6; margin: 14px 0 0; max-width: 720px; }" +
  ".rewards-balance-card { background: linear-gradient(180deg, rgba(55, 229, 143, 0.14), rgba(55, 229, 143, 0.05)), #0e1717; border: 1px solid rgba(55, 229, 143, 0.38); border-radius: 8px; box-shadow: 0 18px 44px rgba(55, 229, 143, 0.08); display: grid; gap: 8px; padding: 18px; }" +
  ".rewards-balance-card span, .rewards-balance-card small { color: #8ea5a0; font-size: 12px; font-weight: 800; text-transform: uppercase; }" +
  ".rewards-balance-card strong { color: #37e58f; font-size: 48px; font-weight: 900; line-height: 0.95; }" +
  ".rewards-balance-card small { font-weight: 600; text-transform: none; }" +
  ".rewards-content-grid { display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr) minmax(300px, 350px); }" +
  ".reward-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }" +
  ".reward-card, .voucher-panel { background: rgba(10, 18, 19, 0.78); border: 1px solid rgba(38, 59, 58, 0.78); border-radius: 8px; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16); }" +
  ".reward-card { display: flex; flex-direction: column; gap: 16px; min-height: 250px; padding: 18px; transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease; }" +
  ".reward-card:hover, .reward-card:focus-within { background: rgba(14, 23, 23, 0.92); border-color: rgba(55, 229, 143, 0.44); box-shadow: 0 22px 58px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(55, 229, 143, 0.08); transform: translateY(-2px); }" +
  ".reward-card--selected { border-color: rgba(55, 229, 143, 0.72); box-shadow: 0 22px 58px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(55, 229, 143, 0.12); }" +
  ".reward-select { align-items: flex-start; background: transparent; border: 0; color: #f5fffa; cursor: pointer; display: flex; gap: 14px; padding: 0; text-align: left; width: 100%; }" +
  ".reward-select:focus-visible, .redeem-button:focus-visible { outline: 2px solid #37e58f; outline-offset: 3px; }" +
  ".reward-icon, .voucher-icon { align-items: center; background: #101a1a; border: 1px solid rgba(38, 59, 58, 0.78); border-radius: 8px; color: #37e58f; display: inline-flex; flex-shrink: 0; justify-content: center; }" +
  ".reward-icon { height: 54px; width: 54px; } .voucher-icon { height: 42px; width: 42px; }" +
  ".reward-title-group { display: grid; gap: 6px; min-width: 0; width: 100%; }" +
  ".reward-card-topline { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; }" +
  ".reward-card-topline strong { color: #f5fffa; font-size: 17px; font-weight: 900; line-height: 1.25; }" +
  ".reward-title-group small, .reward-meta small { color: #8ea5a0; font-size: 13px; }" +
  ".reward-badge { border: 1px solid rgba(55, 229, 143, 0.32); border-radius: 999px; color: #37e58f; flex-shrink: 0; font-size: 11px; font-weight: 800; line-height: 1; padding: 5px 8px; white-space: nowrap; }" +
  ".reward-badge--best-value { border-color: rgba(56, 189, 248, 0.38); color: #38bdf8; } .reward-badge--limited { border-color: rgba(245, 184, 75, 0.4); color: #f5b84b; } .reward-badge--new { border-color: rgba(255, 255, 255, 0.24); color: #f5fffa; }" +
  ".reward-card p { color: #b7c8c3; flex: 1; font-size: 14px; line-height: 1.55; margin: 0; }" +
  ".reward-meta { align-items: center; border-top: 1px solid rgba(38, 59, 58, 0.78); display: flex; font-size: 13px; gap: 12px; justify-content: space-between; padding-top: 14px; }" +
  ".reward-meta span { color: #37e58f; font-weight: 900; }" +
  ".redeem-button { border: 0; border-radius: 6px; font-size: 13px; font-weight: 900; height: 44px; padding: 0 14px; transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease; }" +
  ".redeem-button:not(:disabled) { background: #37e58f; box-shadow: 0 14px 34px rgba(55, 229, 143, 0.16); color: #04100b; cursor: pointer; } .redeem-button:not(:disabled):hover { background: #54f0a3; transform: translateY(-1px); } .redeem-button:disabled { background: #263b3a; color: #8ea5a0; cursor: not-allowed; }" +
  ".voucher-panel { align-self: start; display: grid; gap: 18px; padding: 20px; }" +
  ".voucher-heading { align-items: center; display: flex; gap: 12px; } .voucher-heading strong { color: #f5fffa; display: block; font-size: 18px; line-height: 1.2; margin-top: 4px; }" +
  ".qr-card { aspect-ratio: 1; background: #f5fffa; border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(5, 9, 9, 0.08), 0 16px 42px rgba(0, 0, 0, 0.18); display: grid; gap: 4px; grid-template-columns: repeat(9, 1fr); padding: 18px; }" +
  ".qr-cell { background: #f5fffa; border-radius: 2px; } .qr-cell--dark { background: #050909; }" +
  ".voucher-status-card, .voucher-proof { background: #0e1717; border: 1px solid rgba(38, 59, 58, 0.78); border-radius: 8px; }" +
  ".voucher-status-card { display: grid; gap: 8px; padding: 16px; } .voucher-status-card span { color: #37e58f; font-size: 12px; font-weight: 900; text-transform: uppercase; } .voucher-status-card p { color: #b7c8c3; font-size: 14px; line-height: 1.55; margin: 0; } .voucher-status-card strong { color: #37e58f; font-size: 14px; }" +
  ".voucher-proof { align-items: center; color: #8ea5a0; display: flex; font-size: 13px; gap: 8px; padding: 12px; } .voucher-proof svg { color: #37e58f; flex-shrink: 0; }" +
  "@media (max-width: 1100px) { .rewards-content-grid, .rewards-hero { grid-template-columns: 1fr; } .voucher-panel { align-self: stretch; } }" +
  "@media (max-width: 760px) { .rewards-page-shell { padding: 72px 12px 110px; } .rewards-dashboard-frame, .rewards-hero, .voucher-panel, .reward-card { padding: 16px; } .reward-grid { grid-template-columns: 1fr; } .rewards-hero h1 { font-size: 30px; } .rewards-balance-card strong { font-size: 40px; } .reward-card-topline { display: grid; } }";
