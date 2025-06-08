#ifndef TEMPERATURESENSOR_H
#define TEMPERATURESENSOR_H

#include <OneWire.h>
#include <DallasTemperature.h>

class TemperatureSensor {
public:
    TemperatureSensor(uint8_t pin); 
    void begin();
    float getTemperature(); 
    void update();           

private:
    OneWire oneWire;
    DallasTemperature sensors;
    float lastTemperature = -127.0;
    unsigned long lastRequestTime = 0;
    unsigned long lastReadTime = 0;
    bool waitingForConversion = false;
};

#endif
