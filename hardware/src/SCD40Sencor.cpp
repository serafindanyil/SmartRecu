#include "SCD40Sensor.h"

SCD40Sensor::SCD40Sensor(uint8_t sdaPin, uint8_t sclPin)
    : customWire(TwoWire(0)), sdaPin(sdaPin), sclPin(sclPin) {}

bool SCD40Sensor::begin() {
    customWire.begin(sdaPin, sclPin);
    sensor.begin(customWire, SCD41_I2C_ADDR_62);

    delay(20);
    sensor.wakeUp();
    sensor.stopPeriodicMeasurement();
    sensor.reinit();

    uint64_t serialNumber;
    error = sensor.getSerialNumber(serialNumber);
    if (error) {
        printError("getSerialNumber");
        return false;
    }

    error = sensor.startPeriodicMeasurement();
    if (error) {
        printError("startPeriodicMeasurement");
        return false;
    }

    return true;
}

void SCD40Sensor::update() {
    bool ready = false;
    error = sensor.getDataReadyStatus(ready);
    if (error || !ready) return;

    error = sensor.readMeasurement(co2, temperature, humidity);
    if (error) {
        printError("readMeasurement");
    }
}

void SCD40Sensor::printError(const char* label) {
    errorToString(error, errorMessage, sizeof(errorMessage));
    Serial.print("SCD40 error in ");
    Serial.print(label);
    Serial.print(": ");
    Serial.println(errorMessage);
}
