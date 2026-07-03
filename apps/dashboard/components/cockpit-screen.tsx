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

const PointsIcon = ({ size = 16, className = "", style = {} }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <span className={`points-star-icon ${className}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
      {/* 2D stylized glowing gaming star */}
      <path 
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
        fill="url(#starGrad)" 
        stroke="#EAB308" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      {/* Inner star accent for 3D/embossed effect */}
      <path 
        d="M12 5L13.85 8.76L18 9.37L15 12.29L15.71 16.42L12 14.47L8.29 16.42L9 12.29L6 9.37L10.15 8.76L12 5Z" 
        fill="url(#innerStarGrad)" 
        opacity="0.9" 
      />
      <defs>
        <linearGradient id="starGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF59D" /> {/* Bright yellow */}
          <stop offset="50%" stopColor="#FBC02D" /> {/* Gold */}
          <stop offset="100%" stopColor="#F57F17" /> {/* Orange gold */}
        </linearGradient>
        <linearGradient id="innerStarGrad" x1="6" y1="5" x2="18" y2="17" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FBC02D" />
        </linearGradient>
      </defs>
    </svg>
  </span>
);

const EcoCoin = PointsIcon;

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
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"top3" | "state" | "friends">("top3");

  const states = [
    "All States", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
    "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
    "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", 
    "Putrajaya", "Labuan"
  ];

  // Dynamically calculate Overall Top 3 Achievers from combined state pools
  const overallTop3 = useMemo(() => {
    const listStates = [
      "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
      "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
      "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", 
      "Putrajaya", "Labuan"
    ];
    let pool: Array<{ name: string; score: number; avatar: string; state: string; flag: string; isReal: boolean }> = [];
    listStates.forEach(stName => {
      const players = getPlayersForState(stName, globalScore, timeframe);
      pool = [...pool, ...players];
    });
    // Remove duplicates by name if any
    const uniquePool = pool.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
    // Sort descending
    uniquePool.sort((a, b) => b.score - a.score);
    // Return top 3
    return uniquePool.slice(0, 3).map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      earn: Math.round(p.score * 0.025), // dynamic earn points calculation
      score: p.score,
      avatar: p.avatar,
      flag: p.flag,
      stateName: p.state
    }));
  }, [globalScore, timeframe]);

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

        /* Compact time frame toggle button group shifted upward */
        .time-toggle-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2px;
          width: 100%;
        }

        .time-toggle-container {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          padding: 3px;
          gap: 4px;
        }

        .time-toggle-btn {
          background: transparent;
          border: none;
          border-radius: 999px;
          color: #9db3ad;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 10px;
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

        /* Compact EV Styled Header Container shifted upward */
        .ev-header-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0px 0 4px;
          text-align: center;
        }

        .ev-main-title {
          font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
          font-size: 22px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          background: linear-gradient(90deg, #10B981 0%, #34D399 50%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 6px rgba(56, 189, 248, 0.25));
          margin: 0;
          position: relative;
        }

        .ev-main-title::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 55px;
          height: 2px;
          background: linear-gradient(90deg, #34D399, #38BDF8);
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
          border-radius: 2px;
        }

        .ev-sub-title-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .ev-sub-title {
          font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 850;
          color: #9db3ad;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .ev-lightning {
          color: #38bdf8;
          font-size: 14px;
          animation: evPulse 2s infinite ease-in-out;
          display: inline-flex;
          align-items: center;
        }

        @keyframes evPulse {
          0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(56, 189, 248, 0.4)); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8)); }
        }

        /* 3-Column layout grid containing Tab bar + Dynamic Panels */
        .leaderboards-tabbed-layout {
          display: grid !important;
          grid-template-columns: 220px 1fr !important;
          gap: 16px !important;
          width: 100% !important;
          flex: 1 !important;
          min-height: 0 !important;
          margin-top: -24px !important;
        }

        /* Vertical Tabs container centered vertically in the side column */
        .leaderboards-tab-nav {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          background: rgba(10, 18, 19, 0.4) !important;
          border: 1px solid rgba(38, 59, 58, 0.4) !important;
          border-radius: 12px !important;
          padding: 10px !important;
          height: fit-content !important;
          margin-top: auto !important;
          margin-bottom: auto !important;
        }

        .leaderboard-tab-btn {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          width: 100% !important;
          padding: 8px 12px !important;
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.04) !important;
          border-radius: 8px !important;
          color: #9db3ad !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          text-align: left !important;
        }

        .leaderboard-tab-btn:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #f4fff9 !important;
          transform: translateX(2px);
        }

        .leaderboard-tab-btn--active {
          background: rgba(55, 229, 143, 0.08) !important;
          border-color: rgba(55, 229, 143, 0.3) !important;
          color: #37e58f !important;
          box-shadow: 0 4px 15px rgba(55, 229, 143, 0.08) !important;
        }

        .tab-icon {
          font-size: 14px !important;
        }

        .tab-label {
          font-family: 'Montserrat', system-ui, sans-serif !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
        }

        .leaderboards-tab-content {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 0 !important;
        }

        .leaderboard-rows {
          max-height: calc(100vh - 290px) !important;
          overflow-y: auto !important;
        }

        @keyframes goldGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(250, 204, 21, 0.2), inset 0 0 10px rgba(250, 204, 21, 0.05); }
          50% { box-shadow: 0 4px 35px rgba(250, 204, 21, 0.45), inset 0 0 20px rgba(250, 204, 21, 0.15); }
        }

        @keyframes floatCrown {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }

        .podium-section-horizontal {
          display: flex !important;
          align-items: flex-end !important;
          justify-content: center !important;
          gap: 12px !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 600px !important;
          margin: 0 auto !important;
          padding-bottom: 5px !important;
        }

        .podium-card-h {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          padding: 10px 8px !important;
          background: linear-gradient(180deg, rgba(14, 25, 26, 0.65), rgba(6, 12, 13, 0.9));
          border: 1px solid rgba(38, 59, 58, 0.68);
          border-radius: 16px;
          position: relative;
          width: 160px !important;
          transition: all 0.2s ease;
        }

        .podium-card-h--1st {
          height: 210px !important;
          border: 2px solid rgba(250, 204, 21, 0.5) !important;
          animation: goldGlow 4s infinite ease-in-out;
          background: linear-gradient(180deg, rgba(250, 204, 21, 0.08), rgba(6, 12, 13, 0.95)) !important;
          z-index: 10;
        }

        .podium-card-h--2nd {
          height: 180px !important;
          border: 1.5px solid rgba(156, 163, 175, 0.3) !important;
          background: linear-gradient(180deg, rgba(156, 163, 175, 0.03), rgba(6, 12, 13, 0.9)) !important;
        }

        .podium-card-h--3rd {
          height: 160px !important;
          border: 1.5px solid rgba(217, 119, 6, 0.25) !important;
          background: linear-gradient(180deg, rgba(217, 119, 6, 0.02), rgba(6, 12, 13, 0.9)) !important;
        }

        .podium-h-rank-badge {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9.5px;
          font-weight: 900;
          border: 1.5px solid #060c0d;
          z-index: 12;
        }

        .podium-h-rank-badge--1st {
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #FCD34D;
          color: #050c0d;
          box-shadow: 0 2px 6px rgba(245, 184, 75, 0.4);
        }

        .podium-h-rank-badge--2nd {
          top: 8px;
          left: 8px;
          background: #9CA3AF;
          color: #050c0d;
          box-shadow: 0 2px 6px rgba(156, 163, 175, 0.3);
        }

        .podium-h-rank-badge--3rd {
          top: 8px;
          left: 8px;
          background: #D97706;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
        }

        .podium-h-avatar-wrapper {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50%;
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 10px;
        }

        .podium-card-h--1st .podium-h-avatar-wrapper {
          width: 60px !important;
          height: 60px !important;
          border-color: rgba(255, 255, 255, 0.2);
          background: linear-gradient(135deg, rgba(245, 184, 75, 0.15), rgba(180, 83, 9, 0.15));
        }

        .podium-h-avatar {
          width: 85%;
          height: 85%;
          object-fit: contain;
          border-radius: 50%;
        }

        .podium-h-crown-container {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          animation: floatCrown 3s infinite ease-in-out;
        }

        .podium-h-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 8px;
          width: 100%;
        }

        .podium-h-name {
          font-size: 10.5px;
          font-weight: 750;
          color: #f4fff9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .podium-card-h--1st .podium-h-name {
          color: #FCD34D;
        }

        .podium-h-subtext {
          font-size: 8.5px;
          color: #78908a;
          margin: 2px 0 6px;
        }

        .podium-h-score-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 9.5px;
          font-weight: 800;
          color: #f4fff9;
        }

        .podium-card-h--1st .podium-h-score-pill {
          background: rgba(55, 229, 143, 0.08);
          border-color: rgba(255, 229, 143, 0.2);
          color: #37e58f;
        }

        /* 2-Column Split Featured Layout */
        .split-leaderboard-layout {
          display: grid !important;
          grid-template-columns: 180px 1fr !important;
          gap: 12px !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
        }

        .featured-winner-column {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 0 !important;
          justify-content: center !important;
        }

        .featured-winner-card {
          background: linear-gradient(180deg, rgba(250, 204, 21, 0.08), rgba(6, 12, 13, 0.95)) !important;
          border: 2px solid rgba(250, 204, 21, 0.45) !important;
          animation: goldGlow 4s infinite ease-in-out;
          border-radius: 12px !important;
          padding: 14px 10px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          position: relative !important;
          height: 100% !important;
          justify-content: center !important;
        }

        .featured-header {
          font-family: 'Montserrat', system-ui, sans-serif !important;
          font-size: 9.5px !important;
          font-weight: 850 !important;
          color: #FCD34D !important;
          letter-spacing: 1.5px !important;
          margin-bottom: 8px !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }

        .featured-winner-avatar-wrapper {
          width: 58px !important;
          height: 58px !important;
          border-radius: 50%;
          position: relative !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          background: linear-gradient(135deg, rgba(245, 184, 75, 0.15), rgba(180, 83, 9, 0.15)) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 8px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        .featured-winner-avatar {
          width: 85%;
          height: 85%;
          object-fit: contain;
          border-radius: 50%;
        }

        .featured-winner-flag-badge {
          position: absolute;
          top: 0px;
          right: 0px;
          width: 24px;
          height: 16px;
          border-radius: 3px;
          overflow: hidden;
          border: 1.5px solid #050c0d;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050c0d;
        }

        .featured-winner-flag-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-winner-info {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }

        .featured-winner-name {
          font-size: 11.5px !important;
          font-weight: 800 !important;
          color: #FCD34D !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
        }

        .featured-winner-state {
          font-size: 8.5px !important;
          color: #78908a !important;
          margin: 2px 0 8px 0 !important;
        }

        .featured-winner-score-badge {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: rgba(55, 229, 143, 0.08) !important;
          border: 1px solid rgba(55, 229, 143, 0.2) !important;
          border-radius: 999px !important;
          padding: 3px 8px !important;
          font-size: 10px !important;
          font-weight: 850 !important;
          color: #37e58f !important;
        }

        .list-column {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 0 !important;
        }

        .leaderboard-row-v2--gold {
          background: linear-gradient(90deg, rgba(250, 204, 21, 0.12), rgba(250, 204, 21, 0.02)) !important;
          border-color: rgba(250, 204, 21, 0.45) !important;
          box-shadow: 0 4px 15px rgba(250, 204, 21, 0.08);
        }

        .leaderboard-row-v2--gold:hover {
          background: linear-gradient(90deg, rgba(250, 204, 21, 0.18), rgba(250, 204, 21, 0.04)) !important;
          border-color: rgba(250, 204, 21, 0.65) !important;
          box-shadow: 0 6px 20px rgba(250, 204, 21, 0.12);
        }

        /* Rows styling visually matching screenshot */
        .leaderboard-row-v2 {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 8px;
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
          font-size: 11px;
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
          width: 26px;
          height: 26px;
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
          font-size: 11px;
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
          font-size: 11px;
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
          padding: 5px 12px;
          font-size: 10.5px;
          color: #9db3ad;
          margin-top: 4px;
          width: fit-content;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .leaderboard-card-header {
          padding: 6px 12px !important;
        }

        .leaderboard-card-title {
          font-size: 12px !important;
        }

        .footer-diamond {
          color: #38BDF8;
          font-weight: 800;
        }

        .footer-highlight {
          color: #37e58f;
          font-weight: 700;
        }

        @media (max-width: 1023px) {
          .leaderboards-tabbed-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
            gap: 14px !important;
            height: 100% !important;
          }
          .leaderboards-tab-nav {
            flex-direction: row !important;
            padding: 8px !important;
            gap: 8px !important;
            width: 100% !important;
            overflow-x: auto !important;
          }
          .leaderboard-tab-btn {
            padding: 8px 12px !important;
            font-size: 12px !important;
            justify-content: center !important;
            flex: 1 !important;
            white-space: nowrap !important;
          }
          .podium-section-horizontal {
            flex-wrap: wrap !important;
            gap: 10px !important;
            height: auto !important;
            padding-bottom: 10px !important;
          }
          .podium-card-h {
            width: 30% !important;
            min-width: 100px !important;
            height: auto !important;
            min-height: 170px !important;
          }
          .podium-card-h--1st {
            order: 1 !important;
            height: auto !important;
            min-height: 195px !important;
          }
          .podium-card-h--2nd {
            order: 0 !important;
          }
          .podium-card-h--3rd {
            order: 2 !important;
          }
          .leaderboard-rows {
            max-height: calc(100vh - 290px) !important;
          }
          
          /* Split Layout Responsive overrides */
          .split-leaderboard-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
            gap: 14px !important;
            height: 100% !important;
          }
          .featured-winner-column {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }
        }
      `}</style>

      {/* EV Styled Leaderboard Header */}
      <div className="ev-header-container">
        <h1 className="ev-main-title">EcoDrive Leaderboard</h1>
        <div className="ev-sub-title-wrapper">
          <span className="ev-lightning">⚡</span>
          <span className="ev-sub-title">
            {activeLeaderboardTab === "top3" && "overall top 3 achiever"}
            {activeLeaderboardTab === "state" && "state leaderboard"}
            {activeLeaderboardTab === "friends" && "friends leaderboard"}
          </span>
          <span className="ev-lightning">⚡</span>
        </div>
      </div>

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

      <div className="leaderboards-tabbed-layout">
        {/* Left Column: Fixed Navigation Buttons Stacked vertically, centered vertically */}
        <div className="leaderboards-tab-nav">
          <button 
            onClick={() => setActiveLeaderboardTab("top3")}
            className={`leaderboard-tab-btn ${activeLeaderboardTab === "top3" ? "leaderboard-tab-btn--active" : ""}`}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-label">Top Achievers</span>
          </button>
          <button 
            onClick={() => setActiveLeaderboardTab("state")}
            className={`leaderboard-tab-btn ${activeLeaderboardTab === "state" ? "leaderboard-tab-btn--active" : ""}`}
          >
            <span className="tab-icon">🗺️</span>
            <span className="tab-label">State Leaderboard</span>
          </button>
          <button 
            onClick={() => setActiveLeaderboardTab("friends")}
            className={`leaderboard-tab-btn ${activeLeaderboardTab === "friends" ? "leaderboard-tab-btn--active" : ""}`}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-label">Friends Leaderboard</span>
          </button>
        </div>

        {/* Right Column: Dynamic Content Area */}
        <div className="leaderboards-tab-content">
          {activeLeaderboardTab === "top3" && (
            <div className="podium-section-horizontal">
              {/* Rank 2 - Left */}
              <div className="podium-card-h podium-card-h--2nd">
                <span className="podium-h-rank-badge podium-h-rank-badge--2nd">2</span>
                <div className="podium-h-avatar-wrapper">
                  <img src={overallTop3[1].avatar} alt={overallTop3[1].name} className="podium-h-avatar" />
                  <div className="podium-flag-badge" title={overallTop3[1].stateName}>
                    <img src={overallTop3[1].flag} alt={`${overallTop3[1].stateName} flag`} className="podium-flag-img" />
                  </div>
                </div>
                <div className="podium-h-info">
                  <h3 className="podium-h-name">{overallTop3[1].name}</h3>
                  <p className="podium-h-subtext">Earned {overallTop3[1].score.toLocaleString()} pts</p>
                  <div className="podium-h-score-pill">
                    <EcoCoin size={13} className="score-coin" />
                    <span>{overallTop3[1].score.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Rank 1 - Center */}
              <div className="podium-card-h podium-card-h--1st">
                <div className="podium-h-crown-container">
                  <Crown className="podium-crown-icon" size={24} fill="#FCD34D" stroke="#FCD34D" />
                </div>
                <span className="podium-h-rank-badge podium-h-rank-badge--1st">1</span>
                <div className="podium-h-avatar-wrapper">
                  <img src={overallTop3[0].avatar} alt={overallTop3[0].name} className="podium-h-avatar" />
                  <div className="podium-flag-badge" title={overallTop3[0].stateName}>
                    <img src={overallTop3[0].flag} alt={`${overallTop3[0].stateName} flag`} className="podium-flag-img" />
                  </div>
                </div>
                <div className="podium-h-info">
                  <h3 className="podium-h-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {overallTop3[0].name}
                    <Trophy size={13} fill="#FCD34D" stroke="#FCD34D" style={{ verticalAlign: 'middle' }} />
                  </h3>
                  <p className="podium-h-subtext">Earned {overallTop3[0].score.toLocaleString()} pts</p>
                  <div className="podium-h-score-pill">
                    <EcoCoin size={13} className="score-coin" />
                    <span>{overallTop3[0].score.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Rank 3 - Right */}
              <div className="podium-card-h podium-card-h--3rd">
                <span className="podium-h-rank-badge podium-h-rank-badge--3rd">3</span>
                <div className="podium-h-avatar-wrapper">
                  <img src={overallTop3[2].avatar} alt={overallTop3[2].name} className="podium-h-avatar" />
                  <div className="podium-flag-badge" title={overallTop3[2].stateName}>
                    <img src={overallTop3[2].flag} alt={`${overallTop3[2].stateName} flag`} className="podium-flag-img" />
                  </div>
                </div>
                <div className="podium-h-info">
                  <h3 className="podium-h-name">{overallTop3[2].name}</h3>
                  <p className="podium-h-subtext">Earned {overallTop3[2].score.toLocaleString()} pts</p>
                  <div className="podium-h-score-pill">
                    <EcoCoin size={13} className="score-coin" />
                    <span>{overallTop3[2].score.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeLeaderboardTab === "state" && (
            <div className="split-leaderboard-layout">
              {/* Left Column: Featured State Winner */}
              {statePlayers[0] && (
                <div className="featured-winner-column">
                  <div className="podium-card-h podium-card-h--1st" style={{ margin: '0 auto' }}>
                    <div className="podium-h-crown-container">
                      <Crown className="podium-crown-icon" size={24} fill="#FCD34D" stroke="#FCD34D" />
                    </div>
                    <span className="podium-h-rank-badge podium-h-rank-badge--1st">1</span>
                    <div className="podium-h-avatar-wrapper">
                      <img src={statePlayers[0].avatar} alt={statePlayers[0].name} className="podium-h-avatar" />
                      <div className="podium-flag-badge" title={statePlayers[0].state}>
                        <img src={statePlayers[0].flag} alt={`${statePlayers[0].state} flag`} className="podium-flag-img" />
                      </div>
                    </div>
                    <div className="podium-h-info">
                      <h3 className="podium-h-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {statePlayers[0].name}
                        <Trophy size={13} fill="#FCD34D" stroke="#FCD34D" style={{ verticalAlign: 'middle' }} />
                      </h3>
                      <p className="podium-h-subtext">State Champion ({statePlayers[0].state})</p>
                      <div className="podium-h-score-pill">
                        <EcoCoin size={13} className="score-coin" />
                        <span>{statePlayers[0].score.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Ranked State List */}
              <div className="list-column">
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
                    {statePlayers.slice(0, 6).map((player, index) => {
                      const isFirst = index === 0;
                      return (
                        <div 
                          key={player.name} 
                          className={`leaderboard-row-v2 ${isFirst ? "leaderboard-row-v2--gold" : ""}`}
                        >
                          <span className="rank-v2">
                            {isFirst ? (
                              <Trophy size={14} className="trophy-badge" fill="#FCD34D" stroke="#FCD34D" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div className="avatar-v2-wrapper">
                            <img src={player.avatar} alt={player.name} className="avatar-v2" />
                          </div>
                          <div className="info-v2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="name-v2" style={{ color: isFirst ? '#FCD34D' : '#f4fff9' }}>
                              {player.name} <span className="state-muted" style={{ fontSize: '11px', color: '#78908a', marginLeft: '4px', fontWeight: 'normal' }}>({player.state})</span>
                            </span>
                            <div className="row-flag-badge" title={player.state} style={{ width: '18px', height: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', display: 'inline-flex' }}>
                              <img src={player.flag} alt={player.state} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
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
              </div>
            </div>
          )}

          {activeLeaderboardTab === "friends" && (
            <div className="split-leaderboard-layout">
              {/* Left Column: Featured Friends Winner */}
              {friends[0] && (
                <div className="featured-winner-column">
                  <div className="podium-card-h podium-card-h--1st" style={{ margin: '0 auto' }}>
                    <div className="podium-h-crown-container">
                      <Crown className="podium-crown-icon" size={24} fill="#FCD34D" stroke="#FCD34D" />
                    </div>
                    <span className="podium-h-rank-badge podium-h-rank-badge--1st">1</span>
                    <div className="podium-h-avatar-wrapper">
                      <img src={friends[0].avatar} alt={friends[0].name} className="podium-h-avatar" />
                    </div>
                    <div className="podium-h-info">
                      <h3 className="podium-h-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {friends[0].name}
                        <Trophy size={13} fill="#FCD34D" stroke="#FCD34D" style={{ verticalAlign: 'middle' }} />
                      </h3>
                      <p className="podium-h-subtext">Top Friend</p>
                      <div className="podium-h-score-pill">
                        <EcoCoin size={13} className="score-coin" />
                        <span>{friends[0].score.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: Friends ranked list */}
              <div className="list-column">
                <div className="leaderboard-card">
                  <div className="leaderboard-card-header">
                    <h3 className="leaderboard-card-title">
                      <Users size={16} /> Friends Leaderboard
                    </h3>
                  </div>

                  <div className="leaderboard-rows">
                    {friends.slice(0, 6).map((friend, index) => {
                      const isFirst = index === 0;
                      return (
                        <div 
                          key={friend.name} 
                          className={`leaderboard-row-v2 ${isFirst ? "leaderboard-row-v2--gold" : ""}`}
                        >
                          <span className="rank-v2">
                            {isFirst ? (
                              <Trophy size={14} className="trophy-badge" fill="#FCD34D" stroke="#FCD34D" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div className="avatar-v2-wrapper">
                            <img src={friend.avatar} alt={friend.name} className="avatar-v2" />
                          </div>
                          <div className="info-v2">
                            <span className="name-v2" style={{ color: isFirst ? '#FCD34D' : '#f4fff9' }}>{friend.name}</span>
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
            </div>
          )}
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
