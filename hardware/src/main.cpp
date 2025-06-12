#include <Arduino.h>
#include <ArduinoJson.h>
#include <FanController.h>
#include <SCD40Sensor.h>
#include <TemperatureSensor.h>
#include <WebSocketsClient.h>
#include <WiFi.h>
#include <Wire.h>

// WiFi налаштування
#define WIFI_SSID "Urec_Holodec"
#define WIFI_PASSWORD "nash526safron"

// WebSocket налаштування
#define WS_HOST "192.168.31.88"
#define WS_PORT 3000
#define WS_PATH "/ws"

// I2C піни для SCD40
#define SDA_PIN 45
#define SCL_PIN 0

// ГЛОБАЛЬНІ ЗМІННІ ДЛЯ ШВИДКОСТІ ВЕНТИЛЯТОРІВ
int fanInSpeed = 50;  // Швидкість внутрішнього вентилятора (%)
int fanOutSpeed = 50; // Швидкість зовнішнього вентилятора (%)

FanController fanToInside(1, 0, 2, 2);
FanController fanToOutside(42, 1, 41, 2);

TemperatureSensor tempSensor(16);
SCD40Sensor co2Sensor;

WebSocketsClient webSocket;

bool webSocketConnected = false;

bool isFanEnabled = true;
String currentMode = "auto";

void handleFanControl() {
  if (isFanEnabled) {
    fanToInside.setSpeedPercent(fanInSpeed);
    fanToOutside.setSpeedPercent(fanOutSpeed);
  } else {
    fanToInside.setSpeedPercent(0);
    fanToOutside.setSpeedPercent(0);
  }
}

void switchState(bool state) {
  isFanEnabled = state;

  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<300> doc;
  doc["device"] = "esp32";
  doc["type"] = "switchState";
  doc["data"] = isFanEnabled;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("[WebSocket] Sent: " + jsonString);
}

void changeMode(String state) {
  currentMode = state;

  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<300> doc;
  doc["device"] = "esp32";
  doc["type"] = "changeMode";
  doc["data"] = currentMode;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
  Serial.println("[WebSocket] Sent: " + jsonString);
}

// void changeFanSpd(int currentFan, String type, String state) {
//   currentFan = state.toInt();

//   if (!webSocketConnected) {
//     return;
//   }

//   StaticJsonDocument<300> doc;
//   doc["device"] = "esp32";
//   doc["type"] = type;
//   doc["data"] = currentFan;

//   String jsonString;
//   serializeJson(doc, jsonString);

//   webSocket.sendTXT(jsonString);
//   Serial.println("[WebSocket] Sent: " + jsonString);
// }

template <typename T>
void sendWebSocketCommand(const String &type, const T &value,
                          const String &state) {
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
      sendWebSocketCommand("switchState", isFanEnabled, state);
      // switchState(state);
    }
    if (doc["type"] == "changeMode") {
      String mode = doc["data"];
      sendWebSocketCommand("changeMode", currentMode, mode);
      // changeMode(mode);
    }
    if (doc["type"] == "ChangeFanInSpd") {
      int speed = doc["data"];
      sendWebSocketCommand("ChangeFanInSpd", fanInSpeed, speed);
    }
    if (doc["type"] == "ChangeFanOutSpd") {
      int speed = doc["data"];
      sendWebSocketCommand("ChangeFanOutSpd", fanOutSpeed, speed);
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

  delay(50);
}
