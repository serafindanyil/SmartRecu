#include "TemperatureSensor.h"

TemperatureSensor::TemperatureSensor(uint8_t pin)
    : oneWire(pin), sensors(&oneWire) {
}

void TemperatureSensor::begin() {
    sensors.begin();
    if (sensors.getDeviceCount() == 0) {
        Serial1.println("❌ Temperature sensor not found!");
    } else {
        Serial1.print("✅ Found ");
        Serial1.print(sensors.getDeviceCount());
        Serial1.println(" temperature sensor(s).");
    }
}


void TemperatureSensor::update() {
    unsigned long now = millis();

    if (!waitingForConversion && now - lastRequestTime >= 1000) {
        sensors.requestTemperatures();  
        lastRequestTime = now;
        waitingForConversion = true;
    }

    if (waitingForConversion && now - lastRequestTime >= 750) {
        lastTemperature = sensors.getTempCByIndex(0); 
        waitingForConversion = false;
    }
}

float TemperatureSensor::getTemperature() {
    return lastTemperature;
}
