#ifndef BATTERY_H_
#define BATTERY_H_

#include "esp_err.h"
#include "esp_log.h"
#include <stdint.h>

#define ADC_CHANNEL ADC_CHANNEL_4  // GPIO4 on ESP32-C6
#define ADC_ATTEN ADC_ATTEN_DB_12  // For 0-3.1V range
#define ADC_UNIT ADC_UNIT_1

#define V_MAX 2100
#define V_MIN 1500

esp_err_t adc_battery_init(void);
int adc_read_battery_voltage();
#endif