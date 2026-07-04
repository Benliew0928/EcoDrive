"use client";

import { useEffect, useMemo, useState } from "react";
import { CockpitShell } from "../../components/cockpit-shell";
import { useDashboardStore } from "../../lib/dashboard-store";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Gift, 
  ExternalLink,
  Search,
  Sparkles,
  Ticket
} from "lucide-react";

const EcoCoin = ({ size = 16, className = "", style = {} }: { size?: number; className?: string; style?: React.CSSProperties }) => (
  <span className={`eco-coin-icon ${className}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="11" fill="url(#coinOuterGrad)" stroke="#EAB308" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="8.5" fill="url(#coinInnerGrad)" stroke="#CA8A04" strokeWidth="0.5" />
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

type RewardCategory = "Vehicle Benefits" | "Lifestyle" | "Shopping" | "Eco Impact";
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
  expiry?: string;
};

type RedeemedEntry = {
  id: string;
  reward: Reward;
  redeemedAt: string; // ISO string for local storage stability
  expiresAt: string;
  status: "Active" | "Used" | "Expired";
};

type CategoryInfo = {
  id: RewardCategory;
  title: string;
  description: string;
  image: string;
  icon: string;
};

const categoriesInfo: CategoryInfo[] = [
  {
    id: "Vehicle Benefits",
    title: "Vehicle Benefits",
    description: "Access charging credits, preferred parking spots, and diagnostics checkups.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    icon: "🚗"
  },
  {
    id: "Lifestyle",
    title: "Lifestyle",
    description: "Redeem premium coffees, cinema tickets, meals, and gym day passes.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    icon: "☕"
  },
  {
    id: "Shopping",
    title: "Shopping",
    description: "Shop sustainably with apparel, gift cards, and reusable gear.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    icon: "🛍️"
  },
  {
    id: "Eco Impact",
    title: "Eco Impact",
    description: "Directly support reforestation, wildlife protection, and cleanup projects.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    icon: "🌱"
  }
];

const rewardsData: Reward[] = [
  // Vehicle Benefits
  {
    id: "charging-credit",
    title: "EV Charging Credit",
    partner: "GreenCharge Hub",
    description: "RM20 fast-charging credit redeemable at all grid locations.",
    cost: 500,
    stock: 45,
    badge: "Best Value",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reserved-parking",
    title: "Reserved EV Parking",
    partner: "CityPark Connect",
    description: "Guaranteed premium parking bay with charger access for one full day.",
    cost: 800,
    stock: 12,
    badge: "Popular",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1597404294360-feeeda04612e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "premium-pass",
    title: "Premium Parking Pass",
    partner: "MetroValet",
    description: "One-week free upgrade to VIP multi-level garage structures.",
    cost: 1200,
    stock: 8,
    badge: "New",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1506521788723-85811181d33c?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "car-wash",
    title: "Car Wash Voucher",
    partner: "AquaEco Care",
    description: "Eco-friendly, water-reclaimed exterior detailing and shine service.",
    cost: 600,
    stock: 25,
    badge: "Best Value",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "battery-diagnostics",
    title: "Battery Health Check",
    partner: "Volt Diagnostics",
    description: "Complete EV powertrain and thermal cell health validation checkup.",
    cost: 1500,
    stock: 15,
    badge: "Limited",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "tire-inspection",
    title: "Tire Inspection",
    partner: "RubberPro Service",
    description: "Alignment test, wear analysis, and nitrogen pressure adjustment.",
    cost: 400,
    stock: 30,
    badge: "New",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "service-discount",
    title: "Vehicle Service Discount",
    partner: "E-Force Mechanics",
    description: "RM50 discount coupon for any regular schedule component servicing.",
    cost: 2000,
    stock: 6,
    badge: "Best Value",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "windshield-cleaning",
    title: "Windshield Cleaning",
    partner: "GlassGuard",
    description: "Rain repellent coating application and wiper blade inspection.",
    cost: 250,
    stock: 50,
    badge: "Popular",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80"
  },

  // Lifestyle
  {
    id: "coffee-voucher",
    title: "Coffee Voucher",
    partner: "The Roast Room",
    description: "One cup of freshly brewed hot latte or iced cappuccino.",
    cost: 350,
    stock: 80,
    badge: "Popular",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "boba-voucher",
    title: "Bubble Tea Voucher",
    partner: "Boba Avenue",
    description: "Signature brown sugar fresh milk tea with grass jelly or pearls.",
    cost: 500,
    stock: 60,
    badge: "New",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "lunch-set",
    title: "Lunch Set",
    partner: "The Green Table",
    description: "Choose any organic harvest bowl with a cold-pressed juice pairing.",
    cost: 900,
    stock: 15,
    badge: "Best Value",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "bakery-discount",
    title: "Bakery Discount",
    partner: "Artisan Crust",
    description: "Enjoy a sourdough loaf and premium pastry of choice.",
    cost: 300,
    stock: 40,
    badge: "Popular",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "gym-pass",
    title: "Gym Pass",
    partner: "FitZone Studio",
    description: "Full day usage pass including group training and indoor pool access.",
    cost: 1800,
    stock: 10,
    badge: "Limited",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "cinema-ticket",
    title: "Cinema Ticket",
    partner: "Starlight Screens",
    description: "One general admission ticket for any standard screening.",
    cost: 850,
    stock: 22,
    badge: "Popular",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "ice-cream",
    title: "Ice Cream Coupon",
    partner: "Creamy Scoop",
    description: "Dual scoops of handcrafted premium dairy or vegan gelato.",
    cost: 400,
    stock: 35,
    badge: "New",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "bookstore-voucher",
    title: "Bookstore Voucher",
    partner: "PageTurner",
    description: "Get RM15 store credit applicable to any book or stationery.",
    cost: 600,
    stock: 18,
    badge: "Best Value",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80"
  },

  // Shopping
  {
    id: "eco-tshirt",
    title: "Eco T-Shirt",
    partner: "EcoWear Co.",
    description: "Made from 100% certified organic ring-spun cotton and plant dyes.",
    cost: 2500,
    stock: 12,
    badge: "Popular",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "grocery-voucher",
    title: "Grocery Voucher",
    partner: "Village Organics",
    description: "Get RM50 off your bill on natural groceries and local fresh goods.",
    cost: 1200,
    stock: 20,
    badge: "Best Value",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "gift-card",
    title: "Gift Card",
    partner: "MultiMall Retail",
    description: "RM100 universal e-voucher valid across 100+ partner outlets.",
    cost: 2000,
    stock: 10,
    badge: "New",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1572715655204-47e297d38a5f?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "campus-credit",
    title: "Campus Store Credit",
    partner: "UniShop Outlet",
    description: "RM30 credit for campus bookstore, uniform, and school gear.",
    cost: 800,
    stock: 30,
    badge: "Popular",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1527891751199-7225231a68dd?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "electronics-discount",
    title: "Electronics Discount",
    partner: "LoopTech Solutions",
    description: "15% discount voucher for energy star certified consumer systems.",
    cost: 3000,
    stock: 5,
    badge: "Limited",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "sports-voucher",
    title: "Sports Store Voucher",
    partner: "EcoSport",
    description: "RM50 voucher code for hiking gear, athletic shoes, and accessories.",
    cost: 1500,
    stock: 14,
    badge: "Best Value",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "fashion-voucher",
    title: "Fashion Voucher",
    partner: "UrbanFit",
    description: "30% off modern eco-friendly apparel collection items.",
    cost: 1800,
    stock: 16,
    badge: "New",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reusable-bottle",
    title: "Reusable Bottle",
    partner: "HydroEco",
    description: "Insulated 1L steel thermo flask designed to reduce plastic use.",
    cost: 950,
    stock: 25,
    badge: "Popular",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80"
  },

  // Eco Impact
  {
    id: "plant-tree",
    title: "Plant One Tree",
    partner: "Reforest Malaysia",
    description: "Contribute one native sapling planting in Borneo with digital tracking.",
    cost: 500,
    stock: 999,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "carbon-offset",
    title: "Carbon Offset",
    partner: "Climate Action",
    description: "Retire 50kg of certified carbon credits from regional wind setups.",
    cost: 1000,
    stock: 999,
    badge: "Best Value",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "recycling-reward",
    title: "Recycling Reward",
    partner: "ZeroWaste Initiative",
    description: "Support circular recycling loops for up to 10kg of school plastics.",
    cost: 400,
    stock: 999,
    badge: "New",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "wildlife-donation",
    title: "Wildlife Donation",
    partner: "ForestGuard",
    description: "Adopt or protect endangered tapirs and local tigers in reserves.",
    cost: 800,
    stock: 999,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "river-protection",
    title: "River Protection",
    partner: "CleanWaters MY",
    description: "Fund river interceptor operations and waste sorting nets.",
    cost: 1200,
    stock: 999,
    badge: "Limited",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "campus-donation",
    title: "Green Campus Donation",
    partner: "EcoCampus Foundation",
    description: "Contribute to building solar charging arrays on university blocks.",
    cost: 1000,
    stock: 999,
    badge: "Best Value",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "community-cleanup",
    title: "Community Clean-up",
    partner: "GreenHands Foundation",
    description: "Fund glove, bag, and hydration equipment for volunteer cleanups.",
    cost: 350,
    stock: 999,
    badge: "New",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "solar-contribution",
    title: "Solar Energy Contribution",
    partner: "SunPower Alliance",
    description: "Support off-grid solar kits deployments in remote rural communities.",
    cost: 1500,
    stock: 999,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80"
  }
];

export default function RewardsPage() {
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const spendCoins = useDashboardStore((state) => state.spendCoins);

  // States
  const [activeCategory, setActiveCategory] = useState<RewardCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [myRewardsOpen, setMyRewardsOpen] = useState(false);
  const [myRewardsTab, setMyRewardsTab] = useState<"Active" | "Used" | "Expired">("Active");
  const [redemptionHistory, setRedemptionHistory] = useState<RedeemedEntry[]>([]);
  const [successModal, setSuccessModal] = useState<{ reward: Reward; remaining: number } | null>(null);
  const [detailReward, setDetailReward] = useState<Reward | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("Most Popular");
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // 1. Mount Persistence Hydration
  useEffect(() => {
    try {
      const savedCategory = localStorage.getItem("eco_rewards_activeCategory");
      if (savedCategory) setActiveCategory(JSON.parse(savedCategory));
      
      const savedPage = localStorage.getItem("eco_rewards_currentPage");
      if (savedPage) setCurrentPage(Number(savedPage));

      const savedOpen = localStorage.getItem("eco_rewards_myRewardsOpen");
      if (savedOpen) setMyRewardsOpen(JSON.parse(savedOpen));

      const savedTab = localStorage.getItem("eco_rewards_myRewardsTab");
      if (savedTab) setMyRewardsTab(JSON.parse(savedTab));

      const savedHistory = localStorage.getItem("eco_rewards_redemptionHistory");
      if (savedHistory) {
        setRedemptionHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load rewards state", e);
    }
    setIsStateLoaded(true);
  }, []);

  // 2. State Auto-Saving to LocalStorage
  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("eco_rewards_activeCategory", JSON.stringify(activeCategory));
  }, [activeCategory, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("eco_rewards_currentPage", String(currentPage));
  }, [currentPage, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("eco_rewards_myRewardsOpen", JSON.stringify(myRewardsOpen));
  }, [myRewardsOpen, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("eco_rewards_myRewardsTab", JSON.stringify(myRewardsTab));
  }, [myRewardsTab, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("eco_rewards_redemptionHistory", JSON.stringify(redemptionHistory));
  }, [redemptionHistory, isStateLoaded]);

  // Compute stats on active category
  const filteredRewards = useMemo(() => {
    if (!activeCategory) return [];
    const query = searchQuery.trim().toLowerCase();
    const list = rewardsData.filter((r) => {
      const matchesCategory = r.category === activeCategory;
      const matchesQuery = !query || r.title.toLowerCase().includes(query) || r.partner.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (sortOption === "Lowest EcoCoins") return a.cost - b.cost;
      if (sortOption === "Highest EcoCoins") return b.cost - a.cost;
      if (sortOption === "Newest") return Number(b.badge === "New") - Number(a.badge === "New");
      return Number(b.badge === "Popular") - Number(a.badge === "Popular") || b.stock - a.stock;
    });
  }, [activeCategory, searchQuery, sortOption]);

  // Total pages calculation (exactly 4 rewards per page)
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / itemsPerPage));

  // Scoped active rewards
  const paginatedRewards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRewards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRewards, currentPage]);

  // Reset page when category changes
  const handleCategorySelect = (categoryId: RewardCategory) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  // Redemption Action
  const handleRedeem = (reward: Reward) => {
    if (walletCoins < reward.cost) return;
    
    // Spend coins in state & store
    const success = spendCoins(reward.cost);
    if (!success) return;

    const redeemedAt = new Date();
    const expiresAt = new Date(redeemedAt.getTime() + 30 * 86_400_000);

    const newEntry: RedeemedEntry = {
      id: `${reward.id}-${Date.now()}`,
      reward,
      redeemedAt: redeemedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "Active"
    };

    setRedemptionHistory((prev) => [newEntry, ...prev]);
    setSuccessModal({ reward, remaining: walletCoins - reward.cost });
    setDetailReward(null);
  };

  // Toggle status of voucher for fidelity simulation
  const handleUseVoucher = (id: string) => {
    setRedemptionHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "Used" as const } : entry
      )
    );
  };

  // Organize history categories dynamically
  const activeVouchers = redemptionHistory.filter((entry) => {
    const isExpired = new Date(entry.expiresAt) < new Date();
    return entry.status === "Active" && !isExpired;
  });

  const usedVouchers = redemptionHistory.filter((entry) => entry.status === "Used");

  const expiredVouchers = redemptionHistory.filter((entry) => {
    const isExpired = new Date(entry.expiresAt) < new Date();
    return entry.status === "Expired" || (entry.status === "Active" && isExpired);
  });

  const tabListVouchers = useMemo(() => {
    if (myRewardsTab === "Active") return activeVouchers;
    if (myRewardsTab === "Used") return usedVouchers;
    return expiredVouchers;
  }, [myRewardsTab, activeVouchers, usedVouchers, expiredVouchers]);

  return (
    <CockpitShell activeMode="rewards">
      <main className="cockpit-main cockpit-main--rewards">
        <section className="primary-panel" aria-labelledby="rewards-title">
          
          {/* Top Panel - Balance Dashboard */}
          <header className="marketplace-top-summary">
            <div className="balance-info-hero">
              <div className="balance-info-left">
                <span className="summary-eyebrow">Available Balance</span>
                <h1 className="coins-value-display" id="rewards-title">
                  <EcoCoin size={44} />
                  {walletCoins.toLocaleString()} <span className="currency-label">EcoCoins</span>
                </h1>
              </div>
              <div className="summary-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Monthly Earned</span>
                  <strong className="metric-value text-green">+1,200</strong>
                </div>
                <div className="metric-box text-alert-box">
                  <span className="metric-label">Expiring Soon</span>
                  <strong className="metric-value text-amber">320</strong>
                  <span className="metric-sub">in 5 days</span>
                </div>
              </div>
            </div>
            
            <button 
              className="my-rewards-trigger-btn" 
              onClick={() => setMyRewardsOpen(true)}
              type="button"
            >
              <Ticket size={16} />
              My Rewards
              <span className="trigger-badge">{activeVouchers.length}</span>
            </button>
          </header>

          {/* MAIN DYNAMIC VIEW */}
          <div className="marketplace-workspace-area">
            
            {/* VIEW A: CATEGORIES LANDING HOME */}
            {!activeCategory ? (
              <div className="categories-landing-view">
                <div className="landing-heading">
                  <h2>Select a Category to Browse Rewards</h2>
                  <p>Choose an area below to view available vouchers, offers, and positive climate actions.</p>
                </div>
                <div className="categories-cards-grid">
                  {categoriesInfo.map((cat) => {
                    const count = rewardsData.filter((r) => r.category === cat.id).length;
                    return (
                      <article 
                        className="category-card" 
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                      >
                        <div className="category-card-image-wrapper">
                          <img alt={cat.title} src={cat.image} />
                          <div className="category-image-tint" />
                        </div>
                        <div className="category-card-content">
                          <span className="category-card-icon">{cat.icon}</span>
                          <h3>{cat.title}</h3>
                          <p>{cat.description}</p>
                          <span className="category-rewards-count">{count} Rewards Available</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              
              /* VIEW B: REWARD GRID FOR SELECTED CATEGORY */
              <div className="rewards-grid-view">
                
                {/* Nav tools toolbar */}
                <div className="rewards-nav-toolbar">
                  <button 
                    className="back-to-categories-btn" 
                    onClick={() => setActiveCategory(null)}
                    type="button"
                  >
                    <ArrowLeft size={16} />
                    Back to Categories
                  </button>
                  
                  <div className="nav-toolbar-right">
                    <div className="nav-search-wrapper">
                      <Search size={14} className="search-icon-svg" />
                      <input 
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                        placeholder="Search rewards..." 
                        type="text" 
                        value={searchQuery} 
                      />
                    </div>
                    <div className="nav-sort-wrapper">
                      <select 
                        onChange={(e) => { setSortOption(e.target.value as SortOption); setCurrentPage(1); }} 
                        value={sortOption}
                      >
                        <option value="Most Popular">Most Popular</option>
                        <option value="Lowest EcoCoins">Lowest EcoCoins</option>
                        <option value="Highest EcoCoins">Highest EcoCoins</option>
                        <option value="Newest">Newest</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid-category-header">
                  <h2>{activeCategory}</h2>
                  <span className="results-indicator">{filteredRewards.length} items found</span>
                </div>

                {/* 4 Cards Grid */}
                <div className="rewards-cards-container">
                  {paginatedRewards.length ? (
                    paginatedRewards.map((reward) => {
                      const canRedeem = walletCoins >= reward.cost;
                      return (
                        <article 
                          className="reward-item-card" 
                          key={reward.id}
                          onClick={() => setDetailReward(reward)}
                        >
                          <div className="reward-card-image">
                            <img alt={reward.title} src={reward.image} />
                            <span className={`reward-badge-pill badge-${reward.badge.toLowerCase().replace(" ", "-")}`}>
                              {reward.badge}
                            </span>
                            <div className="card-image-shade" />
                          </div>
                          
                          <div className="reward-card-details">
                            <div className="reward-card-header-info">
                              <h3>{reward.title}</h3>
                              <span className="partner-label">{reward.partner}</span>
                            </div>
                            
                            <p className="reward-card-desc">{reward.description}</p>
                            
                            <div className="reward-card-bottom-row">
                              <div className="cost-tag-wrapper">
                                <EcoCoin size={20} />
                                <strong>{reward.cost.toLocaleString()}</strong>
                                <small>EcoCoins</small>
                              </div>
                              
                              <button 
                                className="redeem-action-btn" 
                                disabled={!canRedeem}
                                onClick={(e) => { e.stopPropagation(); handleRedeem(reward); }}
                                type="button"
                              >
                                {canRedeem ? "Redeem" : "Insufficient Coins"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rewards-grid-empty">
                      <strong>No rewards match your search criteria.</strong>
                      <p>Try searching for another keyword or clear the search query filter.</p>
                      <button onClick={() => setSearchQuery("")} type="button">Clear Search</button>
                    </div>
                  )}
                </div>

                {/* Pagination Controls - Always Visible */}
                {filteredRewards.length > 0 && (
                  <footer className="rewards-grid-pagination">
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <span className="pagination-text">
                      Page <strong>{currentPage}</strong> of {totalPages}
                    </span>
                    
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      type="button"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </footer>
                )}
              </div>
            )}
          </div>

        </section>
      </main>

      {/* DRAW PANEL: MY REWARDS */}
      {myRewardsOpen && (
        <div className="marketplace-overlay" onClick={() => setMyRewardsOpen(false)} role="presentation">
          <section className="my-rewards-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <header className="drawer-header">
              <div>
                <span className="drawer-eyebrow">Redeemed Vouchers</span>
                <h2>My Rewards</h2>
              </div>
              <button className="close-drawer-btn" onClick={() => setMyRewardsOpen(false)} type="button">×</button>
            </header>
            
            <div className="drawer-tabs-row" role="tablist">
              {(["Active", "Used", "Expired"] as const).map((tab) => {
                let badgeCount = 0;
                if (tab === "Active") badgeCount = activeVouchers.length;
                if (tab === "Used") badgeCount = usedVouchers.length;
                if (tab === "Expired") badgeCount = expiredVouchers.length;

                return (
                  <button 
                    aria-selected={myRewardsTab === tab} 
                    className={myRewardsTab === tab ? "tab-btn active" : "tab-btn"} 
                    key={tab} 
                    onClick={() => setMyRewardsTab(tab)}
                    role="tab" 
                    type="button"
                  >
                    {tab} ({badgeCount})
                  </button>
                );
              })}
            </div>

            <div className="drawer-content-scrollable">
              {tabListVouchers.length ? (
                <div className="drawer-rewards-list">
                  {tabListVouchers.map((entry) => {
                    const rDate = new Date(entry.redeemedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
                    const eDate = new Date(entry.expiresAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
                    
                    return (
                      <article className="drawer-reward-item" key={entry.id}>
                        <img alt={entry.reward.title} src={entry.reward.image} />
                        <div className="drawer-reward-info">
                          <h3>{entry.reward.title}</h3>
                          <span className="drawer-partner-label">{entry.reward.partner}</span>
                          
                          <div className="drawer-fact-row">
                            <span className="fact-item">Redeemed: <b>{rDate}</b></span>
                            <span className="fact-item">Expires: <b>{eDate}</b></span>
                          </div>

                          <div className="drawer-action-row">
                            <span className="spent-tag"><EcoCoin size={12} /> {entry.reward.cost} EcoCoins</span>
                            {myRewardsTab === "Active" && (
                              <button 
                                className="use-voucher-action"
                                onClick={() => handleUseVoucher(entry.id)}
                                type="button"
                              >
                                Use Voucher
                              </button>
                            )}
                            {myRewardsTab === "Used" && <span className="status-badge used-badge">✓ Used</span>}
                            {myRewardsTab === "Expired" && <span className="status-badge expired-badge">Expired</span>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="drawer-empty-state">
                  <Gift size={32} className="empty-icon-svg" />
                  <strong>No rewards in this section</strong>
                  <p>Browse the catalog and redeem vouchers using your earned EcoCoins.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {detailReward && (
        <div className="marketplace-overlay marketplace-overlay--center" onClick={() => setDetailReward(null)} role="presentation">
          <section className="reward-detail-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close-btn" onClick={() => setDetailReward(null)} type="button">×</button>
            <div className="detail-dialog-grid">
              <div className="detail-dialog-banner">
                <img alt={detailReward.title} src={detailReward.image} />
                <span className="detail-badge-label">{detailReward.badge}</span>
              </div>
              <div className="detail-dialog-body">
                <span className="detail-partner">{detailReward.partner}</span>
                <h2>{detailReward.title}</h2>
                <p className="detail-description">{detailReward.description}</p>
                
                <div className="detail-cost-display">
                  <EcoCoin size={24} />
                  <strong>{detailReward.cost.toLocaleString()}</strong>
                  <small>EcoCoins Required</small>
                </div>

                <div className="detail-terms-box">
                  <h4>Voucher Terms</h4>
                  <p>Redemption is non-refundable. Expires 30 days from date of purchase. Must be presentable on this device in-vehicle at target partner locations.</p>
                </div>

                <button 
                  className="detail-redeem-btn" 
                  disabled={walletCoins < detailReward.cost}
                  onClick={() => handleRedeem(detailReward)}
                  type="button"
                >
                  {walletCoins >= detailReward.cost ? "Redeem Now" : "Not Enough EcoCoins"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* REDEMPTION SUCCESS MODAL */}
      {successModal && (
        <div className="marketplace-overlay marketplace-overlay--center" role="presentation">
          <section className="redemption-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrapper">
              <CheckCircle2 size={48} className="success-checkmark-svg" />
            </div>
            
            <h2>Redemption Successful!</h2>
            <p className="success-tagline">Your eco-reward is ready to use.</p>
            
            <div className="success-summary-card">
              <h3>{successModal.reward.title}</h3>
              <span className="partner-text">{successModal.reward.partner}</span>
              
              <div className="success-points-math">
                <div className="math-row">
                  <span>EcoCoins Spent</span>
                  <strong className="text-red">-{successModal.reward.cost.toLocaleString()}</strong>
                </div>
                <div className="math-row border-top-divider">
                  <span>Remaining Balance</span>
                  <strong className="text-green"><EcoCoin size={14} />{successModal.remaining.toLocaleString()}</strong>
                </div>
              </div>
            </div>
            
            <p className="voucher-instructions">This voucher has been stored under "My Rewards" and is valid for 30 days.</p>
            
            <div className="success-modal-actions">
              <button 
                className="success-btn-primary" 
                onClick={() => { setSuccessModal(null); setMyRewardsOpen(true); }}
                type="button"
              >
                View My Rewards
              </button>
              <button 
                className="success-btn-secondary" 
                onClick={() => setSuccessModal(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Vanilla Styling matching Tesla/Mercedes Infotainment Aesthetics */}
      <style>{styleSheet}</style>
    </CockpitShell>
  );
}

const styleSheet = `
  /* Premium Cockpit Screen Styles overrides & layout stability */
  .cockpit-main--rewards {
    min-height: calc(100vh - 120px);
    padding: 88px 28px 100px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
  
  .primary-panel {
    background: rgba(10, 18, 19, 0.82);
    border: 1px solid rgba(38, 59, 58, 0.78);
    border-radius: 8px;
    padding: 22px;
    gap: 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  
  /* Top Panel: EcoCoins Summary layout styling (infotainment feel) */
  .marketplace-top-summary {
    background: linear-gradient(135deg, rgba(16, 31, 30, 0.95) 0%, rgba(10, 20, 20, 0.9) 100%);
    border: 1px solid rgba(55, 229, 143, 0.35);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    flex-shrink: 0;
  }

  .balance-info-hero {
    display: flex;
    align-items: center;
    gap: 48px;
    flex: 1;
  }

  .balance-info-left {
    display: grid;
    gap: 4px;
  }

  .summary-eyebrow {
    color: #8fa69f;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .coins-value-display {
    color: #f4fff9;
    font-size: clamp(32px, 3.5vw, 42px);
    font-weight: 950;
    letter-spacing: -0.04em;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .currency-label {
    font-size: 14px;
    font-weight: 800;
    color: #37e58f;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-left: 2px;
  }

  .summary-metrics-grid {
    display: flex;
    gap: 24px;
    border-left: 1px solid rgba(55, 229, 143, 0.2);
    padding-left: 32px;
  }

  .metric-box {
    display: grid;
    gap: 2px;
  }

  .metric-label {
    color: #81958f;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 900;
  }

  .text-green { color: #37e58f; }
  .text-amber { color: #f5b84b; }
  .text-red { color: #ff5c4e; }
  
  .text-alert-box {
    position: relative;
  }
  .metric-sub {
    font-size: 8px;
    color: #657b74;
    font-weight: 800;
  }

  /* My Rewards Button */
  .my-rewards-trigger-btn {
    background: linear-gradient(135deg, rgba(55, 229, 143, 0.22) 0%, rgba(55, 229, 143, 0.08) 100%);
    border: 1px solid rgba(55, 229, 143, 0.6);
    border-radius: 8px;
    color: #eafff5;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .my-rewards-trigger-btn:hover {
    background: rgba(55, 229, 143, 0.28);
    border-color: #37e58f;
    box-shadow: 0 0 16px rgba(55, 229, 143, 0.15);
    transform: translateY(-1px);
  }

  .trigger-badge {
    background: #37e58f;
    color: #081312;
    font-size: 8px;
    font-weight: 950;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  /* Workspace Area Height controls */
  .marketplace-workspace-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* VIEW A: CATEGORY LANDING HOME */
  .categories-landing-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
    gap: 16px;
  }

  .landing-heading {
    margin-top: 4px;
  }

  .landing-heading h2 {
    color: #f4fff9;
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 4px 0;
  }

  .landing-heading p {
    color: #8fa69f;
    font-size: 12px;
    margin: 0;
  }

  .categories-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    flex: 1;
    min-height: 250px;
    margin-bottom: 4px;
  }

  .category-card {
    background: rgba(14, 25, 24, 0.85);
    border: 1px solid rgba(55, 229, 143, 0.2);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .category-card-image-wrapper {
    height: 48%;
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .category-card-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .category-image-tint {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(14, 25, 24, 0.98) 100%);
  }

  .category-card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: rgba(14, 25, 24, 0.6);
  }

  .category-card-icon {
    font-size: 24px;
    margin-bottom: 6px;
    display: block;
  }

  .category-card h3 {
    color: #f4fff9;
    font-size: 18px;
    font-weight: 900;
    margin: 0 0 6px 0;
    letter-spacing: -0.01em;
  }

  .category-card p {
    color: #9db3ad;
    font-size: 11px;
    line-height: 1.5;
    margin: 0 0 12px 0;
    flex: 1;
  }

  .category-rewards-count {
    color: #37e58f;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* Category card hover animations */
  .category-card:hover {
    border-color: rgba(55, 229, 143, 0.85);
    box-shadow: 0 12px 36px rgba(55, 229, 143, 0.14);
    transform: translateY(-4px);
  }

  .category-card:hover .category-card-image-wrapper img {
    transform: scale(1.08);
  }

  /* VIEW B: REWARDS LIST GRID VIEW */
  .rewards-grid-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /* Nav Toolbar */
  .rewards-nav-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .back-to-categories-btn {
    background: rgba(142, 165, 160, 0.1);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 8px;
    color: #eafff5;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    transition: all 0.2s ease;
  }

  .back-to-categories-btn:hover {
    background: rgba(142, 165, 160, 0.22);
    border-color: #8fa69f;
  }

  .nav-toolbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .nav-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon-svg {
    position: absolute;
    left: 12px;
    color: #728a83;
  }

  .nav-search-wrapper input {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.35);
    border-radius: 8px;
    color: #eafff5;
    font-size: 11px;
    height: 34px;
    outline: 0;
    padding: 0 12px 0 32px;
    width: 200px;
    transition: all 0.2s ease;
  }

  .nav-search-wrapper input:focus {
    border-color: #37e58f;
    width: 250px;
  }

  .nav-sort-wrapper select {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.35);
    border-radius: 8px;
    color: #eafff5;
    font-size: 11px;
    height: 34px;
    outline: 0;
    padding: 0 8px;
    cursor: pointer;
  }

  .grid-category-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .grid-category-header h2 {
    color: #f4fff9;
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }

  .results-indicator {
    color: #78908a;
    font-size: 10px;
  }

  /* 4 Cards Container */
  .rewards-cards-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    flex: 1;
    min-height: 0;
    align-content: stretch;
  }

  .reward-item-card {
    background: linear-gradient(180deg, rgba(14, 25, 24, 0.98) 0%, rgba(9, 18, 17, 0.98) 100%);
    border: 1px solid rgba(91, 119, 112, 0.25);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .reward-item-card:hover {
    border-color: rgba(55, 229, 143, 0.55);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
    transform: translateY(-3px);
  }

  .reward-card-image {
    height: 44%;
    width: 100%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .reward-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-image-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(14, 25, 24, 0.8) 100%);
  }

  .reward-badge-pill {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 2;
  }

  .badge-popular { background: rgba(55, 229, 143, 0.2); border: 1px solid #37e58f; color: #37e58f; }
  .badge-best-value { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; }
  .badge-limited { background: rgba(245, 184, 75, 0.2); border: 1px solid #f5b84b; color: #f5b84b; }
  .badge-new { background: rgba(255, 255, 255, 0.15); border: 1px solid #ffffff; color: #ffffff; }

  .reward-card-details {
    padding: 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  }

  .reward-card-header-info {
    display: grid;
    gap: 2px;
  }

  .reward-card-header-info h3 {
    color: #f4fff9;
    font-size: 15px;
    font-weight: 800;
    margin: 0;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .partner-label {
    color: #65a990;
    font-size: 9px;
    font-weight: 700;
  }

  .reward-card-desc {
    color: #9db1ac;
    font-size: 10px;
    line-height: 1.4;
    margin: 0;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .reward-card-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    flex-shrink: 0;
  }

  .cost-tag-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #37e58f;
  }

  .cost-tag-wrapper strong {
    font-size: 18px;
    font-weight: 950;
  }

  .cost-tag-wrapper small {
    font-size: 8px;
    color: #77a795;
    text-transform: uppercase;
    font-weight: 800;
  }

  .redeem-action-btn {
    background: #37e58f;
    border: 0;
    border-radius: 6px;
    color: #03120b;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
    padding: 8px 12px;
    transition: all 0.2s ease;
  }

  .redeem-action-btn:hover:not(:disabled) {
    background: #54f0a3;
  }

  .redeem-action-btn:disabled {
    background: #202d2b;
    color: #667a75;
    cursor: not-allowed;
  }

  .rewards-grid-empty {
    grid-column: 1 / -1;
    text-align: center;
    align-content: center;
    padding: 48px;
  }

  .rewards-grid-empty strong {
    color: #f4fff9;
    font-size: 14px;
    display: block;
    margin-bottom: 6px;
  }

  .rewards-grid-empty p {
    color: #8fa69f;
    font-size: 11px;
    margin: 0 0 16px 0;
  }

  .rewards-grid-empty button {
    background: rgba(142, 165, 160, 0.1);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 10px;
    padding: 8px 16px;
    cursor: pointer;
  }

  /* Pagination controls styling */
  .rewards-grid-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0 0 0;
    border-top: 1px solid rgba(55, 229, 143, 0.15);
    margin-top: 12px;
    flex-shrink: 0;
  }

  .pagination-btn {
    background: rgba(14, 25, 24, 0.8);
    border: 1px solid rgba(55, 229, 143, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    transition: all 0.2s ease;
  }

  .pagination-btn:hover:not(:disabled) {
    background: rgba(55, 229, 143, 0.15);
    border-color: #37e58f;
  }

  .pagination-btn:disabled {
    border-color: rgba(93, 119, 113, 0.18);
    color: #657b74;
    cursor: not-allowed;
  }

  .pagination-text {
    color: #8fa69f;
    font-size: 11px;
  }

  /* MODAL OVERLAYS & SUCCESS SCREENS */
  .marketplace-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }

  .marketplace-overlay--center {
    justify-content: center;
    align-items: center;
    padding: 24px;
  }

  /* My Rewards side drawer */
  .my-rewards-drawer-panel {
    background: radial-gradient(circle at 100% 0, rgba(55, 229, 143, 0.12), transparent 30%), #081211;
    border-left: 1px solid rgba(55, 229, 143, 0.3);
    box-shadow: -16px 0 48px rgba(0, 0, 0, 0.65);
    width: min(90vw, 440px);
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    box-sizing: border-box;
  }

  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .drawer-eyebrow {
    color: #37e58f;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .drawer-header h2 {
    color: #f4fff9;
    font-size: 24px;
    font-weight: 900;
    margin: 4px 0 0 0;
    letter-spacing: -0.02em;
  }

  .close-drawer-btn {
    background: rgba(142, 165, 160, 0.1);
    border: 1px solid rgba(142, 165, 160, 0.25);
    border-radius: 50%;
    color: #bdcec9;
    font-size: 20px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .drawer-tabs-row {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.2);
    border-radius: 8px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 16px 0;
    padding: 4px;
  }

  .tab-btn {
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: #7e928c;
    font-size: 10px;
    font-weight: 800;
    height: 32px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: rgba(55, 229, 143, 0.14);
    color: #37e58f;
  }

  .drawer-content-scrollable {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(55, 229, 143, 0.3) transparent;
  }

  .drawer-content-scrollable::-webkit-scrollbar {
    width: 4px;
  }
  .drawer-content-scrollable::-webkit-scrollbar-thumb {
    background: rgba(55, 229, 143, 0.3);
    border-radius: 4px;
  }

  .drawer-rewards-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .drawer-reward-item {
    background: linear-gradient(135deg, rgba(14, 25, 24, 0.95) 0%, rgba(9, 17, 16, 0.95) 100%);
    border: 1px solid rgba(93, 124, 116, 0.25);
    border-radius: 10px;
    display: flex;
    overflow: hidden;
    height: 100px;
  }

  .drawer-reward-item img {
    width: 90px;
    height: 100%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .drawer-reward-info {
    padding: 10px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  .drawer-reward-info h3 {
    color: #f4fff9;
    font-size: 13px;
    font-weight: 800;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-partner-label {
    color: #65a990;
    font-size: 8px;
    font-weight: 700;
    margin-top: -2px;
    display: block;
  }

  .drawer-fact-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 2px 0;
  }

  .fact-item {
    font-size: 8px;
    color: #728780;
  }

  .fact-item b {
    color: #bdcec9;
  }

  .drawer-action-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .spent-tag {
    color: #8fa69f;
    font-size: 9px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .use-voucher-action {
    background: rgba(55, 229, 143, 0.15);
    border: 1px solid rgba(55, 229, 143, 0.5);
    border-radius: 4px;
    color: #37e58f;
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
    padding: 4px 10px;
    transition: all 0.2s ease;
  }

  .use-voucher-action:hover {
    background: #37e58f;
    color: #081312;
  }

  .status-badge {
    font-size: 9px;
    font-weight: 800;
  }
  .used-badge { color: #81958f; }
  .expired-badge { color: #ff5c4e; }

  .drawer-empty-state {
    text-align: center;
    padding: 60px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .empty-icon-svg {
    color: #203530;
  }

  .drawer-empty-state strong {
    color: #eafff5;
    font-size: 14px;
  }

  .drawer-empty-state p {
    color: #7d918b;
    font-size: 10px;
    line-height: 1.5;
    margin: 0;
  }

  /* Detail Dialog Panel overlay */
  .reward-detail-dialog {
    background: #081211;
    border: 1px solid rgba(55, 229, 143, 0.3);
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    max-width: 680px;
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .detail-close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    background: rgba(14, 25, 24, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: #ffffff;
    font-size: 20px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .detail-dialog-grid {
    display: grid;
    grid-template-columns: 42% 58%;
    min-height: 380px;
  }

  .detail-dialog-banner {
    position: relative;
    overflow: hidden;
  }

  .detail-dialog-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .detail-badge-label {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(8, 18, 17, 0.85);
    border: 1px solid #37e58f;
    color: #37e58f;
    font-size: 8px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .detail-dialog-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }

  .detail-partner {
    color: #37e58f;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-dialog-body h2 {
    color: #f4fff9;
    font-size: 22px;
    font-weight: 900;
    margin: -4px 0 0 0;
  }

  .detail-description {
    color: #9db1ab;
    font-size: 11px;
    line-height: 1.5;
    margin: 0;
  }

  .detail-cost-display {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #37e58f;
  }

  .detail-cost-display strong {
    font-size: 28px;
    font-weight: 950;
    letter-spacing: -0.02em;
  }

  .detail-cost-display small {
    font-size: 9px;
    color: #769b8d;
    text-transform: uppercase;
    font-weight: 800;
  }

  .detail-terms-box {
    background: rgba(14, 25, 24, 0.7);
    border: 1px solid rgba(55, 229, 143, 0.1);
    border-radius: 8px;
    padding: 10px 12px;
  }

  .detail-terms-box h4 {
    color: #eafff5;
    font-size: 9px;
    margin: 0 0 4px 0;
    text-transform: uppercase;
  }

  .detail-terms-box p {
    color: #748983;
    font-size: 9px;
    line-height: 1.4;
    margin: 0;
  }

  .detail-redeem-btn {
    background: #37e58f;
    border: 0;
    border-radius: 8px;
    color: #03120b;
    font-size: 12px;
    font-weight: 950;
    height: 42px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .detail-redeem-btn:hover:not(:disabled) {
    background: #54f0a3;
  }

  .detail-redeem-btn:disabled {
    background: #202d2b;
    color: #667a75;
    cursor: not-allowed;
  }

  /* Redemption success modal styling */
  .redemption-success-modal {
    background: #081211;
    border: 1px solid #37e58f;
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    max-width: 360px;
    width: 100%;
    padding: 24px;
    box-sizing: border-box;
    text-align: center;
  }

  .success-icon-wrapper {
    color: #37e58f;
    margin-bottom: 12px;
  }

  .redemption-success-modal h2 {
    color: #f4fff9;
    font-size: 20px;
    font-weight: 900;
    margin: 0;
  }

  .success-tagline {
    color: #8fa69f;
    font-size: 11px;
    margin: 4px 0 16px 0;
  }

  .success-summary-card {
    background: rgba(14, 25, 24, 0.8);
    border: 1px solid rgba(55, 229, 143, 0.15);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 14px;
  }

  .success-summary-card h3 {
    color: #f4fff9;
    font-size: 15px;
    font-weight: 800;
    margin: 0;
  }

  .partner-text {
    color: #65a990;
    font-size: 9px;
    display: block;
    margin-top: 2px;
  }

  .success-points-math {
    margin-top: 12px;
    display: grid;
    gap: 8px;
  }

  .math-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #8fa69f;
  }

  .border-top-divider {
    border-top: 1px solid rgba(55, 229, 143, 0.15);
    padding-top: 8px;
  }

  .voucher-instructions {
    color: #728780;
    font-size: 9px;
    line-height: 1.4;
    margin: 0 0 20px 0;
  }

  .success-modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .success-btn-primary {
    background: #37e58f;
    border: 0;
    border-radius: 8px;
    color: #03120b;
    font-size: 11px;
    font-weight: 900;
    height: 38px;
    cursor: pointer;
  }

  .success-btn-secondary {
    background: rgba(142, 165, 160, 0.15);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 8px;
    color: #eafff5;
    font-size: 11px;
    font-weight: 800;
    height: 38px;
    cursor: pointer;
  }

  /* RESPONSIVE SCALING */
  @media (max-width: 1024px) {
    .categories-cards-grid {
      grid-template-columns: repeat(2, 1fr);
      min-height: 480px;
    }
    .rewards-cards-container {
      grid-template-columns: repeat(2, 1fr);
    }
    .reward-card-image {
      height: 120px;
    }
  }

  @media (max-width: 640px) {
    .cockpit-main--rewards {
      padding: 70px 12px 90px;
    }
    .primary-panel {
      padding: 12px;
      gap: 12px;
    }
    .marketplace-top-summary {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 14px;
    }
    .balance-info-hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .summary-metrics-grid {
      border-left: 0;
      padding-left: 0;
      gap: 16px;
    }
    .categories-cards-grid {
      grid-template-columns: 1fr;
      min-height: auto;
    }
    .rewards-cards-container {
      grid-template-columns: 1fr;
    }
    .detail-dialog-grid {
      grid-template-columns: 1fr;
    }
    .detail-dialog-banner {
      height: 160px;
    }
  }
`;
