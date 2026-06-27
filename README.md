# 🏆 EcoDrive+ 
### *Drive Green. Earn Green. Grow Green.*

An all-in-one EV sustainability platform that combines a **real-time driving dashboard**, **virtual forest gamification**, **Eco-City Builder (SimCity-style)**, **community leaderboard**, and **ESP32 hardware feedback** to make carbon savings visible, rewarding, and deeply engaging.

Developed for the **MBOT Fuel Not Found Hackathon 2026**.

---

## 🎯 Project Overview

EcoDrive+ addresses the gap in electric vehicle (EV) dashboards. While standard dashboards focus purely on battery levels and range, EcoDrive+ highlights the driver's real-time environmental impact and guides them toward more efficient driving habits using gamification and hardware feedback.

---

## 📐 Architecture Overview

The EcoDrive+ ecosystem consists of 5 core modules:

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

## 🚀 Key Modules & Features

### 1. 🚗 Real-Time Eco-Driving Dashboard
* **Dynamic Eco-Score (0-100):** Calculated locally based on driving smoothness (acceleration standard deviation), speed consistency, and braking gentleness.
* **Smart Driving Advice:** Rule-based instant recommendations (e.g., "Ease into throttle", "Downhill ahead - coast to regenerate").
* **Energy-Efficient GPS Routing:** Calculates elevation changes, traffic stops, and drag penalties to find the path that consumes the least energy, rather than just the shortest route.

### 2. 🌳 CarbonTwin Forest (Gamification Core)
* **Digital Twin Forest:** A virtual 3D/2.5D isometric forest that grows when you drive efficiently and wilts if driving is aggressive.
* **Milestones & Wildlife:** Cumulative carbon savings unlock rare tree species, biomes (tropical, snow, cherry blossom), and local wildlife (birds, butterflies).

### 3. 🏘️ Eco-City Builder (SimCity-Style Gameplay)
* **Sustainable Metropolis:** Earn **EcoCoins** by driving efficiently and spend them to place buildings on an 8x8 grid.
* **Building Catalog:** Solar farms, wind turbines, EV charging hubs, recycling centers, and green schools.
* **Adjacency Bonuses:** Strategic building combinations (e.g., placing a Solar Farm next to an EV Charging Hub) increase passive coin generation.

### 4. 👥 Community Rankings & Goals
* **Multi-tier Leaderboards:** Global, weekly sprint, campus zone, and friend-based rankings.
* **Collaborative Goals:** Work with the UTAR community to hit collective carbon reduction milestones and unlock campus-wide rewards.

### 5. 🔧 ESP32 Hardware Hub
* **Real Sensors:** Integrates an ESP32 microcontroller with an **MPU6050 accelerometer/gyroscope** for motion tracking, a **NEO-6M GPS module** for speed/route tracking, and an **OLED display** for real-time dashboard updates.
* **Visual & Audio Cues:** Color-changing WS2812B RGB LED strip (Green → Yellow → Red) and a buzzer provide immediate ambient alerts for aggressive driving habits.

---

## 🛠️ Hardware Wiring Diagram

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
                          └──────────────┘
```

---

## 💻 Tech Stack

* **Hardware:** ESP32, MPU6050, NEO-6M GPS, SSD1306 OLED, WS2812B LED, Buzzer.
* **Firmware:** C/C++ (Arduino IDE / PlatformIO).
* **Communication:** MQTT over WiFi / WebSockets.
* **Backend:** Node.js / Python Flask.
* **Frontend:** React / Next.js, Three.js (for 3D city/forest visualizations), Leaflet/OpenStreetMap.
* **Database:** Firebase / SQLite.
