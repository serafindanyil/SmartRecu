#include "FanController.h"

FanController::FanController(uint8_t pwmPin, uint8_t pwmChannel, uint8_t tachPin, uint8_t pulsesPerRev)
    : _pwmPin(pwmPin), _pwmChannel(pwmChannel), _tachPin(tachPin), _pulsesPerRev(pulsesPerRev) {}

void IRAM_ATTR pulseISRWrapperInside();
void IRAM_ATTR pulseISRWrapperOutside();

static FanController* fanInsidePtr = nullptr;
static FanController* fanOutsidePtr = nullptr;

void IRAM_ATTR pulseISRWrapperInside() {
    if (fanInsidePtr) fanInsidePtr->pulseISR();
}

void IRAM_ATTR pulseISRWrapperOutside() {
    if (fanOutsidePtr) fanOutsidePtr->pulseISR();
}

void FanController::begin() {
    ledcSetup(_pwmChannel, 25000, 8);
    ledcAttachPin(_pwmPin, _pwmChannel);
    pinMode(_tachPin, INPUT_PULLUP);

    if (_tachPin == 2) {
        fanInsidePtr = this;
        attachInterrupt(digitalPinToInterrupt(_tachPin), pulseISRWrapperInside, FALLING);
    } else if (_tachPin == 41) {
        fanOutsidePtr = this;
        attachInterrupt(digitalPinToInterrupt(_tachPin), pulseISRWrapperOutside, FALLING);
    }

    setSpeedPercent(0);
    _lastRPMCalcTime = millis();
}

void IRAM_ATTR FanController::pulseISR() {
    unsigned long now = micros();
    if (now - _lastPulseTime >= MIN_PULSE_INTERVAL_US) {
        portENTER_CRITICAL_ISR(&_mux);
        _pulseCount++;
        portEXIT_CRITICAL_ISR(&_mux);
        _lastPulseTime = now;
    }
}

void FanController::setSpeedPercent(uint8_t percent) {
    if (percent > 100) percent = 100;
    uint8_t duty = (percent * 255) / 100;
    ledcWrite(_pwmChannel, duty);
}

void FanController::update() {
    unsigned long now = millis();
    if (now - _lastRPMCalcTime >= 1000) {
        uint16_t pulses;
        portENTER_CRITICAL(&_mux);
        pulses = _pulseCount;
        _pulseCount = 0;
        portEXIT_CRITICAL(&_mux);

        _rpm = (pulses * 60) / _pulsesPerRev;
        _lastRPMCalcTime = now;
    }
}

uint16_t FanController::getRPM() {
    return _rpm;
}
