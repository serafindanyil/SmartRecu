#include <Arduino.h>
#include <ArduinoJson.h>
#include <FanController.h>
#include <SCD40Sensor.h>
#include <TemperatureSensor.h>
#include <WebSocketsClient.h>
#include <WiFi.h>
#include <Wire.h>

#define WIFI_SSID "Urec_Holodec"
#define WIFI_PASSWORD "nash526safron"

#define WS_HOST "192.168.31.89"
#define WS_PORT 3000
#define WS_PATH "/ws"

#define SDA_PIN 45
#define SCL_PIN 0

int DEFAULT_FAN_IN_SPEED = 50;
int DEFAULT_FAN_OUT_SPEED = 50;

int fanInSpeed = DEFAULT_FAN_IN_SPEED;
int fanOutSpeed = DEFAULT_FAN_IN_SPEED;

FanController fanToInside(1, 0, 2, 2);
FanController fanToOutside(42, 1, 41, 2);

TemperatureSensor tempSensor(16);
SCD40Sensor co2Sensor;

WebSocketsClient webSocket;

bool webSocketConnected = false;

bool isFanEnabled = true;
String currentMode = "auto";

bool lastFanEnabledState = true;
bool manuallyTurnedOff = false;

// АВТОМАТИЧНИЙ ХЕНДЛИНГ ЯКОСТІ ПОВІТРЯ
enum AirQuality { WELL = 0, GOOD = 1, BAD = 2, POOR = 3 };

const int fanInSpeedsByQualityCO2[4] = {30, 50, 75, 100};
const int fanOutSpeedsByQualityCO2[4] = {30, 50, 75, 100};

template <typename T>
void sendWebSocketCommand(const String &type, T &value, const T &state) {
  value = state;

  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<300> doc;
  doc["device"] = "esp32";
  doc["type"] = type;
  doc["data"] = value;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("[WebSocket] Sent: " + jsonString);
}

AirQuality getAirQuality(int CO2) {
  if (CO2 <= 599)
    return WELL;
  if (CO2 > 600 && CO2 <= 999)
    return GOOD;
  if (CO2 > 1000 && CO2 <= 1500)
    return BAD;
  if (CO2 > 1500)
    return POOR;
  return POOR;
}

void handleFansByAirQuality() {
  if (currentMode != "auto")
    return;

  int CO2 = co2Sensor.getCO2();
  AirQuality quality = getAirQuality(CO2);

  fanInSpeed = fanInSpeedsByQualityCO2[quality];
  fanOutSpeed = fanOutSpeedsByQualityCO2[quality];

  if (quality >= BAD && !isFanEnabled) {
    sendWebSocketCommand("switchState", isFanEnabled, true);
    lastFanEnabledState = isFanEnabled;
  }
}
// ---

void handleAutoModeLogicUpdate() {
  if (currentMode != "auto")
    return;

  int CO2 = co2Sensor.getCO2();

  const int PoorCO2 = CO2 > 1500;
  const int BadCO2 = CO2 > 1000 && CO2 <= 1500;
  const int GoodCO2 = CO2 > 600 && CO2 <= 999;
  const int WellCO2 = CO2 <= 599;

  int humidity = co2Sensor.getHumidity();

  const int PoorHumidity = humidity < 30 || humidity >= 70;
  const int BadHumidity = humidity >= 30 && humidity <= 40;
  const int GoodHumidity = humidity >= 40 && humidity <= 60;
  const int WellHumidity = humidity >= 45 && humidity <= 55;

  bool isOutsideTempHigher =
      tempSensor.getTemperature() > co2Sensor.getTemperature();

  if (co2Sensor.getCO2() > 1000 && !isFanEnabled) {
    sendWebSocketCommand("switchState", isFanEnabled, true);
    lastFanEnabledState = isFanEnabled;
  }

  if (co2Sensor.getCO2() <= 800 && isFanEnabled) {
    sendWebSocketCommand("switchState", isFanEnabled, false);
    lastFanEnabledState = isFanEnabled;
  }
}

void changeFansToDefaultSpeed() {
  sendWebSocketCommand("changeFanInSpd", fanInSpeed, DEFAULT_FAN_IN_SPEED);
  sendWebSocketCommand("changeFanOutSpd", fanOutSpeed, DEFAULT_FAN_OUT_SPEED);
}

void handleManualModeLogic(bool state) {
  if (currentMode != "manual")
    return;

  if (state == true && fanInSpeed <= 3 && fanOutSpeed <= 3) {
    changeFansToDefaultSpeed();
  }
}

void handleAutoFanSwitch(const String &mode) {
  // Ця функція відповідає за правильну зміну режиму
  currentMode = mode;

  // Скидаємо прапорець при зміні режиму
  if (mode != "manual") {
    manuallyTurnedOff = false;
  }
}

void handleValueSpeedForTurnOnFans() {
  if (currentMode != "manual")
    return;

  // Важливо: не вмикати автоматично якщо користувач вимкнув вручну
  if (manuallyTurnedOff)
    return;

  if ((fanOutSpeed > 3 || fanInSpeed > 3) && !isFanEnabled) {
    sendWebSocketCommand("switchState", isFanEnabled, true);
    lastFanEnabledState = isFanEnabled;
  }
}

void handleMinimalSpeedForTurnOffFans() {
  if (currentMode != "manual")
    return;

  if ((fanOutSpeed <= 3 && fanInSpeed <= 3) && isFanEnabled) {
    sendWebSocketCommand("switchState", isFanEnabled, false);
    lastFanEnabledState = isFanEnabled;
    // Не встановлюємо manuallyTurnedOff, бо це автоматичне вимкнення
  }
}

