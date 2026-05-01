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

#define WS_HOST "192.168.31.45"
#define WS_PORT 3000
#define WS_PATH "/ws"

#define SDA_PIN 45
#define SCL_PIN 0

const int DEFAULT_FAN_IN_SPEED = 50;
const int DEFAULT_FAN_OUT_SPEED = 50;
const int MIN_ACTIVE_FAN_SPEED = 3;
const int CO2_WELL_MAX = 599;
const int CO2_GOOD_MAX = 999;
const int CO2_BAD_MAX = 3999;
const unsigned long WEBSOCKET_SEND_INTERVAL_MS = 3000;
const unsigned long WEBSOCKET_RECONNECT_INTERVAL_MS = 5000;
const unsigned long WEBSOCKET_HEARTBEAT_INTERVAL_MS = 15000;
const unsigned long WEBSOCKET_HEARTBEAT_TIMEOUT_MS = 3000;
const uint8_t WEBSOCKET_HEARTBEAT_RETRIES = 2;
const size_t COMMAND_JSON_SIZE = 300;
const size_t MESSAGE_JSON_SIZE = 200;

const char *MODE_AUTO = "auto";
const char *MODE_MANUAL = "manual";
const char *MODE_TURBO = "turbo";
const char *DEVICE_NAME = "esp32";
const char *TYPE_INIT = "init";
const char *TYPE_UPDATE = "update";
const char *TYPE_SWITCH_STATE = "switchState";
const char *TYPE_CHANGE_MODE = "changeMode";
const char *TYPE_CHANGE_FAN_IN_SPEED = "changeFanInSpd";
const char *TYPE_CHANGE_FAN_OUT_SPEED = "changeFanOutSpd";

int fanInSpeed = DEFAULT_FAN_IN_SPEED;
int fanOutSpeed = DEFAULT_FAN_OUT_SPEED;

FanController fanToInside(1, 0, 2, 2);
FanController fanToOutside(42, 1, 41, 2);

TemperatureSensor tempSensor(16);
SCD40Sensor co2Sensor;

WebSocketsClient webSocket;

bool webSocketConnected = false;

bool isFanEnabled = true;
String currentMode = MODE_AUTO;

bool lastFanEnabledState = true;
bool manuallyTurnedOff = false;

void logRecuperatorStatus() {
  Serial.printf("[Status] mode=%s, fans=%s\n", currentMode.c_str(),
                isFanEnabled ? "on" : "off");
}

enum AirQuality { WELL = 0, GOOD = 1, BAD = 2, POOR = 3 };

const int fanInSpeedsByQualityCO2[4] = {30, 50, 75, 100};
const int fanOutSpeedsByQualityCO2[4] = {30, 50, 75, 100};

template <typename T>
void sendWebSocketCommand(const String &type, T &value, const T &state) {
  value = state;

  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<COMMAND_JSON_SIZE> doc;
  doc["device"] = DEVICE_NAME;
  doc["type"] = type;
  doc["data"] = value;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
}

AirQuality getAirQuality(int CO2) {
  if (CO2 <= CO2_WELL_MAX)
    return WELL;
  if (CO2 <= CO2_GOOD_MAX)
    return GOOD;
  if (CO2 <= CO2_BAD_MAX)
    return BAD;
  return POOR;
}

void updateFanSpeedIfChanged(const char *type, int &currentSpeed,
                             int nextSpeed) {
  if (currentSpeed == nextSpeed)
    return;

  sendWebSocketCommand(type, currentSpeed, nextSpeed);
}

AirQuality updateFanSpeedsByAirQuality() {
  int CO2 = co2Sensor.getCO2();
  AirQuality quality = getAirQuality(CO2);

  updateFanSpeedIfChanged(TYPE_CHANGE_FAN_IN_SPEED, fanInSpeed,
                          fanInSpeedsByQualityCO2[quality]);
  updateFanSpeedIfChanged(TYPE_CHANGE_FAN_OUT_SPEED, fanOutSpeed,
                          fanOutSpeedsByQualityCO2[quality]);

  return quality;
}

void handleFansByAirQuality() {
  if (currentMode != MODE_AUTO)
    return;

  AirQuality quality = updateFanSpeedsByAirQuality();

  if (!manuallyTurnedOff && quality >= BAD && !isFanEnabled) {
    sendWebSocketCommand(TYPE_SWITCH_STATE, isFanEnabled, true);
    lastFanEnabledState = isFanEnabled;
  }
}

void changeFansToDefaultSpeed() {
  sendWebSocketCommand(TYPE_CHANGE_FAN_IN_SPEED, fanInSpeed,
                       DEFAULT_FAN_IN_SPEED);
  sendWebSocketCommand(TYPE_CHANGE_FAN_OUT_SPEED, fanOutSpeed,
                       DEFAULT_FAN_OUT_SPEED);
}

void handleManualModeLogic(bool state) {
  if (currentMode != MODE_MANUAL)
    return;

  if (state == true && fanInSpeed <= MIN_ACTIVE_FAN_SPEED &&
      fanOutSpeed <= MIN_ACTIVE_FAN_SPEED) {
    changeFansToDefaultSpeed();
  }
}

void handleAutoFanSwitch(const String &mode) {
  currentMode = mode;

  if (mode != MODE_MANUAL) {
    manuallyTurnedOff = false;
  }
}

