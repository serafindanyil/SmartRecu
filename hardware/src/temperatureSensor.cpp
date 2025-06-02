#include "temperatureSensor.h"

TemperatureSensor::TemperatureSensor(uint8_t pin)
    : oneWire(pin), sensors(&oneWire) {
}

void TemperatureSensor::begin() {
    sensors.begin();
}

float TemperatureSensor::getTemperature() {
    sensors.requestTemperatures();
    return sensors.getTempCByIndex(0);
}
