#include "SCD40Sensor.h"

SCD40Sensor::SCD40Sensor() {}

bool SCD40Sensor::begin(TwoWire *wire, uint8_t sdaPin, uint8_t sclPin) {
  customWire = wire;

  customWire->begin(sdaPin, sclPin, 100000);
  delay(1000);
  yield();

  sensor.begin(*customWire, SCD40_I2C_ADDR_62);
  delay(1000);
  yield();

  error = sensor.wakeUp();
  delay(20);
  yield();

  error = sensor.stopPeriodicMeasurement();
  delay(500);
  yield();

  error = sensor.reinit();
  delay(20);
  yield();

  uint64_t serialNumber;
  error = sensor.getSerialNumber(serialNumber);

  if (error != 0) {
    return false;
  }

  error = sensor.startPeriodicMeasurement();

  if (error != 0) {
    return false;
  }

  delay(5000);
  return true;
}

void SCD40Sensor::update() {
  yield();

  bool ready = false;
  error = sensor.getDataReadyStatus(ready);

  if (error != 0 || !ready) {
    return;
  }

  error = sensor.readMeasurement(co2, temperature, humidity);
  yield();

  if (error != 0) {
    return;
  }

  if (co2 == 0 && temperature == 0.0 && humidity == 0.0) {
    return;
  }
}

void SCD40Sensor::printError(const char *errorMessage) {
  // Порожня функція
}