void handleValueSpeedForTurnOnFans() {
  if (currentMode != MODE_MANUAL)
    return;

  if (manuallyTurnedOff)
    return;

  if ((fanOutSpeed > MIN_ACTIVE_FAN_SPEED ||
       fanInSpeed > MIN_ACTIVE_FAN_SPEED) &&
      !isFanEnabled) {
    sendWebSocketCommand(TYPE_SWITCH_STATE, isFanEnabled, true);
    lastFanEnabledState = isFanEnabled;
  }
}

void handleMinimalSpeedForTurnOffFans() {
  if (currentMode != MODE_MANUAL)
    return;

  if ((fanOutSpeed <= MIN_ACTIVE_FAN_SPEED &&
       fanInSpeed <= MIN_ACTIVE_FAN_SPEED) &&
      isFanEnabled) {
    sendWebSocketCommand(TYPE_SWITCH_STATE, isFanEnabled, false);
    lastFanEnabledState = isFanEnabled;
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

  if (currentMode == MODE_MANUAL) {
    handleMinimalSpeedForTurnOffFans();
  }
}

void handleWebSocketMessage(const String &message) {
  Serial.println("[WebSocket] Received: " + message);

  StaticJsonDocument<MESSAGE_JSON_SIZE> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.printf("[WebSocket] JSON parse error: %s\n", error.c_str());
    return;
  }

  if (doc.containsKey("type")) {
    if (doc["type"] == TYPE_SWITCH_STATE) {
      bool state = doc["data"];

      if (!state && (currentMode == MODE_MANUAL || currentMode == MODE_AUTO)) {
        manuallyTurnedOff = true;
      } else if (state &&
                 (currentMode == MODE_MANUAL || currentMode == MODE_AUTO)) {
        manuallyTurnedOff = false;
      }

      handleManualModeLogic(state);
      sendWebSocketCommand(TYPE_SWITCH_STATE, isFanEnabled, state);
    }
    if (doc["type"] == TYPE_CHANGE_MODE) {
      String mode = doc["data"];
      handleAutoFanSwitch(mode);
      sendWebSocketCommand(TYPE_CHANGE_MODE, currentMode, mode);
      if (mode == MODE_TURBO) {
        sendWebSocketCommand(TYPE_CHANGE_FAN_IN_SPEED, fanInSpeed, 100);
        sendWebSocketCommand(TYPE_CHANGE_FAN_OUT_SPEED, fanOutSpeed, 100);
        sendWebSocketCommand(TYPE_SWITCH_STATE, isFanEnabled, true);
      } else if (mode == MODE_AUTO) {
        handleFansByAirQuality();
      }
    }
    if (doc["type"] == TYPE_CHANGE_FAN_IN_SPEED && currentMode == MODE_MANUAL) {
      int speed = doc["data"];
      if (speed > MIN_ACTIVE_FAN_SPEED)
        manuallyTurnedOff = false;
      sendWebSocketCommand(TYPE_CHANGE_FAN_IN_SPEED, fanInSpeed, speed);
      handleValueSpeedForTurnOnFans();
    }
    if (doc["type"] == TYPE_CHANGE_FAN_OUT_SPEED &&
        currentMode == MODE_MANUAL) {
      int speed = doc["data"];
      if (speed > MIN_ACTIVE_FAN_SPEED)
        manuallyTurnedOff = false;
      sendWebSocketCommand(TYPE_CHANGE_FAN_OUT_SPEED, fanOutSpeed, speed);
      handleValueSpeedForTurnOnFans();
    }
  }

  logRecuperatorStatus();
}

void handleWebSocketInitialization() {
  if (!webSocketConnected) {
    return;
  }

  StaticJsonDocument<COMMAND_JSON_SIZE> doc;
  doc["device"] = DEVICE_NAME;
  doc["type"] = TYPE_INIT;

  JsonObject data = doc.createNestedObject("data");

  data["switchState"] = isFanEnabled;
  data["mode"] = currentMode;
  data["fanInSpd"] = fanInSpeed;
  data["fanOutSpd"] = fanOutSpeed;

  String jsonString;
  serializeJson(doc, jsonString);

  webSocket.sendTXT(jsonString);
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
    logRecuperatorStatus();
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

  StaticJsonDocument<COMMAND_JSON_SIZE> doc;
  doc["device"] = DEVICE_NAME;
  doc["type"] = TYPE_UPDATE;

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
}

void setup() {
  Serial.begin(115200);

  fanToInside.begin();
  fanToOutside.begin();
  tempSensor.begin();

  co2Sensor.begin(&Wire, SDA_PIN, SCL_PIN);

  fanToInside.setSpeedPercent(fanInSpeed);
  fanToOutside.setSpeedPercent(fanOutSpeed);

  Serial.println("[WiFi] Connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) {
    delay(500);
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());

    delay(2000);

    Serial.println("[WebSocket] Initializing...");
    webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(WEBSOCKET_RECONNECT_INTERVAL_MS);
    webSocket.enableHeartbeat(WEBSOCKET_HEARTBEAT_INTERVAL_MS,
                              WEBSOCKET_HEARTBEAT_TIMEOUT_MS,
                              WEBSOCKET_HEARTBEAT_RETRIES);
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

  handleFansByAirQuality();
  handleFanControl();

  static unsigned long lastWebSocketSend = 0;
  if (millis() - lastWebSocketSend > WEBSOCKET_SEND_INTERVAL_MS) {
    sendWebSocketData();
    lastWebSocketSend = millis();
  }

  delay(50);
}
