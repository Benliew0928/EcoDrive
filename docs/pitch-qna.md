# EcoDrive+ Pitch Q&A: The Science & Mathematics

This document is prepared specifically to answer technical questions from lecturers or judges regarding the validity of the carbon emission formulas, route logic, and hardware input effects (brake/throttle).

---

## 1. Where do we get the formula and values for EV carbon calculations?

Our eco-routing carbon emission calculation is based on the **non-linear, U-shaped (or J-shaped) energy-speed curve** universally recognized in electric vehicle (EV) research. 

Unlike internal combustion engine (ICE) vehicles, which are highly inefficient at low speeds due to engine idling, EVs are actually most efficient at moderate urban speeds (30–50 km/h).

**Our System's Emission Factors:**
We calculate route emissions dynamically using the following speed-based heuristic matrix:
- **< 30 km/h (City Crawl): `0.22 kg CO₂/km`**
  - *Reasoning:* Severe stop-and-go traffic wastes energy. While EVs have regenerative braking, frequent starting from a dead stop requires high initial torque, overcoming static inertia, and auxiliary loads (like Air Conditioning) dominate energy consumption when the car is barely moving.
- **30 - 60 km/h (Smooth Urban): `0.16 kg CO₂/km`**
  - *Reasoning:* The **"Sweet Spot"** for EVs. At these speeds, the electric motor operates near peak efficiency, and aerodynamic drag is negligible.
- **60 - 90 km/h (Suburban): `0.19 kg CO₂/km`**
  - *Reasoning:* Energy consumption begins to rise as aerodynamic drag increases.
- **> 90 km/h (Highway): `0.24 kg CO₂/km`**
  - *Reasoning:* Aerodynamic drag increases with the **square of velocity** ($F_d \propto v^2$). High-speed driving leads to an exponential increase in power required to maintain speed, draining the battery drastically.

**Academic Support & Research References:**
If asked for proof, cite the following established research findings:
> **1. MDPI Energies (2021) - *"Vehicle Acceleration and Speed as Factors Determining Energy Consumption in Electric Vehicles"*** 
> This paper mathematically models EV longitudinal dynamics, confirming the U-shaped curve where energy consumption is lowest in smooth urban conditions and skyrockets at motorway speeds due to drag.
> 
> **2. Wager et al. - *"Driving electric vehicles at highway speeds"***
> Highlights the severe range-speed trade-off, proving why our "Fast Route" (highways) generates a significantly higher carbon footprint than a slightly slower "Eco Route" (suburban roads).

---

## 2. How do the physical Brake and Pedal (Throttle) affect Carbon Emissions and Eco-Score?

The physical pedals connected to our ESP32 hardware directly dictate the driver's **Eco-Score**, which is a proxy for how efficiently the EV's energy is being managed. 

Here is the underlying physics logic of how pedal behavior affects the EV's real-world carbon footprint:

### Throttle (Acceleration Pedal)
- **Harsh Acceleration:** Flooring the throttle demands a massive, instantaneous surge of current ($I$) from the battery to the motor. According to Joule's First Law ($P = I^2R$), internal resistance heat losses scale with the *square* of the current. Therefore, sudden acceleration wastes battery energy as heat.
- **Eco-Driving Logic:** Our system rewards smooth, gradual throttle inputs, which draw current linearly and minimize thermal losses, resulting in a lower net carbon emission per kilometer.

### Brake Pedal (Regenerative Braking vs. Friction Braking)
- **The Physics:** EVs recover kinetic energy when slowing down by running the motor in reverse as a generator (Regenerative Braking). However, the motor has a maximum braking torque limit.
- **Gradual Braking:** If the driver presses the brake pedal lightly and early, 100% of the deceleration is handled by the electric motor. The kinetic energy is converted back into electricity and stored in the battery, significantly lowering the net energy consumed for the trip.
- **Harsh Braking:** If the driver slams the brakes late, the required stopping force exceeds the motor's regenerative limit. The car's computer is forced to engage the traditional mechanical **friction brakes** to stop safely. Friction brakes convert the car's kinetic energy entirely into useless heat, wasting it forever.
- **Eco-Driving Logic:** Our system penalizes harsh braking because it indicates a total loss of recoverable kinetic energy, increasing the net grid electricity required to recharge the car later (thus increasing carbon emissions).

---

## 3. How does the Route Calculation actually work?

We do not use fake data. Our dashboard integrates with real-world infrastructure:
1. **Geocoding (Nominatim):** When a user types a destination, we ping OpenStreetMap's geocoder to get exact latitude/longitude coordinates.
2. **Routing Engine (OSRM):** We ping the Open Source Routing Machine to calculate the geometry of the physical roads between the origin and destination.
3. **Alternative Routes via Waypoints:** To guarantee alternative paths (Eco vs Fast), the system intelligently calculates a geographic offset (a waypoint perpendicular to the main route) and requests a second, separate physical route. 
4. **Scoring:** The system calculates the average speed for each route. Using our EV speed-emission matrix, it multiplies the route distance by the emission factor. The route with the lowest resulting CO₂ output is dynamically tagged as the **Eco-Route**.
