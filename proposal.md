**Project Name:** EcoDrive+
**Team Name:** [Insert Team Name Here]

## 1. Problem Statement
The biggest issue we noticed with the current electric vehicle (EV) experience is definitely the lack of real awareness about carbon savings. When people buy EVs, they usually want to help the environment, but the reality is that the drivers have almost no visibility into their actual daily environmental impact. Let's be honest, current EV dashboards are pretty boring. They only focus on operational stuff like battery percentage and speed, which is important, but they don't really communicate the environmental benefits at all. 

On top of that, many drivers might unknowingly have really bad driving habits—like braking too hard or accelerating too fast—which wastes a lot of energy. Without any immediate feedback to tell them they are driving inefficiently, the true environmental advantages of using an EV just aren't fully achieved. Basically, the problem is that drivers can't easily visualize their contribution to saving the planet, so they don't feel motivated to improve their driving habits.

## 2. Solution Description
To solve this, we basically decided to create an entire ecosystem called **EcoDrive+**, instead of just a simple dashboard. We are completely redesigning the EV experience by replacing the traditional dashboard with a premium, widescreen **in-car cockpit HMI display** (similar to modern Tesla or BYD screens). We want to make carbon savings visible, rewarding, and really fun right from the center console. Our solution has a few core parts working together.

First, we have the **Cockpit Driving Dashboard**. This is the main screen when driving. It calculates a real-time "Eco-Score" based on how smoothly the driver accelerates and brakes. But more importantly, we heavily encourage drivers to make better choices through our **Eco-Route** planner. 

For example: imagine you have two routes to a destination. Route A takes 18 minutes but has lots of traffic lights and sharp corners, requiring you to frequently brake and pedal. Route B takes 20 minutes because it's slightly further, but the road is smooth and significantly reduces your carbon emissions and battery drain. How do we convince a driver to choose the 20-minute route? By rewarding them with **EcoCoins**! By providing this direct award, we make them hyper-aware of the carbon emissions they are saving and give them a tangible reason to choose to save the earth.

**The "Why Play" Factor: Sustainable Investment vs. Instant Gratification**
But why do we need a game? If EcoCoins can be used to redeem real-life rewards (like a discount at a campus cafe), why not just let users redeem them directly and be done with it? Because purely transactional systems get boring fast. 

Instead, we built the **Eco-City Builder (SimCity-Style)** right into the car's HMI as a dedicated mode. You have a choice: you can spend 500 EcoCoins immediately to redeem a small coffee discount (instant gratification). OR, you can *invest* those 500 EcoCoins into building a virtual Wind Turbine in your Eco-City. That Wind Turbine generates passive "Yield Coins" every single day, allowing you to unlock even bigger real-life rewards down the line. It teaches drivers long-term sustainable thinking and keeps them addicted to the app for months. 

At the end of the day, our **Community Leaderboard** makes drivers fully aware of how much carbon they actually saved compared to their friends and campus peers. It turns eco-driving from a boring chore into a deeply engaging, rewarding habit.

## 3. Technical Implementation & Use of Tools
Technically, our demo uses a **two-app architecture** connected through an ESP32 microcontroller, creating a complete real-time data pipeline that we can demonstrate live on stage.

**App 1: Driving Simulator (iPad)**
The first app is an interactive driving simulator running on an iPad, laid horizontally like an F1 racing game. It is purely a driving game — just the road and the pedals. It has a 2D driving game view with virtual gas and brake pedals. Every 200 milliseconds, the simulator sends raw driving data (throttle position, brake force, current speed) over WiFi to the ESP32.

**ESP32 Hardware (The Car Brain)**
The ESP32 microcontroller sits on the table during the pitch, acting as the "car's brain." It receives the raw driving data from the iPad, then processes the eco-score locally using our transparent formula. Based on the result, it drives physical hardware outputs: an RGB LED strip that glows green for smooth driving and flashes red for harsh braking, a buzzer that beeps on dangerous events, and an OLED display showing the live score. After processing, it forwards the results to our main dashboard.

