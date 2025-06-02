#pragma once

#include <Wire.h>
#include <SensirionI2cScd4x.h>

class SCD40Sensor {
public:
    SCD40Sensor(uint8_t sdaPin, uint8_t sclPin);

    bool begin();
    void update();

    uint16_t getCO2() const { return co2; }
    float getTemperature() const { return temperature; }
    float getHumidity() const { return humidity; }

private:
    TwoWire customWire;
    SensirionI2cScd4x sensor;
    int16_t error;
    char errorMessage[64];

    uint16_t co2 = 0;
    float temperature = 0;
    float humidity = 0;

    uint8_t sdaPin;
    uint8_t sclPin;

    void printError(const char* label);
};
