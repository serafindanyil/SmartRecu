#include <Arduino.h>
#include <FanController.h>
#include <TemperatureSensor.h>
#include <SCD40Sensor.h>

#define RX_PIN 44
#define TX_PIN 43

FanController fanToInside(1, 0, 2, 2);
FanController fanToOutside(42, 1, 41, 2);

TemperatureSensor tempSensor(16);
SCD40Sensor co2Sensor(36, 37);

void setup() {
  Serial1.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);

  fanToInside.begin();    
  fanToOutside.begin();
  tempSensor.begin();   
  co2Sensor.begin();

  fanToInside.setSpeedPercent(100); 
  fanToOutside.setSpeedPercent(10); 
}

void loop() {
  fanToInside.update();
  fanToOutside.update();
  tempSensor.update();  
  co2Sensor.update(); 


  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 2000) {
    Serial1.print("Fan to Inside RPM: ");
    Serial1.println(fanToInside.getRPM());

    Serial1.print("Fan to Outside RPM: ");
    Serial1.println(fanToOutside.getRPM());

    Serial1.print("Temperature thermistor: ");
    Serial1.println(tempSensor.getTemperature()); 

    Serial1.print("CO2 concentration: ");
    Serial1.print(co2Sensor.getCO2());  
    Serial1.println(" ppm");

    Serial1.print("Temperature SCD40: ");
    Serial1.print(co2Sensor.getTemperature()); 
    Serial1.println(" °C");

    Serial1.print("Humidity SCD40: ");
    Serial1.print(co2Sensor.getHumidity()); 
    Serial1.println(" %");  

    lastPrint = millis();
  }
}