**App 2: Main Dashboard (Laptop/Monitor)**
The second app is the full cockpit dashboard running on a laptop or external monitor. It starts with the **Eco-Route Planner**, where drivers use an integrated map (powered by Leaflet or Google Maps API) to compare a fast route versus an eco-friendly route. After selecting the eco-route, the dashboard transitions to the live driving view and signals the iPad to start the driving game. It then receives the processed telemetry from the ESP32 and displays everything in real-time: the eco-score gauge, EcoCoins earned, carbon saved, the Eco-City Builder, the Rewards Marketplace, and the Community Leaderboard.

For our use of tools, we are relying on open-source frameworks. The ESP32 firmware is written in C/C++ using the Arduino IDE. For the web apps, we are using Next.js with React for the UI, Leaflet for maps, and WebSocket for real-time communication. Everything runs locally on the same WiFi network — no internet dependency during the pitch.

## 4. Hardware Data Pipeline
The data flows through three nodes in a continuous real-time loop. The iPad Driving Simulator sends raw input data (throttle, brake, speed) as JSON packets over WiFi WebSocket to the ESP32 every 200 milliseconds.

The ESP32 receives this data and immediately processes it through our eco-score algorithm. It calculates how smoothly the user is driving, checks for harsh braking events, and computes the energy efficiency. Based on the result, it updates the physical hardware: the LED strip changes colour, the buzzer triggers if needed, and the OLED updates the score.

After processing, the ESP32 packages the results into a new JSON telemetry packet and forwards it over WiFi to the Main Dashboard web app:

```json
{
  "deviceId": "ecodrive-demo-01",
  "ecoScore": 84,
  "speedKmh": 52.3,
  "event": "smooth_segment",
  "coinsEarned": 5,
  "totalCoins": 245,
  "energyKwh": 0.18,
  "co2SavedKg": 0.92
}
```
When the Dashboard receives this packet, it instantly updates the eco-score gauge, adds to the EcoCoin balance, scrolls the event feed, and shifts the leaderboard position. The entire pipeline — from pressing the gas pedal on the iPad to seeing the dashboard update — happens in under 500 milliseconds.

## 5. Expected Demo: Two-Screen Live Demonstration
For our live presentation, we will set up a **two-screen demo** with the ESP32 hardware visible between them. The iPad will be placed horizontally showing the Driving Simulator, the ESP32 board with its LED strip and OLED will sit on the table, and a laptop or monitor behind will display the Main Dashboard.

To start the demo, we will first open the **Eco-Route Planner** on the Dashboard laptop. This shows an integrated map with two routes to a destination. We will show the judges the contrast: Route A is fast but high-emissions, Route B is the Eco-Route earning +50 EcoCoins. We tap "Select Eco-Route & Start Driving" on the Dashboard, which automatically starts the driving game on the iPad.

Once the driving game starts on the iPad, we will press the virtual gas pedal gently. The judges will immediately see the ESP32 on the table light up green, and the Dashboard on the laptop will show the eco-score climbing. If we then slam the virtual brake pedal, the ESP32 buzzer will beep, the LED strip will flash red, and the Dashboard will show the eco-score dropping instantly. This three-way real-time reaction across iPad, hardware, and laptop creates a powerful visual effect.

After demonstrating the driving mechanics, we will switch the Dashboard to the **Eco-City Builder** mode. We will take the Raw EcoCoins we just earned from driving and use them to purchase a Solar Farm on the 8x8 city grid. The judges will see our "Passive Yield Coin" generation rate increase. Next, we will navigate to the **Rewards Marketplace** and show how Yield Coins can be exchanged for a real-world reward, like a simulated QR code for a free campus coffee. Finally, we will pull up the **Community Leaderboard** to show how the driver just climbed the rankings. This wraps up the demo by proving the complete loop: from iPad pedal input, through ESP32 hardware processing, to dashboard visualization, city building, real-world impact, and social competition.

## 6. Impact, Targeted Users, and Future Improvements
The targeted users are basically anyone who owns an EV, but we are also targeting campus fleets and new EV buyers. By turning eco-driving into a game, we are using psychology to make people actually care about their driving habits. Just like how the movie "The Big Short" showed that people are driven by incentives, EcoDrive+ gives drivers positive incentives to do the right thing. 