void handleFanControl() {
  if (isFanEnabled) {
    fanToInside.setSpeedPercent(fanInSpeed);
    fanToOutside.setSpeedPercent(fanOutSpeed);
  } else {
    fanToInside.setSpeedPercent(0);
    fanToOutside.setSpeedPercent(0);
  }

  if (currentMode == "manual") {
    handleMinimalSpeedForTurnOffFans();
  }
}

void handleWebSocketMessage(const String &message) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.printf("[WebSocket] JSON parse error: %s\n", error.c_str());
    return;
  }

  if (doc.containsKey("type")) {
    if (doc["type"] == "switchState") {
      bool state = doc["data"];

      if (!state && currentMode == "manual") {
        manuallyTurnedOff = true;
        Serial.println("[Manual] User manually turned OFF fans");
      } else if (state && currentMode == "manual") {
        manuallyTurnedOff = false;
        Serial.println("[Manual] User manually turned ON fans");
      }

      handleManualModeLogic(state);
      sendWebSocketCommand("switchState", isFanEnabled, state);
    }
    if (doc["type"] == "changeMode") {
      String mode = doc["data"];
      handleAutoFanSwitch(mode);
      sendWebSocketCommand("changeMode", currentMode, mode);
      if (mode == "turbo") {
        sendWebSocketCommand("changeFanInSpd", fanInSpeed, 100);
        sendWebSocketCommand("changeFanOutSpd", fanOutSpeed, 100);
        sendWebSocketCommand("switchState", isFanEnabled, true);
      } else if (mode == "auto") {
        fanInSpeed = DEFAULT_FAN_IN_SPEED;
        fanOutSpeed = DEFAULT_FAN_OUT_SPEED;
      }
    }
    if (doc["type"] == "changeFanInSpd" && currentMode == "manual") {
      int speed = doc["data"];
      if (speed > 3)
        manuallyTurnedOff = false;
      sendWebSocketCommand("changeFanInSpd", fanInSpeed, speed);
      handleValueSpeedForTurnOnFans();
    }
    if (doc["type"] == "changeFanOutSpd" && currentMode == "manual") {
      int speed = doc["data"];
      if (speed > 3)
        manuallyTurnedOff = false;
      sendWebSocketCommand("changeFanOutSpd", fanOutSpeed, speed);
      handleValueSpeedForTurnOnFans();
    }
  }
}

void handleWebSocketInitialization() {
  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<300> doc;
  doc["device"] = "esp32";
  doc["type"] = "init";

  JsonObject data = doc.createNestedObject("data");

  data["switchState"] = isFanEnabled;
  data["mode"] = currentMode;
  data["fanInSpd"] = fanInSpeed;
  data["fanOutSpd"] = fanOutSpeed;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("[WebSocket] Sent: " + jsonString);
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
  case WStype_DISCONNECTED:
    Serial.println("[WebSocket] Disconnected!");
    webSocketConnected = false;
    break;

  case WStype_CONNECTED:
    Serial.printf("[WebSocket] Connected to: %s\n", payload);
    webSocketConnected = true;
    handleWebSocketInitialization();
    break;

  case WStype_TEXT:
    handleWebSocketMessage((const char *)payload);
    break;

  case WStype_ERROR:
    Serial.println("[WebSocket] Error occurred!");
    break;

  default:
    break;
  }
}

void sendWebSocketData() {
  if (!webSocketConnected)
    return;

  StaticJsonDocument<300> doc;
  doc["device"] = "esp32";
  doc["type"] = "update";

  JsonObject data = doc.createNestedObject("data");

  data["tempOut"] = round(tempSensor.getTemperature() * 10.0) / 10.0;
  data["tempIn"] = round(co2Sensor.getTemperature() * 10.0) / 10.0;
  data["co2"] = co2Sensor.getCO2();
  data["humidity"] = round(co2Sensor.getHumidity() * 10.0) / 10.0;
  data["fanInRPM"] = fanToInside.getRPM();
  data["fanOutRPM"] = fanToOutside.getRPM();
  data["fanInSpd"] = fanInSpeed;
  data["fanOutSpd"] = fanOutSpeed;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("[WebSocket] Sent: " + jsonString);
}

void setup() {
  Serial.begin(115200);

  Serial.println("=== ESP32-S3 Smart Recuperation System by Danilka ===");

  fanToInside.begin();
  fanToOutside.begin();
  tempSensor.begin();

  if (co2Sensor.begin(&Wire, SDA_PIN, SCL_PIN)) {
    Serial.println("[SCD40] Sensor initialized successfully!");
  } else {
    Serial.println("[SCD40] Failed to initialize sensor!");
  }

  fanToInside.setSpeedPercent(fanInSpeed);
  fanToOutside.setSpeedPercent(fanOutSpeed);

  Serial.println("[WiFi] Connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());

    delay(2000);

    Serial.println("[WebSocket] Initializing...");
    webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    Serial.println("[WebSocket] Initialized");
  } else {
    Serial.println("\n[WiFi] Failed to connect!");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    webSocket.loop();
  }

  fanToInside.update();
  fanToOutside.update();
  tempSensor.update();
  co2Sensor.update();

  static unsigned long lastWebSocketSend = 0;
  if (millis() - lastWebSocketSend > 3000) {
    sendWebSocketData();
    lastWebSocketSend = millis();
  }

  handleFanControl();
  handleFansByAirQuality();

  delay(50);
}
