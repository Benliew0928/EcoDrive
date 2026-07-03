"use client";

import { useMemo, useState } from "react";
import { Gauge, RadioTower, Crown, Trophy, Gem, Users, Award, ChevronDown } from "lucide-react";
import { CockpitShell } from "./cockpit-shell";
import { cockpitModes, type ModeId } from "../data/cockpit-content";
import { eventLabel, hardwareFeedbackForTelemetry } from "../lib/dashboard-data";
import { useDashboardStore } from "../lib/dashboard-store";
import type { ProcessedTelemetry } from "../types/dashboard";
import { EcoRouteMap } from "./eco-route-map";
import { CitySurface } from "./city/city-surface";

type CockpitScreenProps = {
  mode: ModeId;
};

export function CockpitScreen({ mode }: CockpitScreenProps) {
  const screen = cockpitModes[mode];
  const telemetry = useDashboardStore((state) => state.telemetry);
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const isLive = connectionStatus === "live" && Boolean(telemetry);
  const packetLabel = mode === "city" ? "Builder active" : isLive ? "Live packet" : "Awaiting simulator";

  return (
    <CockpitShell activeMode={mode}>
      <main className={`cockpit-main cockpit-main--${mode}`}>
        <section className="primary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{screen.label}</p>
              <h1>{screen.headline}</h1>
            </div>
            <span className={`auto-eco-pill ${isLive || mode === "city" ? "auto-eco-pill--live" : ""}`}>
              {packetLabel}
            </span>
          </div>
          <ModeVisual mode={mode} telemetry={telemetry} />
        </section>
      </main>
    </CockpitShell>
  );
}

function ModeVisual({ mode, telemetry }: { mode: ModeId; telemetry: ProcessedTelemetry | null }) {
  if (mode === "route") return <RouteSurface telemetry={telemetry} />;
  if (mode === "city") return <CitySurface />;
  if (mode === "rewards") return <RewardsSurface />;
  if (mode === "community") return <CommunitySurface />;
  return <DriveSurface telemetry={telemetry} />;
}

const stateFlags: Record<string, string> = {
  "Johor": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Flag_of_Johor.svg",
  "Kedah": "https://upload.wikimedia.org/wikipedia/commons/c/cc/Flag_of_Kedah.svg",
  "Kelantan": "https://upload.wikimedia.org/wikipedia/commons/7/73/Flag_of_Kelantan.svg",
  "Melaka": "https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_Malacca.svg",
  "Negeri Sembilan": "https://upload.wikimedia.org/wikipedia/commons/d/db/Flag_of_Negeri_Sembilan.svg",
  "Pahang": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Pahang.svg",
  "Perak": "https://upload.wikimedia.org/wikipedia/commons/8/87/Flag_of_Perak.svg",
  "Perlis": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Flag_of_Perlis.svg",
  "Pulau Pinang": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Flag_of_Penang_%28Malaysia%29.svg",
  "Sabah": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Flag_of_Sabah.svg",
  "Sarawak": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Flag_of_Sarawak.svg",
  "Selangor": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Flag_of_Selangor.svg",
  "Terengganu": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Flag_of_Terengganu.svg",
  "Kuala Lumpur": "https://upload.wikimedia.org/wikipedia/commons/6/64/Flag_of_Kuala_Lumpur.svg",
  "Putrajaya": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Flag_of_Putrajaya.svg",
  "Labuan": "https://upload.wikimedia.org/wikipedia/commons/b/be/Flag_of_Labuan.svg"
};

function get2DCartoonAvatar(name: string) {
  const seed = encodeURIComponent(name.replace(/\s+/g, ''));
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
}

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

