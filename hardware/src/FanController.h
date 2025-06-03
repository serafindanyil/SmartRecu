#ifndef FANCONTROLLER_H
#define FANCONTROLLER_H

#include <Arduino.h>

class FanController {
public:
    FanController(uint8_t pwmPin, uint8_t pwmChannel, uint8_t tachPin);
    void begin();
    void setSpeedPercent(uint8_t percent);
    void update(); // викликати у loop() для обчислення RPM і виводу імпульсів
    uint16_t getRPM();

private:
    uint8_t _pwmPin;
    uint8_t _pwmChannel;
    uint8_t _tachPin;

    volatile uint16_t _pulseCount = 0;
    volatile unsigned long _lastPulseTime = 0; // для debounce у ISR

    unsigned long _lastRPMCalcTime = 0;
    uint16_t _rpm = 0;

    static constexpr uint8_t PULSES_PER_REV = 2; // 2 імпульси на оберт (для Arctic P12 MAX)

    static FanController* instance; // для статичного ISR
    static void IRAM_ATTR pulseISRStatic();
    void IRAM_ATTR pulseISR();

    portMUX_TYPE _mux = portMUX_INITIALIZER_UNLOCKED; // для критичних секцій
};

#endif
