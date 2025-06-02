#include <Arduino.h>

const int pwmPin = 18;      // Пін, до якого підключено вентилятор або світлодіод
const int pwmChannel = 0;   // Канал 0 (доступні 0–15)
const int pwmFreq = 25000;  // Частота (25 кГц — хороша для вентилятора)
const int pwmResolution = 8; // 8 біт (0–255)

void setup() {
  Serial.begin(115200);

  // Налаштування PWM
  ledcSetup(pwmChannel, pwmFreq, pwmResolution);
  ledcAttachPin(pwmPin, pwmChannel);

  Serial.println("PWM ready on pin 18");
}

void loop() {
  for (int duty = 0; duty <= 255; duty += 50) {
    ledcWrite(pwmChannel, duty);  // Змінюємо duty на каналі, а не піні
    Serial.print("PWM duty: ");
    Serial.println(duty);
    delay(2000);
  }
}
