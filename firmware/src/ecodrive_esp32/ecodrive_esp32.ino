/*
 * EcoDrive+ ESP32 Direct Wi-Fi Firmware
 * -------------------------------------------------
 * Connects directly to Wi-Fi and Cloudflare WebSockets.
 * Replaces the Node.js bridge.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "Ben’s iPhone";
const char* password = "050928070037";
const char* ws_host = "ecodrive-relay.benliew28262826.workers.dev";
const uint16_t ws_port = 443;
const char* ws_path = "/ws?role=bridge&session=demo-main&token=beauty_and_the_beast";

WebSocketsClient webSocket;

// ── Pin Definitions ──────────────────────────────────────────────
#define PIN_LED_GREEN   4
#define PIN_LED_RED     2
#define PIN_BUZZER     15

#define BUZZER_ON  HIGH
#define BUZZER_OFF LOW

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

// Function prototypes
void allOff();
void runOutputs();
void runBuzzerPattern(unsigned long now, int onMs, int offMs);
void handleSimInput(JsonObject input);
void sendTelemetry(JsonObject input);
void sendClientHello();
void sendBridgeHardware();
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
float clampValue(float val, float minVal, float maxVal);

void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED,   OUTPUT);
  pinMode(PIN_BUZZER,    OUTPUT);
  allOff();

  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");

  // Connect securely to Cloudflare Relay
  webSocket.beginSSL(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();
  
  // Non-blocking hardware outputs
  runOutputs();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.println("[WS] Connected to Relay!");
    sendClientHello();
    sendBridgeHardware();
  } else if (type == WStype_TEXT) {
    // ArduinoJson 7 compatibility (or fallback to v6 syntax)
    DynamicJsonDocument doc(1500);
    DeserializationError err = deserializeJson(doc, payload);
    if (err) return;
    
    const char* msgType = doc["type"];
    if (!msgType) return;
    
    if (strcmp(msgType, "sim.input") == 0) {
      handleSimInput(doc["input"]);
    }
  } else if (type == WStype_DISCONNECTED) {
    Serial.println("[WS] Disconnected.");
  }
}

void sendClientHello() {
  DynamicJsonDocument doc(512);
  doc["type"] = "client.hello";
  doc["session"] = "demo-main";
  doc["role"] = "bridge";
  doc["sentAt"] = millis();
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void sendBridgeHardware() {
  DynamicJsonDocument doc(512);
  doc["type"] = "bridge.hardware";
  doc["session"] = "demo-main";
  doc["sentAt"] = millis();
  
  JsonObject hw = doc.createNestedObject("hardware");
  hw["connected"] = true;
  hw["serialPort"] = "esp32-wifi";
  
  const char* strState = "off";
  if (currentMode == MODE_GREEN) strState = "green";
  else if (currentMode == MODE_RED) strState = "red";
  else if (currentMode == MODE_AMBER) strState = "amber";
  else if (currentMode == MODE_BLUE) strState = "blue";
  hw["ledState"] = strState;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void handleSimInput(JsonObject input) {
  float throttle = input["throttle"] | 0.0;
  float brake = input["brake"] | 0.0;
  float speedKmh = input["speedKmh"] | 0.0;
  const char* event = input["event"] | "idle";
  const char* routeChoice = input["routeChoice"] | "unknown";

  // Determine LED state logic ported from Node.js
  LedMode nextMode = MODE_GREEN;
  
  if (strcmp(event, "harsh_brake") == 0 || strcmp(event, "overspeed") == 0 || strcmp(event, "aggressive_acceleration") == 0) {
    nextMode = MODE_RED;
  } else if (strcmp(event, "fast_route_warning") == 0 || strcmp(routeChoice, "fast") == 0) {
    nextMode = MODE_AMBER;
  } else if (strcmp(event, "launch_ready") == 0) {
    nextMode = MODE_BLUE;
  } else if (abs(speedKmh) < 0.5 && throttle < 0.02 && brake < 0.02) {
    nextMode = MODE_BLUE;
  }
  
  if (nextMode != currentMode) {
    currentMode = nextMode;
    modeEnteredMs = millis();
    lastToggleMs = millis();
    buzzerOn = false;
    blinkState = false;
    sendBridgeHardware();
    
    Serial.print("[HW] New State: ");
    Serial.println(nextMode);
  }
  
  sendTelemetry(input);
}

float clampValue(float val, float minVal, float maxVal) {
  if (val < minVal) return minVal;
  if (val > maxVal) return maxVal;
  return val;
}

void sendTelemetry(JsonObject input) {
  float throttle = input["throttle"] | 0.0;
  float brake = input["brake"] | 0.0;
  float speedKmh = input["speedKmh"] | 0.0;
  float ecoScore = input["ecoScore"] | 80.0;
  const char* event = input["event"] | "idle";
  const char* routeChoice = input["routeChoice"] | "unknown";
  float distanceMeters = input["distanceMeters"] | 0.0;
  float steering = input["steering"] | 0.0;

  float speedAbs = abs(speedKmh);
  float distanceKm = max(0.0f, distanceMeters) / 1000.0f;
  float smoothnessFactor = clampValue(ecoScore / 100.0f, 0.35f, 1.0f);
  
  float regenKw = 0.0;
  if (brake > 0.12 && speedAbs > 8.0) {
    regenKw = clampValue(brake * 38.0f, 0.0f, 40.0f) * smoothnessFactor;
  }
  
  float motorKw = throttle * (58.0f + speedAbs * 0.55f) - regenKw * 0.35f;
  float energyKwh = max(0.0f, distanceKm * (0.13f + speedAbs * 0.0026f + throttle * 0.09f) - regenKw * 0.00012f);
  float co2SavedKg = max(0.0f, distanceKm * 0.11f * smoothnessFactor);
  
  int eventBonus = 0;
  if (strcmp(event, "regen_success") == 0) eventBonus = 50;
  else if (strcmp(event, "smooth_streak") == 0) eventBonus = 32;
  else if (strcmp(event, "finish_loop") == 0) eventBonus = 80;
  
  int coinsEarned = max(0, (int)round(distanceKm * 180.0f + max(0.0f, ecoScore - 70.0f) * 1.6f + eventBonus));
  
  int hardBrakes = 0;
  if (strcmp(event, "harsh_brake") == 0) hardBrakes = 1;
  
  DynamicJsonDocument doc(1024);
  doc["type"] = "dashboard.telemetry";
  doc["session"] = "demo-main";
  doc["sentAt"] = millis();
  
  JsonObject tel = doc.createNestedObject("telemetry");
  tel["deviceId"] = "esp32-wifi-bridge";
  tel["ecoScore"] = ecoScore;
  tel["speedKmh"] = speedKmh;
  
  // Normalize event
  if (strcmp(event, "reverse_mode") == 0) tel["event"] = "idle";
  else if (strcmp(event, "route_fork") == 0) tel["event"] = "route_selected";
  else tel["event"] = event;
  
  tel["hardBrakes"] = hardBrakes;
  tel["coinsEarned"] = coinsEarned;
  tel["totalCoins"] = 1240 + coinsEarned;
  tel["energyKwh"] = energyKwh;
  tel["co2SavedKg"] = co2SavedKg;
  
  const char* strState = "off";
  if (currentMode == MODE_GREEN) strState = "green";
  else if (currentMode == MODE_RED) strState = "red";
  else if (currentMode == MODE_AMBER) strState = "amber";
  else if (currentMode == MODE_BLUE) strState = "blue";
  tel["ledState"] = strState;
  
  tel["timestamp"] = millis();
  tel["distanceKm"] = distanceKm;
  tel["batteryPercent"] = clampValue(88.0f - energyKwh * 3.6f + regenKw * 0.012f, 42.0f, 98.0f);
  tel["rangeKm"] = clampValue(418.0f - distanceKm * 4.2f - energyKwh * 9.0f, 190.0f, 430.0f);
  tel["regenKw"] = regenKw;
  tel["motorKw"] = motorKw;
  tel["routeChoice"] = routeChoice;
  tel["throttle"] = throttle;
  tel["brake"] = brake;
  tel["steering"] = steering;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void runOutputs() {
  unsigned long now = millis();
  
  switch (currentMode) {
    case MODE_GREEN:
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_BUZZER, BUZZER_OFF);
      break;
      
    case MODE_RED:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      runBuzzerPattern(now, 150, 400);
      break;
      
    case MODE_AMBER:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      if (now - modeEnteredMs < 200) {
        digitalWrite(PIN_BUZZER, BUZZER_ON);
      } else {
        digitalWrite(PIN_BUZZER, BUZZER_OFF);
      }
      break;
      
    case MODE_BLUE:
      digitalWrite(PIN_LED_RED, LOW);
      if (now - lastToggleMs > 400) {
        lastToggleMs = now;
        blinkState = !blinkState;
      }
      digitalWrite(PIN_LED_GREEN, blinkState ? HIGH : LOW);
      digitalWrite(PIN_BUZZER, BUZZER_OFF);
      break;
      
    case MODE_OFF:
    default:
      allOff();
      break;
  }
}

void runBuzzerPattern(unsigned long now, int onMs, int offMs) {
  int interval = buzzerOn ? onMs : offMs;
  if (now - lastToggleMs >= (unsigned long)interval) {
    lastToggleMs = now;
    buzzerOn = !buzzerOn;
  }
  digitalWrite(PIN_BUZZER, buzzerOn ? BUZZER_ON : BUZZER_OFF);
}

void allOff() {
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED,   LOW);
  digitalWrite(PIN_BUZZER,    BUZZER_OFF);
}
