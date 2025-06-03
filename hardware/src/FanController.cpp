#include "FanController.h"

FanController* FanController::instance = nullptr;

FanController::FanController(uint8_t pwmPin, uint8_t pwmChannel, uint8_t tachPin)
    : _pwmPin(pwmPin), _pwmChannel(pwmChannel), _tachPin(tachPin) {
    instance = this;
}

void IRAM_ATTR FanController::pulseISRStatic() {
    if (instance) instance->pulseISR();
}

void IRAM_ATTR FanController::pulseISR() {
    unsigned long now = micros();
    // Дебаунс: ігноруємо імпульси, які йдуть частіше ніж 2000 мкс (2 мс)
    if (now - _lastPulseTime > 2000) {
        portENTER_CRITICAL_ISR(& _mux);
        _pulseCount++;
        portEXIT_CRITICAL_ISR(& _mux);
        _lastPulseTime = now;
    }
}

void FanController::begin() {
    ledcSetup(_pwmChannel, 25000, 8);
    ledcAttachPin(_pwmPin, _pwmChannel);

    pinMode(_tachPin, INPUT_PULLUP); // рекомендую зовнішній pull-up 10кОм

    attachInterrupt(digitalPinToInterrupt(_tachPin), pulseISRStatic, FALLING);

    setSpeedPercent(0);
    _lastRPMCalcTime = millis();
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

        Serial.print("Pulses counted in 1 sec: ");
        Serial.println(pulses);

        _rpm = (pulses * 60) / PULSES_PER_REV;
        _lastRPMCalcTime = now;
    }
}

uint16_t FanController::getRPM() {
    return _rpm;
}
