# 🏆 MBOT Fuel Not Found Hackathon 2026 — Master Plan

## Project Name: **EcoDrive+**
### Tagline: *"Drive Green. Earn Green. Grow Green."*

---

## 🎯 One-Line Summary

An all-in-one EV sustainability platform that combines a **real-time driving dashboard**, **virtual forest gamification**, **Eco-City Builder (SimCity-style)**, **community leaderboard**, and **ESP32 hardware feedback** — making carbon savings visible, rewarding, and deeply engaging through city-building gameplay.

---

# 📐 PRODUCT ARCHITECTURE OVERVIEW

The app has **5 core modules** working together:

```
┌──────────────────────────────────────────────────────────────┐
│                     EcoDrive+ Platform                       │
├──────────┬──────────┬───────────┬──────────┬─────────────────┤
│ Module 1  │ Module 2 │ Module 3   │ Module 4 │    Module 5     │
│ Driving   │CarbonTwin│ Eco-City   │Community │   Hardware      │
│ Dashboard │ Forest   │ Builder +  │ & Social │   ESP32 Hub     │
│           │ (Game)   │ Marketplace│(Ranking) │   (Sensors)     │
└──────────┴──────────┴───────────┴──────────┴─────────────────┘
```

---

# MODULE 1: 🚗 DRIVING DASHBOARD (Main Screen)

This is the **primary screen** when the user is driving. Clean, glanceable, no distractions.

## 1.1 Real-Time Driving Metrics (Calculated Locally — No AI Needed)

All calculations run locally on the device/app using simple formulas:

| Metric | How It's Calculated (Local) | Display |
|---|---|---|
| **Eco-Score** (0-100) | Weighted average of: smoothness (40%) + speed consistency (30%) + braking gentleness (30%) | Big circular gauge, color-coded |
| **Smoothness Score** | Standard deviation of acceleration over last 30 seconds. Lower variance = higher score | Part of eco-score breakdown |
| **Braking Score** | Count of hard brakes (deceleration > threshold) per km. Fewer = better | Part of eco-score breakdown |
| **Speed Consistency** | How often speed stays within ±5 km/h of average over 60-second windows | Part of eco-score breakdown |
| **Energy Consumption** | `Energy (kWh) = (mass × acceleration × distance) + (drag × speed² × distance) + (rolling resistance × mass × distance)` — simplified physics model | kWh used this trip |
| **Carbon Saved vs Petrol** | `CO₂ saved = (petrol car emission factor × distance) - (EV energy used × grid carbon factor)` | kg CO₂ saved, updated live |
| **Estimated Range Impact** | Based on current driving style: "At this pace, you're using 12% more energy than optimal" | Percentage above/below optimal |

### Eco-Score Formula (Simple, No AI):
```
eco_score = (smoothness_score × 0.4) + (speed_consistency × 0.3) + (braking_score × 0.3)

Where:
  smoothness_score = max(0, 100 - (acceleration_std_dev × 20))
  speed_consistency = max(0, 100 - (speed_variance / avg_speed × 100))
  braking_score = max(0, 100 - (hard_brakes_per_km × 25))
```

## 1.2 Smart Driving Advice (Rule-Based, No AI)

Instead of AI, use simple **if-else threshold rules** to give tips:

| Condition Detected | Advice Shown | Icon |
|---|---|---|
| Acceleration > 3 m/s² frequently | "Ease into the throttle — smooth acceleration saves 15% energy" | 🐢 |
| Speed > 110 km/h for > 30s | "High speed = high drag. Dropping to 90 km/h saves ~25% energy" | 💨 |
| Hard braking > 3 times in 1 km | "Anticipate stops earlier — gentle braking recovers more energy" | 🛑 |
| Eco-score drops below 50 | "Your driving is getting aggressive. Take a breath 🧘" | ⚠️ |
| Eco-score stays above 80 for 5 min | "Amazing eco-driving! +5 bonus EcoCoins 🪙" | 🌟 |
| Idling detected (speed=0, engine on) > 2 min | "Consider turning off — idling wastes energy even in EVs (electronics)" | ⏸️ |
| Night driving detected | "Night driving tip: Use low beams, they consume 30% less than high beams" | 🌙 |
| Rapid temperature change in cabin | "Pre-condition your car while plugged in — saves battery on the road" | 🌡️ |

## 1.3 Energy-Efficient Path (GPS Function)

**No AI needed** — uses simple weighted shortest-path algorithm:

