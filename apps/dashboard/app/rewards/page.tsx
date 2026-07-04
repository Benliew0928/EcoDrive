"use client";

import { useEffect, useMemo, useState } from "react";
import { CockpitShell } from "../../components/cockpit-shell";
import { useDashboardStore } from "../../lib/dashboard-store";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Gift, 
  AlertTriangle,
  Search,
  Ticket,
  ChevronDown
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
  redeemedAt: string;
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
    description: "Eco charging credits, diagnostics checks, preferred parking spots, and support packs.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    icon: "🚗"
  },
  {
    id: "Lifestyle",
    title: "Lifestyle",
    description: "Premium coffee vouchers, cinema screen entries, healthy meals, and gym day passes.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    icon: "☕"
  },
  {
    id: "Shopping",
    title: "Shopping",
    description: "Eco-conscious organic garments, campus store credits, reusable gear, and mall gift vouchers.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    icon: "🛍️"
  },
  {
    id: "Eco Impact",
    title: "Eco Impact",
    description: "Directly fund tree plantings, carbon offsetting credits, and waste cleanup campaigns.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    icon: "🌱"
  }
];

const rewardsData: Reward[] = [
  // Vehicle Benefits (12 items)
  {
    id: "ev-charging-credit",
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
    id: "reserved-ev-parking",
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
    id: "premium-parking",
    title: "Premium Parking",
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
    title: "Car Wash",
    partner: "AquaEco Care",
    description: "Eco-friendly, water-reclaimed exterior detailing and shine service.",
    cost: 600,
    stock: 25,
    badge: "Best Value",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "battery-health-check",
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
    id: "vehicle-service-discount",
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
  {
    id: "interior-cleaning",
    title: "Interior Cleaning",
    partner: "PureCabin",
    description: "Deep vacuum cleaner extraction and organic scent refreshing.",
    cost: 700,
    stock: 20,
    badge: "New",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "ev-accessories",
    title: "EV Accessories",
    partner: "SleekMount",
    description: "A secure magnetic fast-charging smartphone dashboard holder.",
    cost: 1000,
    stock: 14,
    badge: "Limited",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1622037022824-0c71d511ef3c?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "premium-air-pump",
    title: "Premium Air Pump",
    partner: "VoltPressure",
    description: "Digital tire inflator accessory bundle for vehicle trunk storage.",
    cost: 1100,
    stock: 10,
    badge: "Popular",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "roadside-assistance",
    title: "Roadside Assistance",
    partner: "EcoRescue Team",
    description: "One year roadside recovery membership covering battery jumps and tows.",
    cost: 2500,
    stock: 5,
    badge: "Limited",
    category: "Vehicle Benefits",
    image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=400&q=80"
  },

  // Lifestyle (12 items)
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
    id: "bubble-tea-voucher",
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
    id: "ice-cream-coupon",
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
  {
    id: "fast-food-combo",
    title: "Fast Food Combo",
    partner: "EcoGrill Burgers",
    description: "One plant-based cheeseburger combo set with potato skin wedges.",
    cost: 750,
    stock: 25,
    badge: "Popular",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "restaurant-voucher",
    title: "Restaurant Voucher",
    partner: "Olive Garden Bistro",
    description: "RM40 discount voucher for dine-in organic dinner meals.",
    cost: 1300,
    stock: 15,
    badge: "Best Value",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "spa-discount",
    title: "Spa Discount",
    partner: "Orchid Wellness",
    description: "Get 25% off massage, hot stone relaxation therapies and body scrubs.",
    cost: 1600,
    stock: 8,
    badge: "Limited",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "hotel-voucher",
    title: "Hotel Voucher",
    partner: "Grand Horizon Hotels",
    description: "One night stay upgrade at select partner eco-resorts.",
    cost: 3500,
    stock: 3,
    badge: "Limited",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"
  },

  // Shopping (12 items)
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
    id: "campus-store-credit",
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
    id: "sports-store-voucher",
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
  {
    id: "supermarket-voucher",
    title: "Supermarket Voucher",
    partner: "EcoMart Chains",
    description: "RM25 discount voucher for green packaging household cleanups.",
    cost: 700,
    stock: 45,
    badge: "Best Value",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "smart-watch-discount",
    title: "Smart Watch Discount",
    partner: "PulseTech Wear",
    description: "20% off the latest solar powered fitness tracking watch models.",
    cost: 3200,
    stock: 8,
    badge: "New",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "headphones-discount",
    title: "Headphones Discount",
    partner: "Acoustix Gear",
    description: "Get RM60 off premium noise-canceling wireless headphones.",
    cost: 2200,
    stock: 12,
    badge: "Limited",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "online-shopping-coupon",
    title: "Online Shopping Coupon",
    partner: "ExpressCart",
    description: "RM15 off site-wide plus free carbon-neutral shipping on orders.",
    cost: 500,
    stock: 50,
    badge: "Best Value",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26a06?auto=format&fit=crop&w=400&q=80"
  },

  // Eco Impact (12 items)
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
    id: "green-campus-donation",
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
    id: "solar-contribution",
    title: "Solar Energy Contribution",
    partner: "SunPower Alliance",
    description: "Support off-grid solar kits deployments in remote rural communities.",
    cost: 1500,
    stock: 999,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80"
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
    id: "plastic-reduction",
    title: "Plastic Reduction",
    partner: "BioBag Organics",
    description: "Sponsor distribution of biodegradable bags to local night markets.",
    cost: 600,
    stock: 999,
    badge: "Best Value",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "forest-conservation",
    title: "Forest Conservation",
    partner: "GreenCanopy",
    description: "Adopt an acre of tropical rainforest to protect against logging.",
    cost: 1800,
    stock: 999,
    badge: "Limited",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "ocean-cleanup",
    title: "Ocean Cleanup",
    partner: "OceanSave Group",
    description: "Direct funding to clear 5kg of marine plastic waste from shorelines.",
    cost: 1100,
    stock: 999,
    badge: "Popular",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "renewable-energy-support",
    title: "Renewable Energy Support",
    partner: "CleanGrid Power",
    description: "Support grid integration testing of offshore wave energy devices.",
    cost: 2200,
    stock: 999,
    badge: "New",
    category: "Eco Impact",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80"
  }
];

