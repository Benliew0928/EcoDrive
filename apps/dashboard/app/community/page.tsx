"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Award, ChevronRight, Crown, List, Sparkles, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CockpitShell } from "../../components/cockpit-shell";
import { useDashboardStore } from "../../lib/dashboard-store";

type LeaderboardId = "overall" | "state" | "friends";
type Timeframe = "daily" | "monthly";

type Driver = {
  name: string;
  score: number;
  avatar: string;
  location: string;
  isYou?: boolean;
};

type LeaderboardOption = {
  id: LeaderboardId;
  title: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

const leaderboardOptions: LeaderboardOption[] = [
  { id: "overall", title: "Malaysia Overall", shortLabel: "Overall", description: "Top eco-drivers nationwide", icon: Trophy },
  { id: "state", title: "State Ranking", shortLabel: "State", description: "Compare drivers near you", icon: Award },
  { id: "friends", title: "Friends Circle", shortLabel: "Friends", description: "Your personal driving circle", icon: Users }
];

const states = [
  "All States", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak",
  "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan"
];

const nationwideDrivers: Driver[] = [
  driver("Aedan Loh", 128450, "Selangor", true),
  driver("Herman Rajpand", 118450, "Johor"),
  driver("Dr. Fareez", 108457, "Putrajaya"),
  driver("Brian Ng", 98750, "Kuala Lumpur"),
  driver("Sarah Lim", 87620, "Pulau Pinang"),
  driver("Marcus Tan", 76540, "Sabah"),
  driver("Daniel Wong", 65230, "Sarawak"),
  driver("Wei Hann", 54890, "Kedah"),
  driver("Alex Tang", 43210, "Melaka"),
  driver("Yi Xuan", 32880, "Perak")
];

const friendDrivers: Driver[] = [
  driver("Herman Rajpand", 128450, "Friend"),
  driver("Daniel Lim", 98750, "Friend"),
  driver("Marcus Lee", 87620, "Friend"),
  driver("Natalie Tan", 76540, "Friend"),
  driver("Alex Wong", 65230, "Friend"),
  driver("Jason Teo", 54890, "Friend"),
  driver("Wei Han", 43210, "Friend"),
  driver("Sarah Lim", 32880, "Friend")
];

export default function CommunityPage() {
  const globalScore = useDashboardStore((state) => state.globalScore);
  const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardId>("overall");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const [selectedState, setSelectedState] = useState("All States");
  const [showCompleteList, setShowCompleteList] = useState(false);

  const activeOption = leaderboardOptions.find((option) => option.id === activeLeaderboard) ?? leaderboardOptions[0];
  const entries = useMemo(() => {
    const multiplier = timeframe === "monthly" ? 12 : 1;
    let base = nationwideDrivers;

    if (activeLeaderboard === "friends") base = friendDrivers;
    if (activeLeaderboard === "state" && selectedState !== "All States") {
      base = nationwideDrivers.map((entry, index) => ({
        ...entry,
        location: selectedState,
        score: Math.max(12000, entry.score - index * 1730 - selectedState.length * 110)
      }));
    }

    return base
      .map((entry) => ({
        ...entry,
        score: (entry.isYou ? entry.score + globalScore - 24500 : entry.score) * multiplier
      }))
      .sort((a, b) => b.score - a.score);
  }, [activeLeaderboard, globalScore, selectedState, timeframe]);

  const topThree = entries.slice(0, 3);

  const selectLeaderboard = (id: LeaderboardId) => {
    setActiveLeaderboard(id);
    setShowCompleteList(false);
  };

  return (
    <CockpitShell activeMode="community">
      <main className="social-dashboard">
        <section className="social-frame" aria-labelledby="social-title">
          <header className="social-header">
            <div>
              <p>EcoDrive Social</p>
              <h1 id="social-title">Driver leaderboard</h1>
              <span>One ranking at a time, designed for a quick glance while parked.</span>
            </div>
            <div className="social-period" aria-label="Leaderboard period">
              <button className={timeframe === "daily" ? "is-active" : ""} onClick={() => setTimeframe("daily")} type="button">Daily</button>
              <button className={timeframe === "monthly" ? "is-active" : ""} onClick={() => setTimeframe("monthly")} type="button">Monthly</button>
            </div>
          </header>

          <div className="social-workspace">
            <aside className="social-selector" aria-label="Choose leaderboard">
              <div className="social-selector-label">Leaderboards</div>
              {leaderboardOptions.map((option) => {
                const Icon = option.icon;
                const active = option.id === activeLeaderboard;
                return (
                  <button
                    aria-pressed={active}
                    className={active ? "social-selector-button is-active" : "social-selector-button"}
                    key={option.id}
                    onClick={() => selectLeaderboard(option.id)}
                    type="button"
                  >
                    <span className="social-selector-icon"><Icon size={25} /></span>
                    <span><strong>{option.shortLabel}</strong><small>{option.description}</small></span>
                    <ChevronRight size={26} />
                  </button>
                );
              })}

              {activeLeaderboard === "state" ? (
                <label className="social-state-filter">
                  <span>State</span>
                  <select onChange={(event) => setSelectedState(event.target.value)} value={selectedState}>
                    {states.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
              ) : null}

              <div className="social-personal-rank">
                <span>Your position</span>
                <strong>#18</strong>
                <small>Top 8% of 2,789 drivers</small>
              </div>
            </aside>

            <section className="social-stage" aria-label={`${activeOption.title} leaderboard`}>
              {showCompleteList ? (
                <CompleteLeaderboard
                  entries={entries}
                  onBack={() => setShowCompleteList(false)}
                  subtitle={`${timeframe === "daily" ? "Today" : "This month"} · ${entries.length} drivers`}
                  title={activeOption.title}
                />
              ) : (
                <>
                  <header className="social-stage-heading">
                    <div>
                      <span>{timeframe === "daily" ? "Today’s leaders" : "Monthly leaders"}</span>
                      <h2>{activeOption.title}</h2>
                      <p>{activeOption.description}</p>
                    </div>
                    <button className="social-list-button" onClick={() => setShowCompleteList(true)} type="button">
                      <List size={19} /> Complete list
                    </button>
                  </header>

                  <Podium entries={topThree} />

                  <footer className="social-stage-footer">
                    <span><Sparkles size={17} /> You earned <strong>50 points</strong> today</span>
                    <span>Next rank is <strong>1,240 points</strong> away</span>
                  </footer>
                </>
              )}
            </section>
          </div>
        </section>
      </main>
      <style>{socialStyles}</style>
    </CockpitShell>
  );
}

function Podium({ entries }: { entries: Driver[] }) {
  const order = [1, 0, 2];
  return (
    <div className="social-podium" aria-label="Top three drivers">
      {order.map((entryIndex) => {
        const entry = entries[entryIndex];
        if (!entry) return null;
        const rank = entryIndex + 1;
        return (
          <article className={`social-podium-card social-podium-card--${rank}`} key={entry.name}>
            {rank === 1 ? <Crown className="social-crown" fill="currentColor" size={40} /> : null}
            <span className="social-rank">{rank}</span>
            <div className="social-avatar-wrap"><img alt={entry.name} src={entry.avatar} />{entry.isYou ? <i>You</i> : null}</div>
            <h3>{entry.name}</h3>
            <p>{entry.location}</p>
            <div className="social-score"><Sparkles size={19} /><strong>{entry.score.toLocaleString()}</strong><span>pts</span></div>
          </article>
        );
      })}
    </div>
  );
}

function CompleteLeaderboard({ entries, onBack, subtitle, title }: { entries: Driver[]; onBack: () => void; subtitle: string; title: string }) {
  return (
    <div className="social-complete-list">
      <header>
        <button onClick={onBack} type="button"><ArrowLeft size={19} /> Podium</button>
        <div><span>Complete leaderboard</span><h2>{title}</h2><p>{subtitle}</p></div>
      </header>
      <div className="social-list-columns" aria-hidden="true"><span>Rank</span><span>Driver</span><span>Region</span><span>Points</span></div>
      <div className="social-list-scroll">
        {entries.map((entry, index) => (
          <article className={entry.isYou ? "social-list-row is-you" : "social-list-row"} key={`${entry.name}-${index}`}>
            <span className="social-list-rank">{index + 1}</span>
            <div className="social-list-driver"><img alt="" src={entry.avatar} /><span><strong>{entry.name}</strong><small>{entry.isYou ? "Your profile" : "EcoDrive member"}</small></span></div>
            <span className="social-list-location">{entry.location}</span>
            <strong className="social-list-score"><Sparkles size={16} />{entry.score.toLocaleString()}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

function driver(name: string, score: number, location: string, isYou = false): Driver {
  return {
    name,
    score,
    location,
    isYou,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.replace(/\s+/g, ""))}`
  };
}

const socialStyles = `
  .social-dashboard{box-sizing:border-box;height:100dvh;overflow:hidden;padding:70px 10px 76px;background:radial-gradient(circle at 76% 24%,rgba(55,229,143,.08),transparent 30%),#06100f;color:#f4fff9}
  .social-frame{display:flex;flex-direction:column;height:100%;margin:0 auto;min-height:0;width:100%}
  .social-header{align-items:center;display:flex;justify-content:space-between;gap:14px;margin-bottom:6px;flex:0 0 auto;padding:0 5px}
  .social-header p,.social-stage-heading span,.social-complete-list header span{color:#37e58f;font-size:10px;font-weight:900;letter-spacing:.12em;margin:0;text-transform:uppercase}
  .social-header h1{font-size:clamp(28px,3.1vw,42px);letter-spacing:-.04em;line-height:1;margin:4px 0 5px}
  .social-header>div>span{color:#829a93;font-size:11px}
  .social-period{background:#0b1716;border:1px solid rgba(99,130,122,.25);border-radius:12px;display:flex;padding:4px}
  .social-period button{background:transparent;border:0;border-radius:9px;color:#8ba19b;cursor:pointer;font-size:13px;font-weight:900;min-height:44px;min-width:104px;padding:0 18px;text-transform:uppercase}
  .social-period button.is-active{background:rgba(55,229,143,.14);box-shadow:inset 0 0 0 1px rgba(55,229,143,.36);color:#37e58f}
  .social-workspace{display:grid;flex:1;gap:8px;grid-template-columns:minmax(205px,238px) minmax(0,1fr);min-height:0}
  .social-selector,.social-stage{background:linear-gradient(145deg,rgba(12,25,23,.96),rgba(6,15,14,.98));border:1px solid rgba(91,121,113,.25);border-radius:18px;min-height:0}
  .social-selector{display:flex;flex-direction:column;gap:6px;padding:8px}
  .social-selector-label{color:#6f8981;font-size:16px;font-weight:900;letter-spacing:.12em;padding:1px 4px 4px;text-transform:uppercase}
  .social-selector-button{align-items:center;background:rgba(255,255,255,.02);border:1px solid rgba(118,145,138,.13);border-radius:13px;color:#92a7a1;cursor:pointer;display:grid;gap:12px;grid-template-columns:52px 1fr auto;min-height:84px;padding:12px 16px;text-align:left;transition:.2s ease}
  .social-selector-button:hover{border-color:rgba(55,229,143,.36);color:#eafff5}
  .social-selector-button.is-active{background:linear-gradient(115deg,rgba(55,229,143,.16),rgba(55,229,143,.04));border-color:rgba(55,229,143,.55);box-shadow:0 10px 24px rgba(0,0,0,.2);color:#37e58f}
  .social-selector-icon{align-items:center;background:rgba(255,255,255,.04);border-radius:10px;display:flex;height:52px;justify-content:center;width:52px}
  .social-selector-button.is-active .social-selector-icon{background:rgba(55,229,143,.14)}
  .social-selector-button span:nth-child(2){display:grid;gap:4px;min-width:0}.social-selector-button strong{color:#f0fff7;font-size:22px}.social-selector-button small{font-size:14px;line-height:1.25;color:#c0d3ce}
  .social-state-filter{display:grid;gap:4px;padding:2px}.social-state-filter span{color:#78918a;font-size:8px;font-weight:900;text-transform:uppercase}.social-state-filter select{background:#081312;border:1px solid rgba(55,229,143,.25);border-radius:9px;color:#eafff5;height:36px;padding:0 9px;width:100%}
  .social-personal-rank{background:linear-gradient(135deg,rgba(245,184,75,.1),rgba(245,184,75,.025));border:1px solid rgba(245,184,75,.22);border-radius:13px;display:grid;gap:4px;margin-top:auto;padding:16px 20px}.social-personal-rank span{color:#c7ad72;font-size:14px;font-weight:900;text-transform:uppercase}.social-personal-rank strong{color:#f5b84b;font-size:42px;line-height:1}.social-personal-rank small{color:#b3ab96;font-size:14px}
  .social-stage{display:flex;flex-direction:column;overflow:hidden;padding:9px 12px}
  .social-stage-heading{align-items:center;display:flex;justify-content:space-between;gap:16px}.social-stage-heading h2,.social-complete-list h2{font-size:23px;letter-spacing:-.02em;margin:2px 0}.social-stage-heading p,.social-complete-list p{color:#7e938d;font-size:10px;margin:0}
  .social-list-button,.social-complete-list header>button{align-items:center;background:rgba(55,229,143,.12);border:1px solid rgba(55,229,143,.45);border-radius:10px;color:#eafff5;cursor:pointer;display:flex;font-size:11px;font-weight:900;gap:7px;min-height:42px;padding:0 15px}
  .social-podium{align-items:flex-end;display:flex;flex:1;gap:8px;justify-content:center;min-height:0;padding:8px 1% 3px}
  .social-podium-card{align-items:center;background:linear-gradient(180deg,rgba(22,37,35,.9),rgba(7,16,15,.98));border:1px solid rgba(123,150,143,.22);border-radius:17px;box-sizing:border-box;display:flex;flex-direction:column;height:78%;justify-content:center;max-width:330px;min-height:205px;padding:10px;position:relative;text-align:center;width:32%}
  .social-podium-card--1{background:linear-gradient(180deg,rgba(245,184,75,.14),rgba(9,18,17,.98) 62%);border-color:rgba(245,184,75,.55);box-shadow:0 18px 45px rgba(0,0,0,.35),0 0 35px rgba(245,184,75,.08);height:100%;order:2}
  .social-podium-card--2{order:1}.social-podium-card--3{height:72%;order:3}
  .social-crown{color:#f8c651;filter:drop-shadow(0 5px 8px rgba(245,184,75,.28));position:absolute;top:-24px}
  .social-rank{align-items:center;background:#b8c2ca;border:4px solid #0b1716;border-radius:50%;color:#07110f;display:flex;font-size:16px;font-weight:950;height:36px;justify-content:center;position:absolute;right:12px;top:12px;width:36px}.social-podium-card--1 .social-rank{background:#f7c653}.social-podium-card--3 .social-rank{background:#c77a39;color:#fff}
  .social-avatar-wrap{align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:50%;display:flex;height:92px;justify-content:center;margin-bottom:5px;position:relative;width:92px}.social-podium-card--1 .social-avatar-wrap{height:126px;width:126px}.social-avatar-wrap img{height:88%;width:88%}.social-avatar-wrap i{background:#37e58f;border-radius:999px;bottom:-2px;color:#06110c;font-size:8px;font-style:normal;font-weight:950;padding:3px 8px;position:absolute}
  .social-podium-card h3{font-size:clamp(14px,1.5vw,21px);margin:4px 0 1px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.social-podium-card--1 h3{color:#ffd675}.social-podium-card p{color:#859991;font-size:10px;margin:0 0 10px}
  .social-score{align-items:center;color:#37e58f;display:flex;gap:5px}.social-score strong{font-size:clamp(18px,2vw,27px)}.social-score span{color:#6f8880;font-size:8px;font-weight:900;text-transform:uppercase}
  .social-stage-footer{align-items:center;border-top:1px solid rgba(92,119,112,.18);color:#82968f;display:flex;font-size:9px;justify-content:space-between;min-height:27px;padding-top:4px}.social-stage-footer span{align-items:center;display:flex;gap:5px}.social-stage-footer strong{color:#eafff5}
  .social-complete-list{display:flex;flex-direction:column;height:100%;min-height:0}.social-complete-list header{align-items:center;border-bottom:1px solid rgba(91,120,112,.18);display:flex;gap:16px;padding-bottom:10px}.social-complete-list header>button{background:rgba(255,255,255,.04);border-color:rgba(129,153,147,.25)}
  .social-list-columns,.social-list-row{align-items:center;display:grid;grid-template-columns:70px minmax(240px,1.4fr) minmax(130px,1fr) minmax(130px,.7fr)}
  .social-list-columns{color:#668079;font-size:8px;font-weight:900;letter-spacing:.1em;padding:9px 14px 5px;text-transform:uppercase}.social-list-columns span:last-child{text-align:right}
  .social-list-scroll{display:grid;gap:5px;min-height:0;overflow-y:auto;padding-right:4px}.social-list-row{background:rgba(255,255,255,.025);border:1px solid rgba(108,135,128,.12);border-radius:11px;min-height:50px;padding:4px 14px}.social-list-row.is-you{background:rgba(55,229,143,.09);border-color:rgba(55,229,143,.42)}
  .social-list-rank{color:#c4d0cc;font-size:16px;font-weight:950}.social-list-driver{align-items:center;display:flex;gap:10px}.social-list-driver img{background:#142421;border-radius:50%;height:38px;width:38px}.social-list-driver>span{display:grid}.social-list-driver strong{font-size:12px}.social-list-driver small,.social-list-location{color:#789089;font-size:9px}.social-list-score{align-items:center;color:#37e58f;display:flex;font-size:15px;gap:5px;justify-content:flex-end}
  @media(max-width:900px){.social-dashboard{padding-left:10px;padding-right:10px}.social-workspace{grid-template-columns:190px 1fr}.social-selector-button{grid-template-columns:36px 1fr;min-height:58px}.social-selector-button>svg{display:none}.social-selector-icon{height:34px;width:34px}.social-podium{gap:8px;padding-left:0;padding-right:0}.social-podium-card{padding:10px}.social-podium-card--1 .social-avatar-wrap{height:88px;width:88px}.social-avatar-wrap{height:65px;width:65px}}
  @media(max-width:680px){.social-dashboard{padding:68px 7px 74px}.social-header>div>span{display:none}.social-header h1{font-size:24px}.social-period button{min-height:36px;min-width:72px;padding:0 8px}.social-workspace{display:flex;flex-direction:column}.social-selector{display:grid;grid-template-columns:repeat(3,1fr);padding:6px}.social-selector-label,.social-personal-rank,.social-state-filter{display:none}.social-selector-button{display:flex;justify-content:center;min-height:45px;padding:5px}.social-selector-button span:nth-child(2) small,.social-selector-button>svg{display:none}.social-selector-icon{height:30px;width:30px}.social-stage{flex:1;padding:9px}.social-stage-heading p{display:none}.social-stage-heading h2{font-size:18px}.social-list-button{min-height:36px;padding:0 9px}.social-podium-card{border-radius:12px;min-height:150px;width:32%}.social-podium-card--1 .social-avatar-wrap{height:72px;width:72px}.social-avatar-wrap{height:52px;width:52px}.social-stage-footer span:last-child{display:none}.social-list-columns,.social-list-row{grid-template-columns:40px minmax(150px,1fr) minmax(100px,.6fr)}.social-list-columns span:nth-child(3),.social-list-location{display:none}}
`;
