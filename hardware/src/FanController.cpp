#include "FanController.h"

FanController::FanController(uint8_t pwmPin, uint8_t pwmChannel)
    : _pwmPin(pwmPin), _pwmChannel(pwmChannel) {}

void FanController::begin() {
    ledcSetup(_pwmChannel, 25000, 8); // 25kHz, 8-bit
    ledcAttachPin(_pwmPin, _pwmChannel);
    setSpeedPercent(0);
}

void FanController::setSpeedPercent(uint8_t percent) {
    if (percent > 100) percent = 100;
    uint8_t duty = (percent * 255) / 100;
    ledcWrite(_pwmChannel, duty);
}