export default function RewardsPage() {
  const walletCoins = useDashboardStore((state) => state.walletCoins);
  const spendCoins = useDashboardStore((state) => state.spendCoins);

  // Core navigation & view states
  const [activeCategory, setActiveCategory] = useState<RewardCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [myRewardsOpen, setMyRewardsOpen] = useState(false);
  const [myRewardsTab, setMyRewardsTab] = useState<"Active" | "Used" | "Expired">("Active");
  const [redemptionHistory, setRedemptionHistory] = useState<RedeemedEntry[]>([]);
  const [myRewardsPage, setMyRewardsPage] = useState(1);

  // Transient states
  const [successModal, setSuccessModal] = useState<{ reward: Reward; remaining: number } | null>(null);
  const [detailReward, setDetailReward] = useState<Reward | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("Most Popular");
  
  // Transition slide direction helper
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | "">("");
  
  // Loading hydration flag to prevent Next.js SSR blink
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // 1. Mount Persistence Hydration from localStorage
  useEffect(() => {
    try {
      const savedCategory = localStorage.getItem("dash_rewards_activeCategory");
      if (savedCategory) setActiveCategory(JSON.parse(savedCategory));
      
      const savedPage = localStorage.getItem("dash_rewards_currentPage");
      if (savedPage) setCurrentPage(Number(savedPage));

      const savedOpen = localStorage.getItem("dash_rewards_myRewardsOpen");
      if (savedOpen) setMyRewardsOpen(JSON.parse(savedOpen));

      const savedTab = localStorage.getItem("dash_rewards_myRewardsTab");
      if (savedTab) setMyRewardsTab(JSON.parse(savedTab));

      const savedHistory = localStorage.getItem("dash_rewards_redemptionHistory");
      if (savedHistory) setRedemptionHistory(JSON.parse(savedHistory));

      const savedMyPage = localStorage.getItem("dash_rewards_myRewardsPage");
      if (savedMyPage) setMyRewardsPage(Number(savedMyPage));
    } catch (e) {
      console.error("Failed to load rewards state", e);
    }
    setIsStateLoaded(true);
  }, []);

  // 2. LocalStorage Persistence Triggers
  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_activeCategory", JSON.stringify(activeCategory));
  }, [activeCategory, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_currentPage", String(currentPage));
  }, [currentPage, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_myRewardsOpen", JSON.stringify(myRewardsOpen));
  }, [myRewardsOpen, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_myRewardsTab", JSON.stringify(myRewardsTab));
  }, [myRewardsTab, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_redemptionHistory", JSON.stringify(redemptionHistory));
  }, [redemptionHistory, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem("dash_rewards_myRewardsPage", String(myRewardsPage));
  }, [myRewardsPage, isStateLoaded]);

  // Compute Active Category rewards list
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

  // 2x2 Pagination Configuration
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / itemsPerPage));

  const paginatedRewards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRewards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRewards, currentPage]);

  const handlePrevPage = () => {
    if (currentPage === 1) return;
    setSlideDirection("right");
    setTimeout(() => {
      setCurrentPage((p) => p - 1);
      setSlideDirection("");
    }, 150);
  };

  const handleNextPage = () => {
    if (currentPage === totalPages) return;
    setSlideDirection("left");
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setSlideDirection("");
    }, 150);
  };

  const handleCategorySelect = (categoryId: RewardCategory) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  // Redemption Action
  const handleRedeem = (reward: Reward) => {
    if (walletCoins < reward.cost) return;
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

  const handleUseVoucher = (id: string) => {
    setRedemptionHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "Used" as const } : entry
      )
    );
  };

  // Filter My Rewards categories
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

  // Paginate My Rewards 2x2 (exactly 4 items per page to prevent scroll)
  const totalMyPages = Math.max(1, Math.ceil(tabListVouchers.length / itemsPerPage));
  
  const paginatedMyRewards = useMemo(() => {
    const startIndex = (myRewardsPage - 1) * itemsPerPage;
    return tabListVouchers.slice(startIndex, startIndex + itemsPerPage);
  }, [tabListVouchers, myRewardsPage]);

  // Safeguard page bounds for My Rewards tab changes
  useEffect(() => {
    setMyRewardsPage(1);
  }, [myRewardsTab]);

  return (
    <CockpitShell activeMode="rewards">
      <main className="cockpit-main cockpit-main--rewards">
        <section className={`primary-panel rewards-panel ${activeCategory || myRewardsOpen ? "rewards-panel--subview" : "rewards-panel--home"}`} aria-labelledby="rewards-title">
          
          {/* Top Panel - Balance Dashboard */}
          <header className={`marketplace-top-summary ${activeCategory || myRewardsOpen ? "marketplace-top-summary--compact" : ""}`}>
            <div className="balance-info-hero">
              <div className="balance-info-left">
                <span className="summary-eyebrow">Available Balance</span>
                <h1 className="coins-value-display">
                  <EcoCoin size={36} />
                  {walletCoins.toLocaleString()} <span className="currency-label">EcoCoins</span>
                </h1>
              </div>
              <div className="summary-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Monthly Earned</span>
                  <strong className="metric-value text-green">+1,200</strong>
                </div>
                
                {/* Expiring Soon highlight warning border & orange badge */}
                <div className="metric-box warning-alert-box">
                  <span className="metric-label">Expiring Soon</span>
                  <div className="alert-badge">
                    <AlertTriangle size={12} className="warning-icon" />
                    <strong>320 EcoCoins</strong>
                  </div>
                  <span className="metric-sub">Expires in 5 days</span>
                </div>
              </div>
            </div>
            
            {/* Slide Page triggers */}
            {!myRewardsOpen && (
              <button 
                className="my-rewards-trigger-btn" 
                onClick={() => setMyRewardsOpen(true)}
                type="button"
              >
                <Ticket size={14} />
                My Rewards
                <span className="trigger-badge">{activeVouchers.length}</span>
              </button>
            )}
          </header>

          {/* MAIN DYNAMIC VIEW */}
          <div className="marketplace-workspace-area">
            
            {/* VIEW A: MY REWARDS FULL-PAGE VIEW */}
            {myRewardsOpen ? (
              <div className="my-rewards-fullpage-view">
                <header className="fullpage-view-header">
                  <button 
                    className="back-to-catalog-btn" 
                    onClick={() => setMyRewardsOpen(false)}
                    type="button"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <h2>My Rewards Collection</h2>
                </header>

                <div className="fullpage-tabs-row" role="tablist">
                  {(["Active", "Used", "Expired"] as const).map((tab) => {
                    let badgeCount = 0;
                    if (tab === "Active") badgeCount = activeVouchers.length;
                    if (tab === "Used") badgeCount = usedVouchers.length;
                    if (tab === "Expired") badgeCount = expiredVouchers.length;

                    return (
                      <button 
                        aria-selected={myRewardsTab === tab} 
                        className={myRewardsTab === tab ? "voucher-tab-button active" : "voucher-tab-button"} 
                        key={tab} 
                        onClick={() => setMyRewardsTab(tab)}
                        role="tab" 
                        type="button"
                      >
                        {tab} Vouchers ({badgeCount})
                      </button>
                    );
                  })}
                </div>

                {/* Paginated 2x2 grid of redeemed items */}
                <div className="fullpage-rewards-grid">
                  {paginatedMyRewards.length ? (
                    paginatedMyRewards.map((entry) => {
                      const rDate = new Date(entry.redeemedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
                      const eDate = new Date(entry.expiresAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
                      
                      return (
                        <article className="owned-reward-card" key={entry.id}>
                          <div className="owned-image-frame">
                            <img alt={entry.reward.title} src={entry.reward.image} />
                          </div>
                          <div className="owned-info-details">
                            <div>
                              <h3>{entry.reward.title}</h3>
                              <span className="owned-partner">{entry.reward.partner}</span>
                            </div>
                            
                            <div className="owned-dates-row">
                              <div><small>Redeemed</small><strong>{rDate}</strong></div>
                              <div><small>Expiry</small><strong>{eDate}</strong></div>
                            </div>

                            <div className="owned-action-footer">
                              <span className="coins-spent-tag"><EcoCoin size={12} /> {entry.reward.cost} spent</span>
                              
                              {myRewardsTab === "Active" && (
                                <button 
                                  className="use-voucher-btn"
                                  onClick={() => handleUseVoucher(entry.id)}
                                  type="button"
                                >
                                  Use Voucher
                                </button>
                              )}
                              {myRewardsTab === "Used" && <span className="status-badge-text text-green">✓ Used</span>}
                              {myRewardsTab === "Expired" && <span className="status-badge-text text-red">Expired</span>}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="fullpage-empty-vouchers">
                      <Gift size={32} className="empty-gift-icon" />
                      <h3>No Vouchers Found</h3>
                      <p>You do not have any {myRewardsTab.toLowerCase()} vouchers at the moment.</p>
                    </div>
                  )}
                </div>

                {/* My Rewards Pagination */}
                {tabListVouchers.length > itemsPerPage && (
                  <footer className="fullpage-grid-pagination">
                    <button 
                      className="pagination-btn" 
                      disabled={myRewardsPage === 1}
                      onClick={() => setMyRewardsPage((p) => Math.max(1, p - 1))}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="pagination-text">
                      Page <strong>{myRewardsPage}</strong> of {totalMyPages}
                    </span>
                    <button 
                      className="pagination-btn" 
                      disabled={myRewardsPage === totalMyPages}
                      onClick={() => setMyRewardsPage((p) => Math.min(totalMyPages, p + 1))}
                      type="button"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </footer>
                )}
              </div>
            ) : (

              /* VIEW B: CATEGORIES HOME OR SCOPED REWARD BROWSER */
              <div className="catalog-workspace-wrapper">
                
                {/* Category selector row - always visible below top summary */}
                {activeCategory ? (
                  <nav className="horizontal-categories-navbar" aria-label="Reward categories">
                    <button 
                      className="inline-back-home-btn" 
                      onClick={() => setActiveCategory(null)}
                      type="button"
                    >
                      <ArrowLeft size={16} />
                      All Categories
                    </button>
                    <div className="nav-categories-cluster">
                      {categoriesInfo.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                          <button
                            className={`nav-category-pill ${isActive ? "active" : ""}`}
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            type="button"
                          >
                            <span className="pill-title">{cat.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                ) : null}

                {/* Conditional Sub-View based on selected category state */}
                {!activeCategory ? (
                  
                  /* View B1: Dashboard overview with four direct category actions */
                  <div className="rewards-home-dashboard">
                    <section className="rewards-home-intro">
                      <span>Rewards marketplace</span>
                      <h2>Turn every efficient drive into something useful.</h2>
                      <p>Choose a benefit category to open its full-screen catalogue. Your EcoCoins stay available across every category.</p>
                      <div className="rewards-home-facts">
                        <div><strong>48</strong><span>benefits available</span></div>
                        <div><strong>4</strong><span>reward categories</span></div>
                        <div><strong>{activeVouchers.length}</strong><span>active vouchers</span></div>
                      </div>
                    </section>
                    <nav className="reward-category-buttons" aria-label="Benefit categories">
                      {categoriesInfo.map((cat, index) => (
                        <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} type="button">
                          <span className="reward-category-number">0{index + 1}</span>
                          <span className="reward-category-copy"><strong>{cat.title}</strong><small>{cat.description}</small></span>
                          <span className="reward-category-count">12 benefits</span>
                          <ChevronRight size={23} />
                        </button>
                      ))}
                    </nav>
                  </div>
                ) : (

                  /* View B2: 2x2 Scoped reward browser grid */
                  <div className="category-rewards-browser">
                    
                    <div className="browser-tools-heading">
                      <div className="browser-title-group">
                        <h2>{activeCategory} Rewards</h2>
                        <span className="total-badge">{filteredRewards.length} items available</span>
                      </div>
                      
                      <div className="browser-filters">
                        <div className="compact-search-box">
                          <Search size={18} className="search-box-icon" />
                          <input 
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                            placeholder="Filter rewards..." 
                            type="text" 
                            value={searchQuery} 
                          />
                        </div>
                        <select 
                          className="compact-sort-select"
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

                    {/* Fixed height 2x2 Reward Grid (strict 4 cards) */}
                    <div className={`rewards-grid-2x2 ${slideDirection ? `sliding-${slideDirection}` : ""}`}>
                      {paginatedRewards.length ? (
                        paginatedRewards.map((reward) => {
                          const canRedeem = walletCoins >= reward.cost;
                          return (
                            <article 
                              className="reward-item-card" 
                              key={reward.id}
                              onClick={() => setDetailReward(reward)}
                            >
                              <div className="item-card-banner">
                                <img alt={reward.title} src={reward.image} />
                                <span className={`badge-pill badge-${reward.badge.toLowerCase().replace(" ", "-")}`}>
                                  {reward.badge}
                                </span>
                                <div className="item-shade" />
                              </div>
                              <div className="item-card-content">
                                <div className="item-card-header">
                                  <h3>{reward.title}</h3>
                                  <span className="item-partner">{reward.partner}</span>
                                  <p className="reward-card-desc">{reward.description}</p>
                                  <div className="item-card-meta"><span>{reward.stock} remaining</span><span>30-day validity</span></div>
                                </div>
                                <div className="item-card-footer">
                                  <div className="item-cost">
                                    <EcoCoin size={16} />
                                    <strong>{reward.cost}</strong>
                                    <small>EcoCoins</small>
                                  </div>
                                  <button 
                                    className="item-redeem-action"
                                    disabled={!canRedeem}
                                    onClick={(e) => { e.stopPropagation(); handleRedeem(reward); }}
                                    type="button"
                                  >
                                    Redeem
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="empty-grid-results">
                          <strong>No rewards match your search criteria.</strong>
                          <p>Try searching for another keyword or clear the search query filter.</p>
                          <button onClick={() => setSearchQuery("")} type="button">Clear Search Filter</button>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls - Always Visible */}
                    {filteredRewards.length > 0 && (
                      <footer className="rewards-grid-pagination">
                        <button 
                          className="pagination-btn" 
                          disabled={currentPage === 1}
                          onClick={handlePrevPage}
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
                          onClick={handleNextPage}
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
            )}
          </div>

        </section>
      </main>

      {/* DETAIL DIALOG MODAL */}
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
                <div>
                  <span className="detail-partner">{detailReward.partner}</span>
                  <h2>{detailReward.title}</h2>
                  <p className="detail-description">{detailReward.description}</p>
                </div>
                
                <div className="detail-cost-display">
                  <EcoCoin size={20} />
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
              <CheckCircle2 size={44} className="success-checkmark-svg" />
            </div>
            
            <h2>✓ Reward Redeemed</h2>
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
                  <strong className="text-green"><EcoCoin size={12} />{successModal.remaining.toLocaleString()}</strong>
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
  /* Premium Infotainment Layout Constraints (Zero page scrolling) */
  .cockpit-main--rewards {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    padding: 88px 28px 100px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  .primary-panel {
    background: rgba(10, 18, 19, 0.82);
    border: 1px solid rgba(38, 59, 58, 0.78);
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 188px);
    max-height: calc(100vh - 188px);
    overflow: hidden;
    box-sizing: border-box;
    justify-content: space-between;
    gap: 12px;
  }
  
  /* Top Panel: EcoCoins Summary Layout (Infotainment styling) */
  .marketplace-top-summary {
    background: linear-gradient(135deg, rgba(16, 31, 30, 0.95) 0%, rgba(10, 20, 20, 0.9) 100%);
    border: 1px solid rgba(55, 229, 143, 0.35);
    border-radius: 10px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    flex-shrink: 0;
  }

  .balance-info-hero {
    display: flex;
    align-items: center;
    gap: 36px;
    flex: 1;
  }

  .balance-info-left {
    display: grid;
    gap: 2px;
  }

  .summary-eyebrow {
    color: #8fa69f;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .coins-value-display {
    color: #f4fff9;
    font-size: clamp(48px, 5.5vw, 60px);
    font-weight: 950;
    letter-spacing: -0.03em;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .currency-label {
    font-size: 20px;
    font-weight: 900;
    color: #37e58f;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-left: 1px;
  }

  .summary-metrics-grid {
    display: flex;
    gap: 20px;
    border-left: 1px solid rgba(55, 229, 143, 0.2);
    padding-left: 24px;
  }

  .metric-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
  }

  .metric-label {
    color: #81958f;
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    font-size: 34px;
    font-weight: 950;
  }

  .text-green { color: #37e58f; }
  .text-amber { color: #f5b84b; }
  .text-red { color: #ff5c4e; }
  
  /* Expiring Soon visual card styling */
  .warning-alert-box {
    border: 1px solid rgba(245, 184, 75, 0.45);
    border-radius: 6px;
    padding: 4px 10px;
    background: rgba(245, 184, 75, 0.06);
    position: relative;
  }

  .alert-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #ffb84b;
    margin-top: 1px;
  }

  .alert-badge strong {
    font-size: 24px;
    font-weight: 950;
  }

  .warning-icon {
    color: #ff9f1a;
  }

  .metric-sub {
    font-size: 15px;
    color: #a8bdb7;
    font-weight: 800;
    margin-top: 1px;
  }

  /* My Rewards Header Toggle button */
  .my-rewards-trigger-btn {
    background: linear-gradient(135deg, rgba(55, 229, 143, 0.2) 0%, rgba(55, 229, 143, 0.06) 100%);
    border: 1px solid rgba(55, 229, 143, 0.5);
    border-radius: 6px;
    color: #eafff5;
    font-size: 18px;
    font-weight: 950;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .my-rewards-trigger-btn:hover {
    background: rgba(55, 229, 143, 0.25);
    border-color: #37e58f;
    transform: translateY(-1px);
  }

  .trigger-badge {
    background: #37e58f;
    color: #081312;
    font-size: 8px;
    font-weight: 950;
    border-radius: 50%;
    min-width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    margin-left: 2px;
  }

  /* Workspace panel bounds */
  .marketplace-workspace-area {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* VIEW A: MY REWARDS FULL-PAGE VIEW MODULE */
  .my-rewards-fullpage-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    min-height: 0;
    justify-content: space-between;
  }

  .fullpage-view-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  .back-to-catalog-btn {
    background: rgba(142, 165, 160, 0.1);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    transition: all 0.2s ease;
  }

  .back-to-catalog-btn:hover {
    background: rgba(142, 165, 160, 0.2);
    border-color: #bdcec9;
  }

  .fullpage-view-header h2 {
    color: #f4fff9;
    font-size: 16px;
    font-weight: 800;
    margin: 0;
  }

  .fullpage-tabs-row {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.2);
    border-radius: 6px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin: 8px 0;
    padding: 3px;
    flex-shrink: 0;
  }

  .fullpage-rewards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    flex: 1;
    min-height: 0;
  }

  .owned-reward-card {
    background: linear-gradient(135deg, rgba(14, 25, 24, 0.95) 0%, rgba(9, 17, 16, 0.95) 100%);
    border: 1px solid rgba(93, 124, 116, 0.25);
    border-radius: 10px;
    display: flex;
    overflow: hidden;
    height: 100%;
    box-sizing: border-box;
  }

  .owned-image-frame {
    width: 32%;
    height: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .owned-image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .owned-info-details {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  .owned-info-details h3 {
    color: #f4fff9;
    font-size: 14px;
    font-weight: 800;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .owned-partner {
    color: #65a990;
    font-size: 9px;
    font-weight: 700;
    margin-top: 1px;
    display: block;
  }

  .owned-dates-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 4px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 4px;
  }

  .owned-dates-row small {
    display: block;
    color: #728780;
    font-size: 7px;
    text-transform: uppercase;
  }

  .owned-dates-row strong {
    color: #bdcec9;
    font-size: 9px;
  }

  .owned-action-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .coins-spent-tag {
    color: #8fa69f;
    font-size: 9px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .use-voucher-btn {
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

  .use-voucher-btn:hover {
    background: #37e58f;
    color: #081312;
  }

  .status-badge-text {
    font-size: 9px;
    font-weight: 800;
  }

  .fullpage-empty-vouchers {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    text-align: center;
    align-content: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .empty-gift-icon {
    color: #1a2c29;
  }

  .fullpage-empty-vouchers h3 {
    color: #f4fff9;
    font-size: 14px;
    margin: 0;
  }

  .fullpage-empty-vouchers p {
    color: #7d918b;
    font-size: 10px;
    margin: 0;
  }

  .fullpage-grid-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0 0 0;
    border-top: 1px solid rgba(55, 229, 143, 0.15);
    margin-top: 6px;
    flex-shrink: 0;
  }

  /* VIEW B: CATALOG WORKSPACE */
  .catalog-workspace-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    justify-content: space-between;
  }

  /* Horizontal Selector Navbar (Always visible when browsing) */
  .horizontal-categories-navbar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 6px;
    flex-shrink: 0;
  }

  .inline-back-home-btn {
    background: rgba(142, 165, 160, 0.12);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 18px;
    font-weight: 950;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 20px;
    height: 48px;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .inline-back-home-btn:hover {
    background: rgba(142, 165, 160, 0.22);
  }

  .nav-categories-cluster {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .nav-category-pill {
    background: #0f1a19;
    border: 1px solid rgba(117, 143, 137, 0.22);
    border-radius: 6px;
    color: #91a49f;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 22px;
    height: 48px;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .nav-category-pill:hover {
    border-color: rgba(55, 229, 143, 0.4);
    color: #eafff5;
  }

  .nav-category-pill.active {
    background: rgba(55, 229, 143, 0.14);
    border-color: rgba(55, 229, 143, 0.85);
    color: #37e58f;
    box-shadow: 0 0 10px rgba(55, 229, 143, 0.15);
  }

  .pill-icon {
    font-size: 24px;
  }
  
  .pill-title {
    font-size: 18px;
    font-weight: 950;
  }

  /* VIEW B1: CATEGORY LANDING HOME DASHBOARD (1x4 grid of medium cards) */
  .categories-landing-home {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .home-dashboard-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    height: 88%;
    min-height: 0;
  }

  .medium-category-card {
    background: rgba(14, 25, 24, 0.82);
    border: 1px solid rgba(55, 229, 143, 0.2);
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .medium-card-banner {
    height: 46%;
    position: relative;
    overflow: hidden;
  }

  .medium-card-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .card-image-shade-bottom {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(14, 25, 24, 0.98) 100%);
  }

  .medium-card-body {
    padding: 28px 32px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .medium-card-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .medium-category-card h3 {
    color: #f4fff9;
    font-size: 36px;
    font-weight: 950;
    margin: 0 0 12px 0;
  }

  .medium-category-card p {
    color: #c0d3cd;
    font-size: 20px;
    line-height: 1.5;
    margin: 0 0 18px 0;
    flex: 1;
    overflow: hidden;
  }

  .medium-card-total {
    color: #37e58f;
    font-size: 18px;
    font-weight: 950;
    text-transform: uppercase;
  }

  .medium-category-card:hover {
    border-color: rgba(55, 229, 143, 0.75);
    box-shadow: 0 10px 24px rgba(55, 229, 143, 0.12);
    transform: translateY(-2px);
  }

  .medium-category-card:hover .medium-card-banner img {
    transform: scale(1.05);
  }

  /* VIEW B2: CATEGORY REWARDS SCOPED GRID VIEW (2x2 Grid) */
  .category-rewards-browser {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .browser-tools-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  .browser-title-group {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .browser-title-group h2 {
    color: #f4fff9;
    font-size: 16px;
    font-weight: 800;
    margin: 0;
  }

  .total-badge {
    color: #78908a;
    font-size: 10px;
  }

  .browser-filters {
    display: flex;
    gap: 8px;
  }

  .compact-search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-box-icon {
    position: absolute;
    left: 16px;
    color: #728a83;
  }

  .compact-search-box input {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 18px;
    height: 48px;
    outline: 0;
    padding: 0 16px 0 46px;
    width: 220px;
    box-sizing: border-box;
  }

  .compact-sort-select {
    background: #0b1716;
    border: 1px solid rgba(105, 134, 127, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 18px;
    height: 48px;
    outline: 0;
    padding: 0 14px;
    cursor: pointer;
    box-sizing: border-box;
  }

  /* Fixed height 2x2 Reward Grid (strict 4 cards) */
  .rewards-grid-2x2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    flex: 1;
    min-height: 0;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .rewards-grid-2x2.sliding-left {
    transform: translateX(-15px);
    opacity: 0;
  }

  .rewards-grid-2x2.sliding-right {
    transform: translateX(15px);
    opacity: 0;
  }

  .reward-item-card {
    background: linear-gradient(180deg, rgba(14, 25, 24, 0.98) 0%, rgba(9, 18, 17, 0.98) 100%);
    border: 1px solid rgba(91, 119, 112, 0.25);
    border-radius: 10px;
    display: flex;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    height: 100%;
  }

  .reward-item-card:hover {
    border-color: rgba(55, 229, 143, 0.55);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    transform: translateY(-2px);
  }

  .item-card-banner {
    width: 32%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }

  .item-card-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 60%, rgba(14, 25, 24, 0.8) 100%);
  }

  .badge-pill {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 7px;
    font-weight: 900;
    text-transform: uppercase;
    padding: 3px 6px;
    border-radius: 3px;
  }

  .badge-popular { background: rgba(55, 229, 143, 0.2); border: 1px solid #37e58f; color: #37e58f; }
  .badge-best-value { background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; }
  .badge-limited { background: rgba(245, 184, 75, 0.2); border: 1px solid #f5b84b; color: #f5b84b; }
  .badge-new { background: rgba(255, 255, 255, 0.15); border: 1px solid #ffffff; color: #ffffff; }

  .item-card-content {
    padding: 10px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  .item-card-header {
    display: grid;
    gap: 1px;
  }

  .item-card-header h3 {
    color: #f4fff9;
    font-size: 13px;
    font-weight: 800;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-partner {
    color: #65a990;
    font-size: 8px;
    font-weight: 700;
  }

  .item-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 6px;
  }

  .item-cost {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #37e58f;
  }

  .item-cost strong {
    font-size: 16px;
    font-weight: 950;
  }

  .item-cost small {
    font-size: 8px;
    color: #77a795;
    text-transform: uppercase;
  }

  .item-redeem-action {
    background: #37e58f;
    border: 0;
    border-radius: 4px;
    color: #03120b;
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
    padding: 6px 12px;
    transition: all 0.2s ease;
  }

  .item-redeem-action:hover:not(:disabled) {
    background: #54f0a3;
  }

  .item-redeem-action:disabled {
    background: #202d2b;
    color: #667a75;
    cursor: not-allowed;
  }

  .empty-grid-results {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    text-align: center;
    align-content: center;
    padding: 30px;
  }

  .empty-grid-results strong {
    color: #f4fff9;
    font-size: 13px;
    display: block;
    margin-bottom: 4px;
  }

  .empty-grid-results p {
    color: #8fa69f;
    font-size: 10px;
    margin: 0 0 10px 0;
  }

  .empty-grid-results button {
    background: rgba(142, 165, 160, 0.1);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 4px;
    color: #eafff5;
    font-size: 9px;
    padding: 6px 12px;
    cursor: pointer;
  }

  /* MODAL DETAIL WINDOWS */
  .marketplace-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .marketplace-overlay--center {
    padding: 24px;
  }

  .reward-detail-dialog {
    background: #081211;
    border: 1px solid rgba(55, 229, 143, 0.3);
    border-radius: 12px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
    max-width: 620px;
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .detail-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(14, 25, 24, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: #ffffff;
    font-size: 18px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    z-index: 5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .detail-dialog-grid {
    display: grid;
    grid-template-columns: 40% 60%;
    min-height: 320px;
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
    top: 10px;
    left: 10px;
    background: rgba(8, 18, 17, 0.85);
    border: 1px solid #37e58f;
    color: #37e58f;
    font-size: 7px;
    font-weight: 800;
    padding: 3px 6px;
    border-radius: 3px;
  }

  .detail-dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  }

  .detail-partner {
    color: #37e58f;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .detail-dialog-body h2 {
    color: #f4fff9;
    font-size: 18px;
    font-weight: 900;
    margin: -2px 0 0 0;
  }

  .detail-description {
    color: #9db1ab;
    font-size: 10px;
    line-height: 1.4;
    margin: 0;
  }

  .detail-cost-display {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #37e58f;
  }

  .detail-cost-display strong {
    font-size: 24px;
    font-weight: 950;
  }

  .detail-cost-display small {
    font-size: 8px;
    color: #769b8d;
    text-transform: uppercase;
  }

  .detail-terms-box {
    background: rgba(14, 25, 24, 0.7);
    border: 1px solid rgba(55, 229, 143, 0.1);
    border-radius: 6px;
    padding: 8px 10px;
  }

  .detail-terms-box h4 {
    color: #eafff5;
    font-size: 8px;
    margin: 0 0 2px 0;
    text-transform: uppercase;
  }

  .detail-terms-box p {
    color: #748983;
    font-size: 8px;
    line-height: 1.4;
    margin: 0;
  }

  .detail-redeem-btn {
    background: #37e58f;
    border: 0;
    border-radius: 6px;
    color: #03120b;
    font-size: 11px;
    font-weight: 950;
    height: 36px;
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

  /* Success Modal */
  .redemption-success-modal {
    background: #081211;
    border: 1px solid #37e58f;
    border-radius: 12px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
    max-width: 320px;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    text-align: center;
  }

  .success-icon-wrapper {
    color: #37e58f;
    margin-bottom: 8px;
  }

  .redemption-success-modal h2 {
    color: #f4fff9;
    font-size: 18px;
    font-weight: 900;
    margin: 0;
  }

  .success-tagline {
    color: #8fa69f;
    font-size: 10px;
    margin: 2px 0 12px 0;
  }

  .success-summary-card {
    background: rgba(14, 25, 24, 0.8);
    border: 1px solid rgba(55, 229, 143, 0.15);
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .success-summary-card h3 {
    color: #f4fff9;
    font-size: 13px;
    font-weight: 800;
    margin: 0;
  }

  .partner-text {
    color: #65a990;
    font-size: 8px;
    display: block;
    margin-top: 1px;
  }

  .success-points-math {
    margin-top: 8px;
    display: grid;
    gap: 6px;
  }

  .math-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #8fa69f;
  }

  .border-top-divider {
    border-top: 1px solid rgba(55, 229, 143, 0.15);
    padding-top: 6px;
  }

  .voucher-instructions {
    color: #728780;
    font-size: 8px;
    line-height: 1.4;
    margin: 0 0 16px 0;
  }

  .success-modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .success-btn-primary {
    background: #37e58f;
    border: 0;
    border-radius: 6px;
    color: #03120b;
    font-size: 10px;
    font-weight: 900;
    height: 32px;
    cursor: pointer;
  }

  .success-btn-secondary {
    background: rgba(142, 165, 160, 0.15);
    border: 1px solid rgba(142, 165, 160, 0.35);
    border-radius: 6px;
    color: #eafff5;
    font-size: 10px;
    font-weight: 800;
    height: 32px;
    cursor: pointer;
  }

  /* Dashboard-first home: information on the left, four direct actions on the right */
  .rewards-home-dashboard {
    display: grid;
    flex: 1;
    gap: 10px;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(118px, .42fr) minmax(0, 1fr);
    min-height: 0;
  }

  .rewards-home-intro {
    background: radial-gradient(circle at 80% 20%, rgba(56, 189, 248, .14), transparent 38%), linear-gradient(145deg, rgba(14, 30, 29, .98), rgba(7, 17, 16, .98));
    border: 1px solid rgba(74, 126, 118, .28);
    border-radius: 14px;
    align-items: center;
    display: grid;
    gap: 5px 26px;
    grid-template-columns: minmax(0, 1.45fr) minmax(350px, .55fr);
    grid-template-rows: auto auto auto;
    min-height: 0;
    padding: 14px 22px;
  }

  .rewards-home-intro > span {
    color: #38bdf8;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .rewards-home-intro h2 {
    color: #f4fff9;
    font-size: clamp(25px, 2.4vw, 36px);
    grid-column: 1;
    letter-spacing: -.045em;
    line-height: 1.02;
    margin: 1px 0 3px;
    max-width: 720px;
  }

  .rewards-home-intro > p {
    color: #8ca29c;
    font-size: 11px;
    grid-column: 1;
    line-height: 1.55;
    margin: 0;
    max-width: 760px;
  }

  .rewards-home-facts {
    align-self: stretch;
    border-left: 1px solid rgba(99, 128, 121, .2);
    display: grid;
    gap: 12px;
    grid-column: 2;
    grid-template-columns: repeat(3, 1fr);
    grid-row: 1 / 4;
    margin: 0;
    padding-left: 24px;
    place-items: center start;
  }

  .rewards-home-facts div { display: grid; gap: 1px; }
  .rewards-home-facts strong { color: #37e58f; font-size: 28px; line-height: 1; }
  .rewards-home-facts span { color: #6f8780; font-size: 8px; text-transform: uppercase; }

  .reward-category-buttons {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    min-height: 0;
  }

  .reward-category-buttons button {
    align-items: center;
    background: rgba(12, 24, 23, .8);
    border: 1px solid rgba(100, 130, 122, .2);
    border-radius: 11px;
    color: #dcece7;
    cursor: pointer;
    display: grid;
    gap: 20px;
    grid-template-columns: 50px minmax(0, 1fr) auto 32px;
    min-height: 0;
    padding: 22px 28px;
    text-align: left;
    transition: background .18s ease, border-color .18s ease, transform .18s ease;
  }

  .reward-category-buttons button:hover {
    background: rgba(55, 229, 143, .08);
    border-color: rgba(55, 229, 143, .55);
    transform: translateX(3px);
  }

  .reward-category-number { color: #37e58f; font-size: 24px; font-weight: 950; }
  .reward-category-copy { display: grid; gap: 6px; min-width: 0; }
  .reward-category-copy strong { color: #f4fff9; font-size: 28px; }
  .reward-category-copy small { color: #b0c9c1; font-size: 16px; line-height: 1.45; }
  .reward-category-count { color: #37e58f; font-size: 15px; font-weight: 900; text-transform: uppercase; }

  /* Compact sub-view header leaves the screen to the selected catalogue or wallet */
  .rewards-panel--subview .marketplace-top-summary { padding-bottom: 8px; padding-top: 8px; }
  .rewards-panel--subview .coins-value-display { font-size: 23px; }
  .rewards-panel--subview .coins-value-display svg { height: 27px; width: 27px; }
  .rewards-panel--subview .summary-metrics-grid { gap: 12px; padding-left: 16px; }
  .rewards-panel--subview .metric-value { font-size: 15px; }

  /* Local voucher tabs prevent browser default white buttons from leaking into the dark UI */
  .voucher-tab-button {
    appearance: none;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 7px;
    color: #8da29c;
    cursor: pointer;
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    min-height: 31px;
    padding: 0 12px;
    transition: .18s ease;
  }

  .voucher-tab-button:hover { background: rgba(255,255,255,.035); color: #eafff5; }
  .voucher-tab-button.active { background: rgba(55,229,143,.14); border-color: rgba(55,229,143,.45); color: #37e58f; box-shadow: inset 0 0 0 1px rgba(55,229,143,.04); }

  .rewards-grid-pagination {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    gap: 10px;
    justify-content: center;
    min-height: 35px;
    padding-top: 5px;
  }

  .pagination-btn {
    align-items: center;
    appearance: none;
    background: rgba(111, 140, 132, .09);
    border: 1px solid rgba(111, 140, 132, .3);
    border-radius: 7px;
    color: #dcece7;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 18px;
    font-weight: 950;
    gap: 8px;
    min-height: 48px;
    padding: 0 22px;
    align-items: center;
  }

  .pagination-btn:hover:not(:disabled) { background: rgba(55,229,143,.12); border-color: rgba(55,229,143,.45); color: #37e58f; }
  .pagination-btn:disabled { cursor: default; opacity: .35; }
  .pagination-text { color: #bdcec9; font-size: 18px; min-width: 120px; text-align: center; }
  .pagination-text strong { color: #f4fff9; }

  /* Reward cards use their full footprint instead of leaving an empty centre */
  .rewards-grid-2x2 { gap: 20px; grid-template-columns: repeat(2,minmax(0,1fr)); grid-template-rows: repeat(2,minmax(0,1fr)); }
  .reward-item-card { flex-direction: row; }
  .item-card-banner { height: 100%; width: 35%; }
  .item-shade { background: linear-gradient(90deg,transparent 58%,rgba(9,18,17,.96) 100%); }
  .item-card-content { gap: 10px; padding: 16px 20px; }
  .item-card-header { align-content: start; height: auto; display: flex; flex-direction: column; gap: 6px; }
  .item-card-header h3 { font-size: 30px; font-weight: 950; }
  .item-partner { font-size: 18px; font-weight: 900; }
  .reward-card-desc { color: #c0d5d0; display: -webkit-box; font-size: 18px; line-height: 1.5; margin: 8px 0 0; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .item-card-meta { display: flex; gap: 20px; margin-top: 8px; padding-top: 0; }
  .item-card-meta span { color: #a4bebd; font-size: 14px; font-weight: 800; text-transform: uppercase; }
  .item-card-meta span:first-child { color: #f5b84b; }
  .item-card-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
  .item-cost strong { font-size: 36px; }
  .item-cost small { font-size: 18px; }
  .item-redeem-action { font-size: 18px; min-height: 46px; padding: 0 24px; font-weight: 950; border-radius: 8px; }

  @media (max-width: 1000px) and (min-width: 761px) {
    .rewards-grid-2x2 { grid-template-columns: repeat(2,minmax(0,1fr)); grid-template-rows: repeat(2,minmax(0,1fr)); }
    .reward-item-card { flex-direction: row; }
    .item-card-banner { height: 100%; width: 38%; }
    .item-shade { background: linear-gradient(90deg,transparent 58%,rgba(9,18,17,.88) 100%); }
  }

  @media (max-width: 760px) {
    .cockpit-main--rewards { padding: 64px 7px 72px; }
    .rewards-panel { height: calc(100vh - 136px); max-height: calc(100vh - 136px); padding: 7px; }
    .marketplace-top-summary { padding: 7px 9px; }
    .balance-info-hero { gap: 10px; }
    .coins-value-display { font-size: 21px; }
    .coins-value-display svg { height: 26px; width: 26px; }
    .currency-label { font-size: 8px; }
    .summary-metrics-grid { gap: 7px; padding-left: 9px; }
    .summary-metrics-grid .metric-box:first-child { display: none; }
    .warning-alert-box { padding: 3px 6px; }
    .my-rewards-trigger-btn { min-width: 42px; padding: 8px; }
    .my-rewards-trigger-btn > svg { margin: 0; }
    .my-rewards-trigger-btn { font-size: 0; gap: 3px; }
    .rewards-home-dashboard { gap: 6px; grid-template-columns: 1fr; grid-template-rows: minmax(0,.75fr) minmax(0,1.25fr); }
    .rewards-home-intro { border-radius: 10px; display:flex; flex-direction:column; padding: 10px 12px; }
    .rewards-home-intro h2 { font-size: 20px; margin: 4px 0; }
    .rewards-home-intro > p { display: none; }
    .rewards-home-facts { align-self:auto; border-left:0; border-top:1px solid rgba(99,128,121,.2); margin-top:auto; padding-left:0; padding-top:6px; width:100%; }
    .rewards-home-facts strong { font-size: 16px; }
    .reward-category-buttons { gap: 4px; grid-template-columns:1fr; grid-template-rows:repeat(4,minmax(0,1fr)); }
    .reward-category-buttons button { gap: 7px; grid-template-columns: 25px minmax(0,1fr) 17px; padding: 5px 8px; }
    .reward-category-copy strong { font-size: 11px; }
    .reward-category-copy small,.reward-category-count { display: none; }
    .horizontal-categories-navbar { gap: 5px; overflow-x: auto; scrollbar-width: none; }
    .horizontal-categories-navbar::-webkit-scrollbar { display: none; }
    .inline-back-home-btn,.nav-category-pill { flex: 0 0 auto; padding-left: 8px; padding-right: 8px; }
    .browser-tools-heading { align-items: flex-start; gap: 4px; }
    .browser-title-group { display: grid; gap: 0; }
    .browser-title-group h2 { font-size: 13px; }
    .browser-filters { gap: 4px; }
    .compact-search-box input { width: 105px; }
    .compact-sort-select { max-width: 100px; }
    .rewards-grid-2x2 { gap: 5px; grid-template-columns: 1fr; grid-template-rows: repeat(4,minmax(0,1fr)); }
    .reward-item-card { flex-direction:row; min-height: 0; }
    .item-card-banner { height:100%; width: 28%; }
    .item-shade { background:linear-gradient(90deg,transparent 58%,rgba(9,18,17,.88) 100%); }
    .item-card-content { padding: 6px 8px; }
    .item-card-header h3 { font-size: 10px; }
    .reward-card-desc { display: none; }
    .item-card-meta { padding-top: 2px; }
    .item-cost strong { font-size: 13px; }
    .item-cost small { display: none; }
    .item-redeem-action { padding: 5px 8px; }
    .rewards-grid-pagination { min-height: 28px; padding-top: 2px; }
    .fullpage-tabs-row { margin: 4px 0; }
    .voucher-tab-button { font-size: 8px; min-height: 27px; padding: 0 4px; }
    .fullpage-rewards-grid { gap: 5px; grid-template-columns: 1fr; grid-template-rows: repeat(4,minmax(0,1fr)); }
  }

  /* MEDIA SCALING FOR COMPACT LANDSCAPE INFO SCANS */
  @media (max-height: 720px) {
    .primary-panel {
      padding: 10px 16px;
      gap: 8px;
    }
    .medium-category-card p {
      display: none;
    }
    .reward-item-card {
      height: 100%;
    }
    .rewards-home-intro { padding: 16px 20px; }
    .rewards-home-intro h2 { font-size: 25px; }
    .rewards-home-facts { padding-top: 10px; }
  }
`;