// Deterministic state leaderboard generator based on state name
function getPlayersForState(stateName: string, globalScore: number, timeframe: "daily" | "monthly") {
  const userScore = globalScore - 24500 + 128450;
  const multiplier = timeframe === "daily" ? 1 : 12;

  const allPlayers = [
    { name: "Aedan Loh", score: userScore * multiplier, avatar: get2DCartoonAvatar("Aedan Loh"), state: "Selangor", flag: stateFlags["Selangor"], isReal: true },
    { name: "Herman Rajpand", score: 118450 * multiplier, avatar: get2DCartoonAvatar("Herman Rajpand"), state: "Johor", flag: stateFlags["Johor"], isReal: false },
    { name: "Brian Ng", score: 98750 * multiplier, avatar: get2DCartoonAvatar("Brian Ng"), state: "Kuala Lumpur", flag: stateFlags["Kuala Lumpur"], isReal: false },
    { name: "Sarah Lim", score: 87620 * multiplier, avatar: get2DCartoonAvatar("Sarah Lim"), state: "Pulau Pinang", flag: stateFlags["Pulau Pinang"], isReal: false },
    { name: "Marcus Tan", score: 76540 * multiplier, avatar: get2DCartoonAvatar("Marcus Tan"), state: "Sabah", flag: stateFlags["Sabah"], isReal: false },
    { name: "Daniel Wong", score: 65230 * multiplier, avatar: get2DCartoonAvatar("Daniel Wong"), state: "Sarawak", flag: stateFlags["Sarawak"], isReal: false },
    { name: "Wei Hann", score: 54890 * multiplier, avatar: get2DCartoonAvatar("Wei Hann"), state: "Kedah", flag: stateFlags["Kedah"], isReal: false },
    { name: "Alex Tang", score: 43210 * multiplier, avatar: get2DCartoonAvatar("Alex Tang"), state: "Melaka", flag: stateFlags["Melaka"], isReal: false },
    { name: "Ethan Low", score: 32880 * multiplier, avatar: get2DCartoonAvatar("Ethan Low"), state: "Pahang", flag: stateFlags["Pahang"], isReal: false },
    { name: "Yi Xuan", score: 18340 * multiplier, avatar: get2DCartoonAvatar("Yi Xuan"), state: "Perak", flag: stateFlags["Perak"], isReal: false }
  ];

  if (stateName === "All States") {
    return allPlayers.sort((a, b) => b.score - a.score);
  }

  if (stateName === "Selangor") {
    return [
      { name: "Aedan Loh", score: userScore * multiplier, avatar: get2DCartoonAvatar("Aedan Loh"), state: "Selangor", flag: stateFlags["Selangor"], isReal: true },
      { name: "Brian Ng", score: 98750 * multiplier, avatar: get2DCartoonAvatar("Brian Ng"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Sarah Lim", score: 87620 * multiplier, avatar: get2DCartoonAvatar("Sarah Lim"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Marcus Tan", score: 76540 * multiplier, avatar: get2DCartoonAvatar("Marcus Tan"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Daniel Wong", score: 65230 * multiplier, avatar: get2DCartoonAvatar("Daniel Wong"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Wei Hann", score: 54890 * multiplier, avatar: get2DCartoonAvatar("Wei Hann"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Alex Tang", score: 43210 * multiplier, avatar: get2DCartoonAvatar("Alex Tang"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Ethan Low", score: 32880 * multiplier, avatar: get2DCartoonAvatar("Ethan Low"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Natalie Tee", score: 21760 * multiplier, avatar: get2DCartoonAvatar("Natalie Tee"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false },
      { name: "Yi Xuan", score: 18340 * multiplier, avatar: get2DCartoonAvatar("Yi Xuan"), state: "Selangor", flag: stateFlags["Selangor"], isReal: false }
    ].sort((a, b) => b.score - a.score);
  }

  // Generate players dynamically for other states
  const seedNames: Record<string, string[]> = {
    "Johor": ["Tan Kok Seng", "Fatimah Zahra", "Lee Jia Jun", "Subramaniam A/L Ramasamy", "Chew Su Yin"],
    "Kuala Lumpur": ["Zulhelmi Rosli", "Sophia Yeoh", "Michael Chang", "Siti Aminah", "David Raj"],
    "Kedah": ["Ahmad Faiz", "Siti Aishah", "Teoh Ban Hin", "Ramasamy Govindaraju", "Noraini Ismail"],
    "Kelantan": ["Mohd Ridzuan", "Wan Noor", "Nik Farhan", "Che Asmah", "Mohamed Azwan"],
    "Melaka": ["Heng Jee Keong", "Siti Fatimah", "Jeremy Gomez", "Nabil Fikri", "Grace Choong"],
    "Negeri Sembilan": ["Tan Siew Kian", "Azhar Ibrahim", "Logeswaran", "Rosnah Ali", "Chan Weng Keng"],
    "Pahang": ["Roslan Harun", "Wong Kam Seng", "Saraswathy", "Mohd Hafiz", "Tengku Abdullah"],
    "Perak": ["Kamalesh", "Wong Mew Choo", "Khairul Azman", "Leong Yi Fan", "Siti Zubaidah"],
    "Perlis": ["Anuar Bakar", "Ch'ng Siew Lee", "Mohd Sobri", "Halimah Saad", "Lim Kim Hock"],
    "Pulau Pinang": ["Angeline Tan", "Khoo Boon Seng", "Muthu Alagappan", "Lee Zii Jia", "Fiona Cheah"],
    "Sabah": ["Alvin Jalong", "Dayang Nur", "Roziah Ginduk", "Felix Donatus", "Cassandra Roger"],
    "Sarawak": ["Abang Faisal", "Patricia Hugo", "Jamilah Binti Bakar", "Wong Siew Ping", "Sylvester Ringgit"],
    "Terengganu": ["Mohd Syahmi", "Zaiton Salleh", "Wan Azmi", "Che Ku Rashid", "Fatmawati"],
    "Putrajaya": ["Dr. Fareez", "Norhaliza", "Tan Sri Rahman", "Adlina Yasmin", "Kuan Chee Seng"],
    "Labuan": ["Haji Ghafar", "Evelyn Francis", "Mohd Daniel", "Nurul Huda", "Wong Kok Wah"]
  };

  const names = seedNames[stateName] || ["Player A", "Player B", "Player C", "Player D", "Player E"];
  const baseScores = [118200, 95600, 82100, 69400, 56900, 42100, 31900, 22400, 18200, 14100];

  return names.map((name, index) => {
    const scoreDiff = (stateName.length * 73 + index * 199) % 800 - 400;
    return {
      name,
      score: (baseScores[index] + scoreDiff) * multiplier,
      avatar: get2DCartoonAvatar(name),
      state: stateName,
      flag: stateFlags[stateName] || stateFlags["Selangor"],
      isReal: false
    };
  }).sort((a, b) => b.score - a.score);
}

function CommunitySurface() {
  const globalScore = useDashboardStore((state) => state.globalScore);
  const [selectedState, setSelectedState] = useState("All States");
  const [timeframe, setTimeframe] = useState<"daily" | "monthly">("daily");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const states = [
    "All States", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
    "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", 
    "Putrajaya", "Labuan"
  ];

  // Overall Top 3 Podium
  const baseTop3 = [
    {
      rank: 1,
      name: "Joie Joie",
      earn: 2500,
      score: 100000,
      avatar: get2DCartoonAvatar("Joie Joie"),
      flag: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Flag_of_Johor.svg",
      stateName: "Johor"
    },
    {
      rank: 2,
      name: "Brian Ng",
      earn: 2000,
      score: 50000,
      avatar: get2DCartoonAvatar("Brian Ng"),
      flag: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Flag_of_Selangor.svg",
      stateName: "Selangor"
    },
    {
      rank: 3,
      name: "David Do",
      earn: 1500,
      score: 20000,
      avatar: get2DCartoonAvatar("David Do"),
      flag: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Flag_of_Penang_%28Malaysia%29.svg",
      stateName: "Penang"
    }
  ];

  const overallTop3 = useMemo(() => {
    const factor = timeframe === "daily" ? 1 : 12;
    return baseTop3.map(p => ({
      ...p,
      earn: p.earn * factor,
      score: p.score * factor
    }));
  }, [timeframe]);

  // Friends Leaderboard Data
  const baseFriends = [
    { name: "Herman Rajpand", score: 128450, avatar: get2DCartoonAvatar("Herman Rajpand"), isReal: false },
    { name: "Daniel Lim", score: 98750, avatar: get2DCartoonAvatar("Daniel Lim"), isReal: false },
    { name: "Marcus Lee", score: 87620, avatar: get2DCartoonAvatar("Marcus Lee"), isReal: false },
    { name: "Natalie Tan", score: 76540, avatar: get2DCartoonAvatar("Natalie Tan"), isReal: false },
    { name: "Alex Wong", score: 65230, avatar: get2DCartoonAvatar("Alex Wong"), isReal: false },
    { name: "Jason Teo", score: 54890, avatar: get2DCartoonAvatar("Jason Teo"), isReal: false },
    { name: "Wei Han", score: 43210, avatar: get2DCartoonAvatar("Wei Han"), isReal: false },
    { name: "Sarah Lim", score: 32880, avatar: get2DCartoonAvatar("Sarah Lim"), isReal: false },
    { name: "Ethan Ng", score: 21760, avatar: get2DCartoonAvatar("Ethan Ng"), isReal: false },
    { name: "Yi Xuan", score: 18340, avatar: get2DCartoonAvatar("Yi Xuan"), isReal: false }
  ];

  const friends = useMemo(() => {
    const factor = timeframe === "daily" ? 1 : 12;
    return baseFriends.map(f => ({
      ...f,
      score: f.score * factor
    })).sort((a, b) => b.score - a.score);
  }, [timeframe]);

  // State Leaderboard Data
  const statePlayers = useMemo(() => {
    return getPlayersForState(selectedState, globalScore, timeframe);
  }, [selectedState, globalScore, timeframe]);

  const handleStateChange = (state: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedState(state);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <div className="live-surface community-surface">
      <style>{`
        /* Local flag badge styling */
        .podium-flag-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 26px;
          height: 18px;
          border-radius: 4px;
          overflow: hidden;
          border: 1.5px solid #050c0d;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050c0d;
          z-index: 3;
        }
        
        .podium-card--1st .podium-flag-badge {
          top: 0px;
          right: 0px;
          width: 30px;
          height: 20px;
        }

        .podium-flag-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Time frame toggle button group */
        .time-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
          width: 100%;
        }

        .time-toggle-container {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          padding: 4px;
          gap: 4px;
        }

        .time-toggle-btn {
          background: transparent;
          border: none;
          border-radius: 999px;
          color: #9db3ad;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .time-toggle-btn--active {
          background: rgba(55, 229, 143, 0.15);
          border: 1px solid rgba(55, 229, 143, 0.3);
          color: #37e58f;
          box-shadow: 0 4px 12px rgba(55, 229, 143, 0.08);
        }

        /* Laurels achievers header */
        .achievers-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .achievers-header-title {
          font-size: 15px;
          font-weight: 900;
          color: #f4fff9;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .laurel-text {
          color: #37e58f;
          opacity: 0.85;
          font-size: 22px;
          line-height: 1;
        }

        /* Podium Cards override */
        .podium-card {
          min-height: 200px;
          padding-top: 30px;
        }

        .podium-card--1st {
          min-height: 240px;
        }

        /* Custom Rank Badges visually matching image */
        .podium-rank-badge-v3 {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          border: 2.5px solid #060c0d;
          z-index: 12;
        }

        .podium-card--1st .podium-rank-badge-v3 {
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #FCD34D;
          color: #050c0d;
          box-shadow: 0 4px 10px rgba(245, 184, 75, 0.4);
        }

        .podium-card--2nd .podium-rank-badge-v3 {
          top: 14px;
          left: 14px;
          background: #9CA3AF;
          color: #050c0d;
          box-shadow: 0 4px 10px rgba(156, 163, 175, 0.3);
        }

        .podium-card--3rd .podium-rank-badge-v3 {
          top: 14px;
          left: 14px;
          background: #D97706;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);
        }

        /* Override avatar sizes for premium Memoji visual */
        .podium-avatar-wrapper {
          width: 86px !important;
          height: 86px !important;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .podium-card--1st .podium-avatar-wrapper {
          width: 102px !important;
          height: 102px !important;
          background: linear-gradient(135deg, rgba(245, 184, 75, 0.15), rgba(180, 83, 9, 0.15));
          border-color: rgba(245, 184, 75, 0.38);
        }

        /* Avatar styling tweaks for premium 3D look */
        .podium-avatar-wrapper .podium-avatar {
          background: transparent;
          border: none;
          width: 90%;
          height: 90%;
        }

        /* Subtext Earn Points styling */
        .podium-subtext {
          font-size: 11px;
          color: #78908a;
          margin: 4px 0 8px;
          text-align: center;
        }

        /* Premium Score Pill */
        .podium-score-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 13.5px;
          font-weight: 800;
          color: #f4fff9;
        }

        .podium-card--1st .podium-score-pill {
          background: rgba(55, 229, 143, 0.08);
          border-color: rgba(55, 229, 143, 0.2);
          color: #37e58f;
        }

        .score-diamond {
          color: #38BDF8;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
        }

        .podium-card--1st .score-diamond {
          color: #37e58f;
        }

        /* Rows styling visually matching screenshot */
        .leaderboard-row-v2 {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        /* Row highlights (green theme glow) */
        .leaderboard-row-v2--highlighted {
          background: linear-gradient(90deg, rgba(55, 229, 143, 0.12), rgba(55, 229, 143, 0.02)) !important;
          border-color: rgba(55, 229, 143, 0.45) !important;
          box-shadow: 0 4px 15px rgba(55, 229, 143, 0.05);
        }

        .leaderboard-row-v2--highlighted:hover {
          background: linear-gradient(90deg, rgba(55, 229, 143, 0.18), rgba(55, 229, 143, 0.04)) !important;
          border-color: rgba(55, 229, 143, 0.7) !important;
          box-shadow: 0 6px 20px rgba(55, 229, 143, 0.08);
        }

        .rank-v2 {
          width: 20px;
          color: #78908a;
          font-weight: 800;
          font-size: 12.5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .leaderboard-row-v2--highlighted .rank-v2 {
          color: #37e58f;
        }

        .trophy-badge {
          color: #FCD34D;
          display: flex;
          align-items: center;
        }

        /* Flag badge in rows */
        .row-flag-badge {
          width: 22px;
          height: 15px;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .row-flag-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Avatar circular frame matching image */
        .avatar-v2-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar-v2 {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .info-v2 {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .name-v2 {
          font-size: 13px;
          font-weight: 650;
          color: #f4fff9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leaderboard-row-v2--highlighted .name-v2 {
          color: #37e58f;
          font-weight: 750;
        }

        /* Score elements */
        .score-group-v2 {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .score-v2 {
          font-size: 13px;
          font-weight: 800;
          color: #f4fff9;
        }

        .leaderboard-row-v2--highlighted .score-v2 {
          color: #37e58f;
        }

        /* Footer card styling */
        .leaderboard-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          padding: 8px 20px;
          font-size: 12px;
          color: #9db3ad;
          margin-top: 18px;
          width: fit-content;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .footer-diamond {
          color: #38BDF8;
          font-weight: 800;
        }

        .footer-highlight {
          color: #37e58f;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .podium-avatar-wrapper {
            width: 72px !important;
            height: 72px !important;
          }
          .podium-card--1st .podium-avatar-wrapper {
            width: 86px !important;
            height: 86px !important;
          }
          .podium-flag-badge {
            width: 22px;
            height: 15px;
          }
          .podium-card--1st .podium-flag-badge {
            width: 26px;
            height: 17px;
          }
        }
      `}</style>

      {/* Daily / Monthly toggle pill */}
      <div className="time-toggle-wrapper">
        <div className="time-toggle-container">
          <button 
            onClick={() => setTimeframe("daily")}
            className={`time-toggle-btn ${timeframe === "daily" ? "time-toggle-btn--active" : ""}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setTimeframe("monthly")}
            className={`time-toggle-btn ${timeframe === "monthly" ? "time-toggle-btn--active" : ""}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Achievers Laurels Header */}
      <div className="achievers-header">
        <span className="laurel-text">🌿</span>
        <span className="achievers-header-title">Overall Top 3 Achievers</span>
        <span className="laurel-text">🌿</span>
      </div>

      {/* Overall Top 3 Podium */}
      <div className="podium-section">
        {/* Rank 2 - Left */}
        <div className="podium-card podium-card--2nd">
          <span className="podium-rank-badge-v3">2</span>
          <div className="podium-avatar-wrapper">
            <img src={overallTop3[1].avatar} alt={overallTop3[1].name} className="podium-avatar" />
            <div className="podium-flag-badge" title={overallTop3[1].stateName}>
              <img src={overallTop3[1].flag} alt={`${overallTop3[1].stateName} flag`} className="podium-flag-img" />
            </div>
          </div>
          <div className="podium-info">
            <h3 className="podium-name">{overallTop3[1].name}</h3>
            <p className="podium-subtext">Earn {overallTop3[1].earn.toLocaleString()} points</p>
            <div className="podium-score-pill">
              <EcoCoin size={14} className="score-coin" />
              <span>{overallTop3[1].score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Rank 1 - Center (Elevated, Glowing) */}
        <div className="podium-card podium-card--1st">
          <div className="podium-crown-container">
            <Crown className="podium-crown-icon" size={26} fill="#FCD34D" />
          </div>
          <span className="podium-rank-badge-v3">1</span>
          <div className="podium-avatar-wrapper">
            <img src={overallTop3[0].avatar} alt={overallTop3[0].name} className="podium-avatar" />
            <div className="podium-flag-badge" title={overallTop3[0].stateName}>
              <img src={overallTop3[0].flag} alt={`${overallTop3[0].stateName} flag`} className="podium-flag-img" />
            </div>
          </div>
          <div className="podium-info">
            <h3 className="podium-name">{overallTop3[0].name}</h3>
            <p className="podium-subtext">Earn {overallTop3[0].earn.toLocaleString()} points</p>
            <div className="podium-score-pill">
              <EcoCoin size={14} className="score-coin" />
              <span>{overallTop3[0].score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Rank 3 - Right */}
        <div className="podium-card podium-card--3rd">
          <span className="podium-rank-badge-v3">3</span>
          <div className="podium-avatar-wrapper">
            <img src={overallTop3[2].avatar} alt={overallTop3[2].name} className="podium-avatar" />
            <div className="podium-flag-badge" title={overallTop3[2].stateName}>
              <img src={overallTop3[2].flag} alt={`${overallTop3[2].stateName} flag`} className="podium-flag-img" />
            </div>
          </div>
          <div className="podium-info">
            <h3 className="podium-name">{overallTop3[2].name}</h3>
            <p className="podium-subtext">Earn {overallTop3[2].earn.toLocaleString()} points</p>
            <div className="podium-score-pill">
              <EcoCoin size={14} className="score-coin" />
              <span>{overallTop3[2].score.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing State and Friends leaderboards */}
      <div className="leaderboards-grid">
        {/* State Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-card-header">
            <h3 className="leaderboard-card-title">
              <Award size={16} /> State Leaderboard
            </h3>
            <div className="state-select-container">
              <select 
                value={selectedState} 
                onChange={(e) => handleStateChange(e.target.value)}
                className="state-select-dropdown"
              >
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <ChevronDown size={12} className="state-select-chevron" />
            </div>
          </div>

          <div className={`leaderboard-rows ${isTransitioning ? "leaderboard-rows--fade" : ""}`}>
            {statePlayers.map((player, index) => {
              const isFirst = index === 0;
              return (
                <div 
                  key={player.name} 
                  className={`leaderboard-row-v2 ${isFirst ? "leaderboard-row-v2--highlighted" : ""}`}
                >
                  <span className="rank-v2">
                    {isFirst ? (
                      <Trophy size={14} className="trophy-badge" fill="#F5B84B" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="row-flag-badge" title={player.state}>
                    <img src={player.flag} alt={player.state} className="row-flag-img" />
                  </div>
                  <div className="avatar-v2-wrapper">
                    <img src={player.avatar} alt={player.name} className="avatar-v2" />
                  </div>
                  <div className="info-v2">
                    <span className="name-v2">
                      {player.name}
                      <span className="state-v2">({player.state})</span>
                      {player.isReal && <span className="me-badge">You</span>}
                    </span>
                  </div>
                  <div className="score-group-v2">
                    <EcoCoin size={14} className="row-coin" />
                    <span className="score-v2">{player.score.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Friends Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-card-header">
            <h3 className="leaderboard-card-title">
              <Users size={16} /> Friends Leaderboard
            </h3>
          </div>

          <div className="leaderboard-rows">
            {friends.map((friend, index) => {
              const isFirst = index === 0;
              return (
                <div 
                  key={friend.name} 
                  className={`leaderboard-row-v2 ${isFirst ? "leaderboard-row-v2--highlighted" : ""}`}
                >
                  <span className="rank-v2">
                    {isFirst ? (
                      <Trophy size={14} className="trophy-badge" fill="#F5B84B" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="avatar-v2-wrapper">
                    <img src={friend.avatar} alt={friend.name} className="avatar-v2" />
                  </div>
                  <div className="info-v2">
                    <span className="name-v2">
                      {friend.name}
                      {friend.isReal && <span className="me-badge">You</span>}
                    </span>
                  </div>
                  <div className="score-group-v2">
                    <EcoCoin size={14} className="row-coin" />
                    <span className="score-v2">{friend.score.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer banner */}
      <div className="leaderboard-footer">
        You earned <span className="footer-highlight" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EcoCoin size={13} className="footer-coin" /> 50</span> today and are ranked <span className="footer-highlight">#18</span> out of <strong>2,789</strong> users
      </div>
    </div>
  );
}

function DriveSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  const feedback = hardwareFeedbackForTelemetry(telemetry);
  const speed = telemetry?.speedKmh ?? null;
  const ecoScore = telemetry?.ecoScore ?? null;

  return (
    <div className="live-surface drive-surface-clean">
      <div className="surface-grid" />
      <div className={`hardware-pod hardware-pod--${feedback.color}`}>
        <RadioTower size={18} />
        <strong>LED {feedback.led}</strong>
        <span>OLED {feedback.oled}</span>
      </div>
      <div className="drive-centerpiece">
        <div className="speed-orb">
          <span>{formatNumber(speed, 0)}</span>
          <small>km/h</small>
        </div>
        <div className="steering-arc">
          <span style={{ transform: `translateX(${Math.max(-44, Math.min(44, (telemetry?.steering ?? 0) * 44))}px)` }} />
        </div>
      </div>
      <div className="packet-panel">
        <PacketRow label="Eco score" value={formatNumber(ecoScore, 0)} />
        <PacketRow label="Event" value={telemetry?.event ? eventLabel(telemetry.event) : "--"} />
        <PacketRow label="Throttle" value={formatPercent(telemetry?.throttle)} />
        <PacketRow label="Brake" value={formatPercent(telemetry?.brake)} />
      </div>
      {!telemetry ? <EmptyState icon={Gauge} title="Waiting for simulator telemetry" /> : null}
    </div>
  );
}

function RouteSurface({ telemetry }: { telemetry: ProcessedTelemetry | null }) {
  return (
    <div className="live-surface route-surface-clean" style={{ padding: 0 }}>
      <EcoRouteMap onRouteSelect={(route) => console.log("Selected route:", route.id)} />
    </div>
  );
}

function RewardsSurface() {
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const spendCoins = useDashboardStore((state) => state.spendCoins);
  
  const [redeemed, setRedeemed] = useState<string | null>(null);

  const rewards = [
    { id: "coffee", title: "Campus Coffee Discount (RM 5)", cost: 500, icon: "☕" },
    { id: "parking", title: "Reserved EV Parking (1 Day)", cost: 1200, icon: "🅿️" },
    { id: "merch", title: "UTAR Green Merch T-Shirt", cost: 3500, icon: "👕" },
  ];

  const handleRedeem = (id: string, cost: number) => {
    if (spendCoins(cost)) {
      setRedeemed(id);
      setTimeout(() => setRedeemed(null), 3000);
    }
  };

  return (
    <div className="live-surface rewards-surface-clean">
      <div className="rewards-header">
        <h2>EcoDrive+ Marketplace</h2>
        <p>You have <strong>{walletCoins.toLocaleString()}</strong> EcoCoins to spend.</p>
      </div>
      <div className="rewards-grid">
        {rewards.map((reward) => (
          <div key={reward.id} className="reward-card">
            <span className="reward-icon">{reward.icon}</span>
            <h3>{reward.title}</h3>
            <div className="reward-action">
              <span className="reward-cost">{reward.cost} Coins</span>
              <button 
                className="redeem-btn" 
                disabled={walletCoins < reward.cost}
                onClick={() => handleRedeem(reward.id, reward.cost)}
              >
                {redeemed === reward.id ? "Redeemed!" : "Redeem"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="packet-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function EmptyState({ icon: Icon, title }: { icon: typeof Gauge; title: string }) {
  return (
    <div className="empty-state">
      <Icon size={28} />
      <strong>{title}</strong>
      <span>Connect the simulator or telemetry bridge to populate this panel.</span>
    </div>
  );
}

function formatNumber(value: number | undefined | null, digits: number) {
  if (value == null || Number.isNaN(value)) return "--";
  return value.toFixed(digits);
}

function formatPercent(value: number | undefined | null) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${Math.round(value * 100)}%`;
}
