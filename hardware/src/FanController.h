#ifndef FANCONTROLLER_H
#define FANCONTROLLER_H

#include <Arduino.h>

class FanController {
public:
    FanController(uint8_t pwmPin, uint8_t pwmChannel);
    void begin();
    void setSpeedPercent(uint8_t percent);

private:
    uint8_t _pwmPin;
    uint8_t _pwmChannel;
};

#endif
