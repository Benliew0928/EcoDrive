# EcoDrive+ Hardware Setup Guide (For CS Students)

Don't worry if you don't have a hardware background! This guide is written specifically for software/CS students to help you easily wire up the physical ESP32 prototype for your pitch.

---

## 🛠️ 1. Bill of Materials (What you need to buy/borrow)

### Core Components
1. **ESP32 Development Board** (The main brain. Needs a Micro-USB or USB-C cable to connect to your laptop).
2. **Breadboard** (The plastic board with holes used to plug things in without soldering).
3. **0.96" OLED Display (I2C)** (Has 4 pins: GND, VCC, SCL, SDA).
4. **Active Buzzer** (To make warning beeps).
5. **LEDs** (4 pieces: Green, Amber, Red, Blue)
6. **Resistors** (4 pieces of 220Ω or 330Ω resistors for the LEDs so they don't burn out).
7. **Potentiometers (Knobs)** (2 or 3 pieces: to act as your fake "Throttle", "Brake", and "Steering").

### Cables (Jumper Wires)
You will need a mix of jumper wires depending on how you mount things:
- **Male-to-Male (M-M) wires:** (Get a bundle of ~20). You need these to connect things *on the same breadboard* (e.g., from the ESP32 pin to the LED pin on the board).
- **Female-to-Male (F-M) wires:** (Get a bundle of ~10). You need these if your OLED display or Potentiometers have pins sticking out, and you want to connect them to the breadboard without plugging the module directly into the board.

---

## 🔌 2. Wiring Diagram (ASCII)

Here is a simplified diagram of how to connect the components to the ESP32 on the breadboard. 
*Note: Pin numbers (e.g., GPIO 21, GPIO 22) might vary depending on your exact ESP32 code, but this is the standard setup.*

```text
=========================================================
                    ESP32 Dev Board
=========================================================
       [3.3V] ----------------------------+ (Power / VCC)
       [GND]  -------------------------+  | (Ground)
                                       |  |
                 +---------------------+  |
                 |                        |
[OLED Display]   |  (I2C Communication)   |
  GND -----------+                        |
  VCC ------------------------------------+
  SCL ----------------------------------- [GPIO 22]
  SDA ----------------------------------- [GPIO 21]

                 +---------------------+
                 |                     |
[Throttle Knob]  | (Potentiometer)     |
  GND -----------+                     |
  VCC ---------------------------------+
  Signal -------------------------------- [GPIO 34] (Analog In)

[Brake Knob]     | (Potentiometer)     |
  GND -----------+                     |
  VCC ---------------------------------+
  Signal -------------------------------- [GPIO 35] (Analog In)

                 +---------------------+
                 |                     |
[Buzzer]         |                     |
  GND -----------+                     |
  Signal -------------------------------- [GPIO 25]

                 +---------------------+
                 |                     |
[LEDs]           |                     |
  (Long Leg = Signal / Short Leg = GND)|
  Green (Short) -+                     |
  Green (Long)  --[ 220Ω Resistor ]------ [GPIO 16]
                 |
  Red (Short) ---+
  Red (Long)    --[ 220Ω Resistor ]------ [GPIO 17]
=========================================================
```

---

## 💡 3. Step-by-Step Dummy Guide

1. **Powering the Board:** Plug the ESP32 into the breadboard. Connect a wire from the `GND` pin on the ESP32 to the blue (-) line on the breadboard. Connect a wire from the `3V3` (or 3.3V) pin to the red (+) line on the breadboard. This creates a shared power rail.
2. **OLED Display:** Use **Female-to-Male** wires. Plug the female ends into the OLED pins. Plug the male ends into the breadboard. Connect `GND` to the blue rail, `VCC` to the red rail, `SCL` to ESP32 pin 22, and `SDA` to ESP32 pin 21.
3. **Potentiometers (Pedals):** These have 3 pins. The outer two pins go to GND (blue rail) and 3.3V (red rail). The middle pin is the *Signal*, which goes to an Analog input pin on the ESP32 (like pin 34 or 35). Use **Male-to-Male** wires if they are plugged into the breadboard.
4. **LEDs:** LEDs have a long leg (+) and a short leg (-). Plug them into the breadboard. Connect the short leg to GND (blue rail). Connect the long leg to a Resistor, and then use a **Male-to-Male** wire to connect the other end of the resistor to an ESP32 pin (like pin 16). 

## ⚠️ Important Pitching Tips for CS Students
- **Don't skip resistors on LEDs!** Without them, the LED will draw too much current and burn out instantly.
- If the OLED doesn't turn on, you probably swapped SDA and SCL. Just swap them back, it won't break anything.
- If the potentiometers give weird, jumpy values in your dashboard, make sure the GND wire is firmly connected. A loose ground wire causes "floating" analog readings.
