/*
 * EcoDrive+ ESP32 Firmware
 * -------------------------------------------------
 * Receives single-character commands over USB serial (115200 baud)
 * from the Node.js serial bridge and drives:
 *   - Green LED  (GPIO 4)  → smooth driving indicator
 *   - Red LED    (GPIO 2)  → harsh driving warning
 *   - Active Buzzer (GPIO 15) → audible warning
 *
 * Protocol (one ASCII byte per message):
 *   'G' → green  : green LED ON,  red OFF,  buzzer OFF
 *   'R' → red    : red LED ON,    green OFF, buzzer warning pattern
 *   'A' → amber  : both LEDs OFF, single short beep
 *   'B' → blue   : green LED blink, red OFF, buzzer OFF
 *   'X' → off    : everything OFF
 *
 * Hardware:
 *   GPIO 4  → 220Ω resistor → Green LED → GND
 *   GPIO 2  → 220Ω resistor → Red LED   → GND
 *   GPIO 15 → Active Buzzer (+)          → GND
 */

// ── Pin Definitions ──────────────────────────────────────────────
#define PIN_LED_GREEN   4
#define PIN_LED_RED     2
#define PIN_BUZZER     15

// ── State Machine ────────────────────────────────────────────────
enum LedMode {
  MODE_OFF,
  MODE_GREEN,
  MODE_RED,
  MODE_AMBER,
  MODE_BLUE
};

LedMode currentMode      = MODE_OFF;
LedMode previousMode     = MODE_OFF;

// Timing for non-blocking buzzer pattern and LED blink
unsigned long lastToggleMs   = 0;
unsigned long modeEnteredMs  = 0;
bool          buzzerOn       = false;
bool          blinkState     = false;
int           buzzerCycles   = 0;

// ── Setup ────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED,   OUTPUT);
  pinMode(PIN_BUZZER,    OUTPUT);

  // Start with everything off
  allOff();

  Serial.println("EcoDrive+ ESP32 ready");
  Serial.println("Waiting for serial commands: G R A B X");
}

// ── Main Loop ────────────────────────────────────────────────────
void loop() {
  // 1. Read serial commands
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    processCommand(cmd);
  }

  // 2. Run non-blocking output patterns
  unsigned long now = millis();

  switch (currentMode) {
    case MODE_GREEN:
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED,   LOW);
      digitalWrite(PIN_BUZZER,    LOW);
      break;

    case MODE_RED:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED,   HIGH);
      // Active buzzer: fast beep pattern (150ms on, 100ms off)
      runBuzzerPattern(now, 150, 100);
      break;

    case MODE_AMBER:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED,   LOW);
      // Single short beep on entry, then silence
      if (now - modeEnteredMs < 200) {
        digitalWrite(PIN_BUZZER, HIGH);
      } else {
        digitalWrite(PIN_BUZZER, LOW);
      }
      break;

    case MODE_BLUE:
      digitalWrite(PIN_LED_RED, LOW);
      // Green LED blink: 400ms on, 400ms off
      if (now - lastToggleMs > 400) {
        lastToggleMs = now;
        blinkState = !blinkState;
      }
      digitalWrite(PIN_LED_GREEN, blinkState ? HIGH : LOW);
      digitalWrite(PIN_BUZZER, LOW);
      break;

    case MODE_OFF:
    default:
      allOff();
      break;
  }
}

// ── Command Parser ───────────────────────────────────────────────
void processCommand(char cmd) {
  LedMode newMode;

  switch (cmd) {
    case 'G': case 'g':
      newMode = MODE_GREEN;
      break;
    case 'R': case 'r':
      newMode = MODE_RED;
      break;
    case 'A': case 'a':
      newMode = MODE_AMBER;
      break;
    case 'B': case 'b':
      newMode = MODE_BLUE;
      break;
    case 'X': case 'x':
      newMode = MODE_OFF;
      break;
    default:
      return; // Ignore unknown chars (newlines, etc.)
  }

  if (newMode != currentMode) {
    previousMode    = currentMode;
    currentMode     = newMode;
    modeEnteredMs   = millis();
    lastToggleMs    = millis();
    buzzerOn        = false;
    blinkState      = false;
    buzzerCycles    = 0;

    // Log state change for debugging
    Serial.print("Mode: ");
    Serial.println(modeName(currentMode));
  }
}

// ── Non-blocking buzzer beep pattern ─────────────────────────────
void runBuzzerPattern(unsigned long now, int onMs, int offMs) {
  int interval = buzzerOn ? onMs : offMs;

  if (now - lastToggleMs >= (unsigned long)interval) {
    lastToggleMs = now;
    buzzerOn = !buzzerOn;
    if (buzzerOn) buzzerCycles++;
  }

  digitalWrite(PIN_BUZZER, buzzerOn ? HIGH : LOW);
}

// ── Helper: all outputs off ──────────────────────────────────────
void allOff() {
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED,   LOW);
  digitalWrite(PIN_BUZZER,    LOW);
}

// ── Helper: mode name for serial debug ───────────────────────────
const char* modeName(LedMode mode) {
  switch (mode) {
    case MODE_GREEN: return "GREEN (smooth)";
    case MODE_RED:   return "RED (harsh warning)";
    case MODE_AMBER: return "AMBER (caution)";
    case MODE_BLUE:  return "BLUE (launch ready)";
    case MODE_OFF:   return "OFF";
    default:         return "UNKNOWN";
  }
}
