#ifndef FANCONTROLLER_H
#define FANCONTROLLER_H

#include <Arduino.h>

class FanController {
public:
    FanController(uint8_t pwmPin, uint8_t pwmChannel, uint8_t tachPin, uint8_t pulsesPerRev);
    void begin();
    void setSpeedPercent(uint8_t percent);
    void update();
    uint16_t getRPM();

    void pulseISR();

private:
    uint8_t _pwmPin;
    uint8_t _pwmChannel;
    uint8_t _tachPin;
    uint8_t _pulsesPerRev;

    volatile uint16_t _pulseCount = 0;
    volatile unsigned long _lastPulseTime = 0;

    unsigned long _lastRPMCalcTime = 0;
    uint16_t _rpm = 0;

    static constexpr uint16_t MIN_PULSE_INTERVAL_US = 3000;

    portMUX_TYPE _mux = portMUX_INITIALIZER_UNLOCKED;
};

#endif