### How It Works:
1. Fetch routes from a map API (e.g., OpenStreetMap / Google Directions API)
2. For each route segment, calculate an **energy cost** using:
   ```
   energy_cost = base_distance_cost 
                 + (elevation_gain × uphill_penalty)
                 - (elevation_loss × regen_bonus)
                 + (traffic_stops × stop_start_penalty)
                 + (speed_limit_factor)  // higher speed limits = more drag
   ```
3. Recommend the route with **lowest total energy cost**, not just shortest distance
4. Show comparison: "Eco Route: 12.3 km (est. 2.1 kWh) vs Fastest Route: 10.1 km (est. 2.8 kWh)"

### Display:
- Map view with **two route overlays**: green (eco) and blue (fastest)
- Energy estimate for each route
- Time difference clearly shown ("Eco route is 4 min longer but saves 0.7 kWh")

---

# MODULE 2: 🌳 CARBONTWIN — VIRTUAL FOREST (Gamification Core)

## 2.1 How The Forest Works

| Action | Tree Effect |
|---|---|
| Complete a trip with eco-score > 70 | 🌱 Plant a new sapling |
| Maintain eco-score > 80 for entire trip | 🌿 Tree grows to medium |
| Achieve eco-score > 90 | 🌳 Tree becomes a full-grown oak |
| Eco-score drops below 40 on a trip | 🥀 Newest tree wilts (visual only, doesn't die) |
| 7-day eco-driving streak | 🌸 Rare flowering tree unlocked |
| Reach 100 total trees | 🏞️ Unlock "Forest Biome" (tropical, snow, cherry blossom themes) |
| Cumulative 100 kg CO₂ saved | 🦋 Wildlife appears in your forest (birds, butterflies) |

## 2.2 Forest Visualization
- **3D or 2.5D isometric forest** on the dashboard (can be done with simple CSS/JS or Three.js lite)
- Each tree is interactive — tap to see: "Planted on June 30, Trip: Home → UTAR, Eco-score: 87, CO₂ saved: 1.2 kg"
- Forest evolves over time: seasons change, weather effects, day/night cycle
- **Shareable**: Screenshot your forest → share on social media with stats overlay

## 2.3 Why This Is Powerful for Pitching
> Judges will see a beautiful growing forest and immediately understand the emotional connection. Numbers are forgettable. A forest you personally grew? That stays with you.

---

# MODULE 3: 🏘️ ECOCOIN & ECO-CITY BUILDER (SimCity-Style Core Gameplay)

> **This is our secret weapon.** Other teams will do "earn points → buy cosmetics" or "plant virtual trees". We go far beyond that — **you build an entire sustainable city.**

## 3.1 How Points (EcoCoins) Are Earned

| Activity | EcoCoins Earned |
|---|---|
| Complete any trip | 10 coins base |
| Trip eco-score > 70 | +15 bonus coins |
| Trip eco-score > 90 | +30 bonus coins |
| Daily login streak (7 days) | +50 coins |
| Weekly challenge completion | +100 coins |
| Community goal contribution | +20 coins |
| First trip of the day | +5 coins |
| Refer a friend who joins | +200 coins |
| Plant 10th / 50th / 100th tree milestone | +100 / +300 / +500 coins |
| Building produces passive income | Varies (see below) |

## 3.2 Eco-City Builder — The Core Game Loop

Users earn EcoCoins through eco-driving → spend them to **place buildings on a personal city grid** → buildings produce **passive coin income** → reinvest into more buildings → city grows into a sustainable utopia.

### How It Works:
- Every user starts with an **empty 8×8 grid** (like a plot of land)
- Use EcoCoins to purchase and place buildings
- Each building has a **type, cost, passive income, and unlock condition**
- **Adjacency bonuses**: strategic placement matters (solar farm next to park = +20% efficiency)
- City visually evolves from barren land → small town → green metropolis
- The CarbonTwin Forest (Module 2) exists **inside** your city as the green zone

### 🏗️ Building Catalog:

#### 🟢 Tier 1 — Starter Buildings (Available Immediately)
| Building | Cost | Passive Income | Special Effect |
|---|---|---|---|
| 🌳 Green Park | 100 coins | +2 coins/day | Boosts adjacent buildings by +10% |
| 🏠 Eco-Home | 150 coins | +3 coins/day | Adds 1 citizen to your city population |
| 🚲 Bike Lane | 80 coins | +1 coin/day | Connects buildings for network bonus |
| 🗑️ Recycling Center | 200 coins | +4 coins/day | Unlocks waste-reduction stat on dashboard |

#### 🔵 Tier 2 — Unlocked at 10 Eco-Trips
| Building | Cost | Passive Income | Special Effect |
|---|---|---|---|
| ☀️ Solar Farm | 300 coins | +5 coins/day | Produces "clean energy" resource for other buildings |
| 💨 Wind Turbine | 350 coins | +6 coins/day | Generates more income during "windy" seasons (random events) |
| 🔌 EV Charging Hub | 500 coins | +8 coins/day | Unlocks "Charging Station Finder" feature on map |
| 🌾 Community Garden | 250 coins | +4 coins/day | Adjacent parks produce 2x income |

#### 🟣 Tier 3 — Unlocked at 50 kg CO₂ Saved
| Building | Cost | Passive Income | Special Effect |
|---|---|---|---|
| 🏫 Eco-School | 800 coins | +12 coins/day | Unlocks education quizzes for bonus coins |
| 🏥 Green Hospital | 1000 coins | +15 coins/day | Citizens in your city gain "health boost" visual |
| 🚆 EV Tram Station | 1200 coins | +18 coins/day | Connects all buildings — city-wide network bonus |
| 🔬 Research Lab | 1500 coins | +10 coins/day | Speeds up future building construction time |

#### 🟡 Tier 4 — Unlocked at Platinum Eco-Rank
| Building | Cost | Passive Income | Special Effect |
|---|---|---|---|
| 🏭→🌿 Factory Conversion | 2000 coins | +25 coins/day | Visually transforms polluted factory into green building |
| 🌊 Water Purification Plant | 2500 coins | +30 coins/day | Adds river/water feature to your city |
| 🏛️ Sustainability HQ | 5000 coins | +50 coins/day | Final building — unlocks "Eco-City Complete" achievement |
| 🚀 Innovation Tower | 3000 coins | +35 coins/day | Unlocks premium dashboard analytics |

#### 🌟 Legendary — Special Unlock Conditions
| Building | Cost | Unlock Condition | Special |
|---|---|---|---|
| 🌈 Rainbow Bridge | 4000 coins | Connect two cities (friends) | Links your city with a friend's city for shared bonuses |
| 🌌 Stargazing Observatory | 3500 coins | 30-day eco-driving streak | Night mode city theme + starry sky effect |
| 🐉 Dragon Eco-Guardian | 5000 coins | #1 on weekly leaderboard | Animated dragon flies over your city |

### 🧩 Adjacency Bonus System:

Strategic placement matters — buildings placed next to compatible neighbors get bonus income:

```
┌──────────────────────────────────────────────────┐
│  Example City Grid (8×8)                          │
│                                                  │
│  🏠  🏠  🌳  ☀️  ☀️  🌾  🌳  🚲                 │
│  🏠  🏫  🌳  ☀️  💨  🌾  🔌  🚲                 │
│  🚲  🚲  🗑️  🏥  🏥  🌊  🔌  🏠                 │
│  🌳  🌳  🗑️  🔬  🏛️  🌊  🏠  🏠                 │
│  ...  ...  ...  ...  ...  ...  ...  ...          │
│                                                  │
│  Adjacency: ☀️ next to 🌾 = +20% income both     │
│  Adjacency: 🏠 next to 🌳 = +15% income home     │
│  Adjacency: 🔌 next to ☀️ = +25% income charger  │
└──────────────────────────────────────────────────┘
```

| Combo | Bonus | Why It Makes Sense |
|---|---|---|
| ☀️ Solar Farm + 🌾 Garden | +20% both | Solar powers garden irrigation |
| 🏠 Eco-Home + 🌳 Park | +15% home | Green neighborhoods attract residents |
| 🔌 EV Charger + ☀️ Solar | +25% charger | Solar-powered charging = zero carbon |
| 🏫 School + 🔬 Lab | +30% both | Education + research synergy |
| 🚲 Bike Lane + any | +5% adjacent | Connectivity bonus |
| 🗑️ Recycling + 🏭→🌿 Factory | +40% factory | Circular economy bonus |

### 🎮 City Progression Stages:

Your city visually transforms as you build more:

| Stage | Buildings Placed | City Look | Unlock |
|---|---|---|---|
| 🏜️ **Barren Land** | 0 | Empty grid, dusty ground | Start |
| 🏕️ **Settlement** | 5 | Small cluster, dirt paths | Basic stats |
| 🏘️ **Village** | 15 | Paved roads, small trees | Village badge |
| 🏙️ **Town** | 30 | Taller buildings, parks | Town badge |
| 🌆 **Green City** | 50 | Full infrastructure, lush greenery | City badge |
| 🌇 **Eco-Metropolis** | 75+ | Futuristic green skyline, flying EVs | Legend badge |

### 🔄 City Events (Random & Seasonal):

Keep gameplay fresh with periodic events:

| Event | Frequency | Effect |
|---|---|---|
| ☀️ **Solar Boom** | Random | All solar buildings produce 3x income for 24 hours |
| 🌧️ **Rainy Season** | Monthly | Wind turbines produce 2x, solar produces 0.5x |
| 🌍 **Earth Day Festival** | Yearly (April) | All buildings produce 2x income for a week |
| 🏗️ **Construction Rush** | Weekly challenge | Buildings cost 50% less for 48 hours |
| 🦋 **Migration Season** | Seasonal | Wildlife appears in parks, bonus coins for park owners |

### 🏆 Why Eco-City Builder Wins the Hackathon:

1. **No other team will have this** — everyone builds dashboards or simple point shops. We build SimCity.
2. **Idle game retention** — users open the app daily just to check their city, even when not driving
3. **Strategic depth** — adjacency bonuses make users THINK about sustainability (solar + charging = clean energy)
4. **Visual wow** — showing a judge a growing 3D isometric city is presentation gold
5. **Educational** — building placement teaches real sustainability concepts (renewable energy, green infrastructure)
6. **Sustainability narrative** — "Build the green city you want to live in" is a pitch judges won't forget

## 3.3 Marketplace — Spend EcoCoins Beyond City Building

In addition to building your city, EcoCoins can also be spent on:

### 🎮 In-App / Game Items:
| Item | Cost | Description |
|---|---|---|
| 🌸 Rare Tree Species (for forest) | 200 coins | Cherry blossom, Baobab, Redwood — unique trees for your CarbonTwin forest |
| 🎨 City Theme Pack | 500 coins | Tropical, Winter, Cyberpunk, Japanese Garden city skin |
| 🚗 Custom Car Avatar | 150 coins | Upgrade your car icon on the community map |
| 🦊 Wildlife Pack (for forest) | 300 coins | Add deer, foxes, owls to your CarbonTwin forest |
| 🖥️ Dashboard Theme | 250 coins | Dark mode, Neon, Nature, Minimalist dashboard skins |
| 🖼️ Profile Badge Frame | 100 coins | Gold, Platinum, Diamond profile borders |
| ✨ City Special Effects | 400 coins | Glowing buildings, particle effects, fireworks at night |

### 🏪 Real-Life Rewards (Partnership-Based):
| Reward | Cost | How It Works |
|---|---|---|
| ☕ Partner Cafe Discount | 500 coins | Redeem for 10% off at partner campus cafes |
| 🔌 EV Charging Credit | 1000 coins | RM5 off next charging session (partner stations) |
| 🎫 Campus Event Ticket | 800 coins | Free entry to UTAR events |
| 🌳 Real Tree Planted | 2000 coins | Partnership with tree-planting NGO — a real tree planted in your name |
| 🎁 Merch Voucher | 1500 coins | Redeem for EcoDrive+ stickers, t-shirts |

> **Note**: Real-life rewards are a **concept for the pitch** — you don't need actual partnerships during the hackathon. Just showing you've designed the framework demonstrates real-world viability and scores high on Impact (20%).

---

# MODULE 4: 👥 COMMUNITY & SOCIAL (Rankings)

## 4.1 Leaderboard System

| Leaderboard | Ranking By | Reset Period |
|---|---|---|
| 🏆 **Global** | Total EcoCoins earned all-time | Never |
| 📅 **Weekly Sprint** | Eco-score average this week | Every Monday |
| 🗺️ **Campus Zone** | Best eco-driver in UTAR Kampar / SG Long | Monthly |
| 👥 **Friends** | Compare with added friends only | Real-time |
| 🌳 **Forest Size** | Total trees planted | Never |
| ♻️ **Carbon Champion** | Total kg CO₂ saved | Monthly |

## 4.2 Community Goals

Collective goals that everyone contributes to:

| Goal | Target | Reward for All |
|---|---|---|
| "UTAR Green Week" | Community saves 500 kg CO₂ in 7 days | Everyone gets 100 bonus EcoCoins + special tree |
| "Million Meter March" | Community drives 1,000,000 eco-meters total | Unlock community forest theme |
| "Smooth Operators" | 100 drivers maintain eco-score > 80 for a week | Double EcoCoins weekend |

## 4.3 Social Features
- **Challenge a Friend**: "I bet I can beat your eco-score this week" — head-to-head comparison
- **Share Achievements**: Auto-generated social cards for milestones
- **Community Feed**: See when friends plant trees, unlock achievements, hit streaks
- **Team Mode**: Form teams of 3-5, compete as a group in team leaderboards

---

# MODULE 5: 🔧 HARDWARE INTEGRATION (ESP32)

## 5.1 What We Have
- **ESP32 microcontroller** (provided by organizers)
- Built-in: WiFi, Bluetooth, GPIO pins, ADC, I2C, SPI, UART

## 5.2 Sensor & Component Plan

### Essential Components (Cheap & Easy to Get):

| Component | Est. Cost (RM) | Purpose | Why It Matters |
|---|---|---|---|
| **MPU6050** (Accelerometer + Gyroscope) | ~RM5 | Detect acceleration, braking, turning forces | Core driving behavior data — this is the heart of eco-score calculation |
| **NEO-6M GPS Module** | ~RM15 | Speed, location, distance, route tracking | Required for path recommendations & distance-based calculations |
| **0.96" OLED Display (SSD1306)** | ~RM8 | Show real-time eco-score, status, alerts on the "car unit" | Makes the hardware demo visually impressive |
| **WS2812B RGB LED Strip (8 LEDs)** | ~RM5 | Color-coded driving feedback (green→yellow→red gradient) | Judges can see the color change instantly during demo |
| **Passive Buzzer** | ~RM1 | Audio alert for aggressive driving events | Adds another feedback dimension |
| **Push Button** | ~RM0.50 | Start/Stop trip, acknowledge alerts | Physical interaction for demo |
| **Total** | **~RM35** | | |

### Optional (If Budget Allows):

| Component | Est. Cost (RM) | Purpose |
|---|---|---|
| **DHT22** (Temperature/Humidity) | ~RM8 | Cabin temperature monitoring — correlate AC usage with energy consumption |
| **BMP280** (Barometric Pressure) | ~RM5 | Detect altitude changes — uphill/downhill affects energy usage |
| **MQ-135** (Air Quality Sensor) | ~RM8 | Compare air quality: EV zones vs petrol car zones — sustainability proof |
| **Vibration Motor** | ~RM3 | Haptic feedback on wrist band for silent driving alerts |
| **SD Card Module** | ~RM5 | Local data logging when WiFi unavailable |

## 5.3 Wiring Overview

```
                          ┌──────────────┐
                          │    ESP32      │
                          │              │
   MPU6050 ──── I2C ─────│ GPIO21 (SDA) │
   (Accel/Gyro)          │ GPIO22 (SCL) │
                          │              │
   OLED Display ── I2C ──│ (shared bus)  │
   (SSD1306)              │              │
                          │              │
   GPS Module ── UART ────│ GPIO16 (RX)  │
   (NEO-6M)               │ GPIO17 (TX)  │
                          │              │
   LED Strip ── Data ─────│ GPIO5        │
   (WS2812B)              │              │
                          │              │
   Buzzer ────────────────│ GPIO18       │
                          │              │
   Button ────────────────│ GPIO4        │
                          │              │
   DHT22 (optional) ──────│ GPIO15       │
                          │              │
                          │     WiFi     │──── → Cloud/App
                          └──────────────┘
```

## 5.4 How ESP32 Talks to the App

```
ESP32 (Hardware)                          App/Web Dashboard
─────────────────                         ─────────────────
1. Read MPU6050 @ 10Hz                    
2. Read GPS @ 1Hz                         
3. Calculate local eco-score              
4. Display on OLED                        
5. Update LED strip color                 
6. Send data packet via WiFi ──────────→  7. Receive via WebSocket/MQTT
                                          8. Store in database
                                          9. Update dashboard real-time
                                          10. Update forest, coins, leaderboard
```

### Data Packet (JSON sent every 2 seconds):
```json
{
  "device_id": "esp32_001",
  "timestamp": 1719648000,
  "acceleration": { "x": 0.12, "y": -0.05, "z": 9.81 },
  "gyroscope": { "x": 0.02, "y": -0.01, "z": 0.05 },
  "gps": { "lat": 4.3394, "lng": 101.1428, "speed_kmh": 62.4, "altitude": 120 },
  "eco_score": 82,
  "trip_distance_m": 3420,
  "hard_brakes": 1,
  "hard_accels": 0,
  "energy_est_kwh": 0.42
}
```

## 5.5 🎯 HOW TO DEMO THE HARDWARE (Critical for Presentation)

This is the most important section — **how to make ESP32 demo impressive with just a motherboard + sensors**:

### Demo Scenario 1: "Live Driving Simulation" (Recommended)
1. **Mount ESP32 + sensors on a small board/box** (like a mini "car dashboard unit")
2. **Physically tilt and move the board** to simulate driving:
   - Tilt forward = acceleration → LED turns yellow → OLED shows "Eco-score dropping"
   - Hold steady = smooth driving → LED stays green → OLED shows "Great driving! +5 coins"
   - Shake/jolt = hard braking → LED turns red → buzzer beeps → OLED shows "Hard brake detected!"
   - Tilt left/right = sharp turning → LED flashes orange
3. **Web dashboard updates in real-time** on a laptop next to the ESP32:
   - Eco-score gauge moves
   - Virtual tree grows/wilts
   - EcoCoins accumulate
   - Leaderboard position changes
4. **Tell the judges**: "Imagine this unit mounted in your car. Every movement is captured and translated into sustainability insights."

### Demo Scenario 2: "Walking Demo" (Backup)
1. Put ESP32 in your pocket or strap to your hand
2. Walk around the presentation area — GPS tracks movement, accelerometer tracks walk smoothness
3. Dashboard shows your "walk" as a "trip" with eco-score
4. Shows how the system works even without a real car

### Demo Scenario 3: "Potentiometer Throttle Simulator" (Advanced)
1. Add a **potentiometer** (RM1) to simulate a gas pedal
2. Turn the knob = increase "speed" → affects energy calculation
3. Combine with tilting for acceleration → full driving simulation without a car
4. OLED shows: Speed | Eco-Score | Coins Earned
5. Very interactive — let judges try it themselves!

### Demo Tips:
- **Always have the web dashboard running on a laptop next to the ESP32**
- **Use a split screen**: Left = ESP32 with OLED + LEDs, Right = laptop with dashboard
- **Let a judge physically interact** with the device (tilt, press button) — hands-on = memorable
- **Pre-record a backup video** of the demo in case WiFi fails

---

# 🌟 AWARENESS FEATURES (Beyond Just Data & Advice)

> "How else can we make users AWARE of their driving habits?"

Here are features that go **beyond showing numbers and text advice**:

## 6.1 Sensory Feedback Loop (Hardware-Driven)

| Feedback Type | Implementation | Why It Works |
|---|---|---|
| **🚦 LED Color Gradient** | WS2812B strip changes from green → yellow → orange → red based on real-time eco-score | Peripheral vision catches color changes even when eyes on road |
| **🔊 Audio Cues** | Gentle chime = good driving. Warning beep = aggressive event. Celebration sound = milestone reached | Audio works without looking at screen |
| **📳 Vibration Pulse** | Optional vibration motor: gentle pulse when eco-score drops below threshold | Physical sensation = hardest to ignore |
| **📊 OLED Dashboard** | Shows a simple emoji face: 😊 (eco-score > 80), 😐 (50-80), 😟 (< 50) | Universal, instant understanding |

## 6.2 Psychological Awareness Techniques (App-Driven)

| Technique | Implementation | Psychology Behind It |
|---|---|---|
| **🪞 Trip Replay** | After each trip, show a timeline replay with color-coded segments (green/red) | Reflection creates self-awareness. Users see WHEN they drove poorly |
| **📸 Before/After Cards** | "Your first trip: Eco-score 45. Today: Eco-score 78. You've improved 73%!" | Progress visualization is deeply motivating |
| **📊 Habit Heatmap** | Weekly heatmap showing which days/times you drive most aggressively | Pattern recognition — "I always drive aggressively on Monday mornings" |
| **🌍 Tangible Equivalents** | "Today you saved 1.2 kg CO₂ = keeping 60 balloons of CO₂ out of the atmosphere" | Abstract numbers → tangible visuals |
| **🌍 Real-World Comparisons** | "Your monthly savings = 1 tree absorbing CO₂ for a year" or "= charging 150 phones" | Makes impact relatable |
| **📦 Carbon Jar Visualization** | Animated jar that fills with "saved carbon" — when full, a tree gets planted | Visual progress toward a goal |
| **👻 Ghost Mode** | Compare your current trip against your "best self" (best eco-score on same route) | Racing against yourself = gamified self-improvement |
| **🔔 Smart Notifications** | End-of-day summary: "Today's eco-score: 74. You had 3 hard brakes on Jalan Kampar. Try anticipating the traffic light at KM4." | Specific, actionable, location-based |
| **📅 Eco Calendar** | Calendar view where each day is colored by eco-score. Streaks are highlighted | Streak psychology (like Duolingo) — don't break the chain |
| **🎯 Personal Goals** | Set your own target: "I want to average eco-score 80 this week" — track progress | Self-set goals have higher completion rates |

## 6.3 Social Awareness (Community-Driven)

| Feature | How It Works | Why It Works |
|---|---|---|
| **Anonymous Comparison** | "You're in the top 30% of eco-drivers in your area" | Social comparison theory — people adjust behavior when they know where they stand |
| **Eco-Driver Badge on Profile** | Visible badge levels: Bronze → Silver → Gold → Platinum → Diamond | Status signaling motivates sustained behavior |
| **Monthly Eco Report Card** | Auto-generated shareable report: trips, savings, rank, forest growth | Accountability through transparency |

---

# 🚀 EXTRA COMPETITIVE FEATURES (What Makes Us Champion)

These are features that will make judges say "wow, they really thought of everything":

## 7.1 🌦️ Weather-Adaptive Driving Tips
- Pull local weather data (free API)
- "It's raining — reduce speed by 20%, wet roads increase energy use by 10-15%"
- "Headwind detected on your route — expect 8% higher consumption"
- Show weather impact on the route energy estimate

## 7.2 🔋 Charging Station Finder with Green Rating
- Show nearby EV charging stations on the map
- Rate each station by **estimated grid carbon intensity** at current time
- "Station A: 2.3 km away, Grid is 70% clean ☀️" vs "Station B: 1.1 km, Grid is 40% clean 🏭"
- Help users choose the greenest charging option

## 7.3 📊 Fleet / Campus Mode
- UTAR could deploy this for campus shuttle EVs
- Admin dashboard: track all campus EV fleet eco-scores
- "UTAR campus fleet saved 2.3 tonnes CO₂ this semester"
- Perfect for the **sustainability impact** scoring criteria

## 7.4 🚨 Safety Integration
- Detect potential accidents via sudden extreme accelerometer readings
- Auto-send GPS location to emergency contacts
- "Crash detected at [location]. Emergency contacts notified."
- Adds a safety dimension judges won't expect from an eco-driving app

## 7.5 🎓 Eco-Driving Education Hub
- Short bite-sized lessons: "What is regenerative braking?", "How does speed affect EV range?"
- Quiz system: earn EcoCoins by completing quizzes
- "Watch a 2-min video about tire pressure → +20 EcoCoins"
- Addresses the **Educational** expected benefit from the handbook

## 7.6 🏅 Achievement System (Gamification Depth)

| Achievement | Condition | Reward |
|---|---|---|
| 🌱 First Sprout | Complete your first trip | 50 EcoCoins + tutorial tree |
| 🏃 Speed Demon Reformed | Improve eco-score by 20+ points over a week | 100 EcoCoins + rare tree |
| 🧘 Zen Driver | 10 consecutive trips with eco-score > 85 | 200 EcoCoins + meditation garden theme |
| 🌍 Planet Saver | Save cumulative 100 kg CO₂ | 500 EcoCoins + Earth badge |
| 🏆 Community Champion | Reach #1 on weekly leaderboard | 300 EcoCoins + gold profile frame |
| 🔥 30-Day Streak | 30 consecutive days with at least 1 eco-trip | 1000 EcoCoins + legendary tree |
| 🦉 Night Owl Eco | Maintain eco-score > 80 on 5 night trips | 150 EcoCoins + owl in forest |
| 📊 Data Nerd | View trip analytics 50 times | 100 EcoCoins + advanced stats unlock |
| 🤝 Social Butterfly | Challenge 10 different friends | 200 EcoCoins + social badge |
| 🌳 Forest Guardian | Plant 500 virtual trees | 2000 EcoCoins + legendary forest theme |

## 7.7 🪪 Digital Carbon Certificate
- Monthly auto-generated certificate: "This certifies that [User] saved [X] kg of CO₂ through eco-driving in [Month]"
- Downloadable as PDF, shareable on LinkedIn
- Could partner with carbon offset organizations for legitimacy
- **Judges will love this** — it shows professional-level thinking

## 7.8 📱 Widget / Always-On Display
- Home screen widget showing today's eco-score + streak
- Keeps the app top-of-mind without opening it
- Simple but shows attention to UX detail

## 7.9 🗺️ Community Carbon Map
- Heatmap overlay on the map showing:
  - Green zones = areas where drivers consistently eco-drive
  - Red zones = areas with aggressive driving patterns
- "The stretch of road near UTAR gate has the worst braking scores — maybe a speed bump is needed?"
- Turns individual data into **urban planning insights** — massive sustainability impact angle

## 7.10 🌙 Drive Mode Profiles
- **Commute Mode**: Optimized for daily routes, learns your pattern
- **Road Trip Mode**: Long-distance energy optimization, charging stop suggestions
- **Learning Mode**: Extra tips and guidance for new EV drivers
- **Challenge Mode**: Active challenges, head-to-head with friends

---

# 📱 APP SCREEN FLOW

```
┌──────────────────────────────────────────────┐
│              APP NAVIGATION                   │
│                                              │
│  🏠 Home ─── Main Dashboard                  │
│  │           ├─ Eco-Score Gauge              │
│  │           ├─ Quick Stats (today)          │
│  │           ├─ Active Challenge Card        │
│  │           └─ Forest Preview Widget        │
│  │                                           │
│  🗺️ Navigate ─── GPS & Route                 │
│  │              ├─ Eco vs Fast Route Compare │
│  │              ├─ Nearby Charging Stations  │
│  │              └─ Weather Impact Warning    │
│  │                                           │
│  🌳 Forest ─── CarbonTwin                    │
│  │           ├─ 3D Forest View              │
│  │           ├─ Tree Collection Gallery      │
│  │           ├─ Wildlife Unlocks            │
│  │           └─ Forest Stats & History       │
│  │                                           │
│  🪙 Store ─── EcoCoin Marketplace            │
│  │          ├─ In-App Items                  │
│  │          ├─ Real-World Rewards            │
│  │          ├─ Coin Balance & History        │
│  │          └─ Redeem Section               │
│  │                                           │
│  👥 Community ─── Social & Rankings          │
│  │             ├─ Leaderboards               │
│  │             ├─ Community Goals             │
│  │             ├─ Challenges                  │
│  │             ├─ Friends & Social Feed       │
│  │             └─ Community Carbon Map        │
│  │                                           │
│  👤 Profile ─── User Account                  │
│              ├─ Achievements & Badges        │
│              ├─ Trip History & Analytics     │
│              ├─ Eco Calendar & Streaks       │
│              ├─ Carbon Certificates          │
│              └─ Settings & Drive Modes       │
└──────────────────────────────────────────────┘
```

---

# 🏗️ TECH STACK

| Layer | Technology | Why |
|---|---|---|
| **Hardware** | ESP32 + MPU6050 + NEO-6M GPS + OLED + LEDs + Buzzer | Required by hackathon, cheap, well-documented |
| **ESP32 Firmware** | Arduino IDE / PlatformIO (C/C++) | Workshop teaches Arduino, best ecosystem for ESP32 |
| **Communication** | MQTT over WiFi (or WebSocket) | Real-time, lightweight, perfect for IoT |
| **Backend** | Node.js / Python Flask (simple REST + WebSocket server) | Quick to build, handles real-time data |
| **Database** | Firebase Realtime DB or SQLite | Free tier, real-time sync, minimal setup |
| **Frontend** | React / Next.js web app (or Flutter for mobile) | Modern, responsive, great for live demos |
| **Maps** | Leaflet + OpenStreetMap (free) or Google Maps API | Route display, charging stations, carbon map |
| **3D Forest** | Three.js (lightweight 3D) or CSS 3D transforms | Forest visualization — the wow factor |

---

# 📋 PROPOSAL STRUCTURE (5 Pages)

| Page | Section | Content |
|---|---|---|
| **1** | Problem Statement | EV users lack carbon savings visibility. 4 problems from handbook + our expanded insight: behavior change requires emotional connection, not just data. Statistics on EV adoption in Malaysia. |
| **2** | Solution Description | EcoDrive+ overview: 5 modules. User journey from first trip to forest growth to coin redemption. How each module solves a specific problem. |
| **3** | Technical Explanation + Diagram | System architecture diagram (ESP32 → WiFi → Server → App). Data flow. Eco-score formula. Route energy cost algorithm. Hardware wiring schematic. |
| **4** | Expected Demo + Hardware | Live demo plan (tilt ESP32, watch dashboard respond). Hardware component list + photos. Screenshots/mockups of app screens. What's live vs simulated. |
| **5** | Impact + Future + Conclusion | Target users (EV owners, campus fleet, new EV buyers). Sustainability metrics (projected CO₂ savings). Business model (partnerships, premium features). Future: AI model upgrade, real partnerships, expand to other campuses. |

---

# ⏰ TIMELINE REMINDER

| Date | Action |
|---|---|
| **Now → 28 June** | Finalize idea, prepare 5-page proposal |
| **29 June 12:00 AM** | Submit proposal PDF to mbotfuelnotfound@gmail.com |
| **29 June 2:00 PM** | Workshop: Arduino + ESP32 hands-on |
| **After finalist announcement** | Start building: firmware + app + integration |

---

> **Key Differentiator**: Most teams will build a simple dashboard showing numbers. **We're building an ecosystem** — driving dashboard + gamification + marketplace + community + hardware feedback. This is what champions look like.


