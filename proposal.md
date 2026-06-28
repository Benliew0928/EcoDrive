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
Technically, the system connects hardware and software together to create a seamless experience. We are using the ESP32 microcontroller provided for the hackathon as the brain of the car unit. We are hooking it up to an MPU6050 accelerometer and gyroscope to track exactly how the car is moving. This is super important because it detects things like hard braking or fast acceleration, which are the main culprits of energy waste. We are also using a NEO-6M GPS module to track the speed and distance.

For our use of tools, we are relying on open-source frameworks to build this out efficiently. The ESP32 firmware will be written in C/C++ using the Arduino IDE. For the backend, we are going to use Node.js or Python Flask to handle all the live data, and we will probably use Firebase for the database so we can get that real-time syncing without too much hassle. For the frontend cockpit UI, we are using React or Next.js to create a dark-glass, premium vehicle interface that truly looks like a modern car screen.

## 4. Hardware Data Pipeline
How does the hardware actually talk to the app? It is basically a constant loop of data. The ESP32 reads the MPU6050 sensor at 10Hz and the GPS at 1Hz. It then calculates the local eco-score right there on the device. We wanted the calculation to happen locally so there is no lag for the driver. 

Once calculated, the ESP32 updates its own OLED display and changes the LED strip color. Then, every 2 seconds, it packages all this data into a JSON packet and sends it over WiFi using MQTT or WebSockets to our cloud server. 

A sample of the data packet looks something like this:
```json
{
  "device_id": "esp32_001",
  "eco_score": 82,
  "trip_distance_m": 3420,
  "hard_brakes": 1,
  "acceleration": { "x": 0.12, "y": -0.05, "z": 9.81 }
}
```
When the server receives this packet, it instantly updates the cockpit screen, adds to your EcoCoin balance, and shifts your position on the community leaderboard. 

For the hardware feedback in the car, we are using an OLED display to show the live score, an RGB LED strip that changes from green to red if you are driving badly, and a buzzer that beeps if you do a sudden hard brake. 

## 5. Expected Demo: Live Demonstration
For our live presentation, we will definitely be doing a functional hardware demonstration to show exactly how the system reacts in real-time. We will have the ESP32 and all the sensors mounted on a small prototype board to act as the "car unit."

During the demo, we will physically tilt and move the board to simulate different driving habits. If we hold it steady, the LED will stay green, and the virtual city will thrive on the dashboard. If we quickly jolt the board to simulate a harsh brake, the judges will instantly hear the buzzer go off, the LED will turn red, and the app will show the Eco-Score dropping. 

For the visual dashboard itself, **we will demo it using an iPad during the pitching**. By mounting the iPad horizontally, it will perfectly simulate a real 16:9 widescreen EV center console (like a Tesla screen), making the whole experience feel incredibly authentic and professional.

## 6. Impact, Targeted Users, and Future Improvements
The targeted users are basically anyone who owns an EV, but we are also targeting campus fleets and new EV buyers. By turning eco-driving into a game, we are using psychology to make people actually care about their driving habits. Just like how the movie "The Big Short" showed that people are driven by incentives, EcoDrive+ gives drivers positive incentives to do the right thing. 

Going forward, we would definitely want to partner with real businesses to make the EcoCoins even more valuable, like getting coffee discounts on campus. We also want to improve the system by adding a real AI machine learning model that can analyze long-term driving patterns. In conclusion, EcoDrive+ is a real eye-opener for what EV dashboards should look like. We won't just tell drivers they are saving carbon; we will let them see it, feel it, and build a whole virtual world with it.

---

## 7. Pitching Script (For Hackathon Presentation)

*(Hold up the iPad showing the Cockpit UI in one hand, and the ESP32 board in the other)*

**Intro:**
"Good morning, judges! Let me ask you a question: why are EV dashboards so boring? People buy EVs to save the earth, but when they drive, all they see is a battery percentage and a speedometer. There is absolutely no emotional connection to the carbon they are actually saving. Today, we are changing that. Meet **EcoDrive+**, a premium in-car cockpit that turns saving the planet into an addictive, rewarding habit."

**The Problem & Solution (Route Example):**
"Let's be honest, drivers have bad habits. Let's say you are driving home. Route A takes 18 minutes, but it's full of traffic lights and sharp corners. You're constantly braking and accelerating, wasting tons of energy. Route B takes 20 minutes, it's slightly further, but it's a smooth, open road that generates way less carbon emissions. How do we convince a driver to take that 20-minute route? 
Simple: **We pay them in EcoCoins.** EcoDrive+ calculates your carbon savings in real-time and rewards you for making the green choice."

**The Gamification vs. Instant Reward Logic:**
"Now, you might ask: why not just let users use those EcoCoins to instantly redeem a coffee discount? Why do we need a game? 
Because instant gratification is purely transactional—it gets boring fast! Instead, we built an **Eco-City Builder** right into the car's screen *(point to iPad)*. You have a choice: you can buy a small coffee discount now, OR you can invest those coins to build a Solar Farm in your virtual city. That Solar Farm will generate passive coins every day, allowing you to unlock massive real-world rewards later. This teaches long-term sustainable thinking and keeps users completely hooked on the app."

**The Hardware Demo:**
"And this isn't just software. We built the actual hardware integration *(hold up ESP32)*. This board acts as our car. It has an MPU6050 accelerometer tracking every movement. 
*(Demonstrate holding it smooth)* Look, when I drive smoothly, the LED is green, and I earn coins for my city. 
*(Jolt the board hard)* But if I brake harshly! *(Buzzer beeps, LED turns red)* You get instant physical feedback, and the iPad dashboard drops my eco-score immediately."

**Conclusion:**
"In conclusion, EcoDrive+ isn't just a dashboard. It’s an ecosystem that uses psychology, hardware, and gamification to make drivers deeply aware of their carbon footprint. We don't just tell people to drive green—we make them want to. Thank you!"