Going forward, we would definitely want to partner with real businesses to make the EcoCoins even more valuable, like getting coffee discounts on campus. We also want to improve the system by adding a real AI machine learning model that can analyze long-term driving patterns. In production, the iPad simulator would be replaced by real MPU6050 and GPS sensors on the ESP32, reading actual vehicle motion — but the processing pipeline remains exactly the same. In conclusion, EcoDrive+ is a real eye-opener for what EV dashboards should look like. We won't just tell drivers they are saving carbon; we will let them see it, feel it, and build a whole virtual world with it.

---

## 7. Pitching Script (For Hackathon Presentation)

*(iPad on table showing Driving Simulator. ESP32 board visible with LEDs. Laptop behind showing Dashboard.)*

**Intro:**
"Good morning, judges! Let me ask you a question: why are EV dashboards so boring? People buy EVs to save the earth, but when they drive, all they see is a battery percentage and a speedometer. There is absolutely no emotional connection to the carbon they are actually saving. Today, we are changing that. Meet **EcoDrive+**, a premium in-car cockpit that turns saving the planet into an addictive, rewarding habit."

**The Problem & Solution (Route Example):**
"Let's be honest, drivers have bad habits. *(Open the Eco-Route Planner map on the Dashboard laptop)* Let's say you are driving home. Look at this integrated map. Route A takes 18 minutes, but it's full of traffic lights and sharp corners. You're constantly braking and accelerating, wasting tons of energy. Route B takes 20 minutes, it's slightly further, but it's a smooth, open road that generates way less carbon emissions. How do we convince a driver to take that 20-minute route? 
Simple: **We pay them in EcoCoins.** *(Tap "Select Eco-Route" on the Dashboard. The driving game starts on the iPad.)* EcoDrive+ calculates your carbon savings in real-time and rewards you for making the green choice."

**The Gamification vs. Instant Reward Logic:**
"Now, you might ask: why not just let users use those EcoCoins to instantly redeem a coffee discount? Why do we need a game? 
Because instant gratification is purely transactional—it gets boring fast! Instead, we built an **Eco-City Builder** right into the car's screen. You have a choice: you can buy a small coffee discount now, OR you can invest those coins to build a Solar Farm in your virtual city. That Solar Farm will generate passive coins every day, allowing you to unlock massive real-world rewards later. This teaches long-term sustainable thinking and keeps users completely hooked on the app."

**The Two-Screen Hardware Demo:**
"And this isn't just software. We built an entire two-app data pipeline with real hardware in the middle. *(Point to ESP32 board on table)* This ESP32 board is the car's brain. 
Watch this: *(Press the gas pedal gently on the iPad driving game)* I'm driving smoothly. Look at the ESP32 — the LED is green. And look at the Dashboard on the laptop — my eco-score is climbing, coins are being earned.
*(Slam the brake pedal hard on the iPad)* But if I brake harshly! *(Buzzer beeps, LED flashes red)* You hear that? The hardware reacts instantly. And the Dashboard shows my eco-score just dropped. That's a real-time pipeline: iPad to ESP32 to Dashboard, all in under half a second."

**The Game & Marketplace Demo:**
"*(Switch to the Eco-City Builder on the Dashboard)* 
And here is the best part. I just earned Raw EcoCoins from that smooth driving segment. Watch as I spend them right now to build a Solar Farm in my city. *(Tap to build Solar Farm)* Look at that—my Yield Coin generation just went up! 
*(Switch to Rewards Marketplace)*
And what does that mean in the real world? It means I can go to the Rewards Marketplace right here, take those Yield Coins, and instantly redeem a QR code for a free coffee on campus. 
*(Switch to Community Leaderboard)*
Oh, and one last thing. Take a look at the Community Leaderboard. That smooth driving just bumped me up to 2nd place on campus for carbon saved this week. This is the complete loop: from an iPad pedal, through real ESP32 hardware, to dashboard visualization, city building, real-world rewards, and social competition!"

**Conclusion:**
"In conclusion, EcoDrive+ isn't just a dashboard. It's an ecosystem that uses psychology, hardware, and gamification to make drivers deeply aware of their carbon footprint. We don't just tell people to drive green—we make them want to. Thank you!"
