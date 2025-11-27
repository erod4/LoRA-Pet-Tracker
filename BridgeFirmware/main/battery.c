#include "battery.h"
#include "driver/adc.h"
#include "esp_adc/adc_cali.h"
#include "esp_adc/adc_cali_scheme.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_err.h"
#include "esp_log.h"

#include <stdint.h>

static const char *TAG = "BATTERY_ADC";

#define R8_VALUE 10000.0f                                // 10kΩ
#define R7_VALUE 10000.0f                                // 10kΩ
#define DIVIDER_RATIO ((R8_VALUE + R7_VALUE) / R7_VALUE) // Should be 2.0

static adc_oneshot_unit_handle_t adc1_handle = NULL;
static adc_cali_handle_t adc1_cali_handle = NULL;
static bool calibration_enabled = false;

esp_err_t adc_battery_init(void) {
  esp_err_t ret;

  // Step 1: Configure ADC unit
  adc_oneshot_unit_init_cfg_t init_config = {
      .unit_id = ADC_UNIT,
      .ulp_mode = ADC_ULP_MODE_DISABLE,
  };
  ret = adc_oneshot_new_unit(&init_config, &adc1_handle);
  if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to initialize ADC unit: %s", esp_err_to_name(ret));
    return ret;
  }

  // Step 2: Configure ADC channel
  adc_oneshot_chan_cfg_t config = {
      .bitwidth = ADC_BITWIDTH_DEFAULT,
      .atten = ADC_ATTEN,
  };
  ret = adc_oneshot_config_channel(adc1_handle, ADC_CHANNEL, &config);
  if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to configure ADC channel: %s", esp_err_to_name(ret));
    return ret;
  }

  // Step 3: Initialize calibration
#if ADC_CALI_SCHEME_CURVE_FITTING_SUPPORTED
  adc_cali_curve_fitting_config_t cali_config = {
      .unit_id = ADC_UNIT,
      .chan = ADC_CHANNEL,
      .atten = ADC_ATTEN,
      .bitwidth = ADC_BITWIDTH_DEFAULT,
  };
  ret = adc_cali_create_scheme_curve_fitting(&cali_config, &adc1_cali_handle);
  if (ret == ESP_OK) {
    calibration_enabled = true;
    ESP_LOGI(TAG, "ADC calibration initialized - Scheme: Curve Fitting");
  }
#elif ADC_CALI_SCHEME_LINE_FITTING_SUPPORTED
  adc_cali_line_fitting_config_t cali_config = {
      .unit_id = ADC_UNIT,
      .atten = ADC_ATTEN,
      .bitwidth = ADC_BITWIDTH_DEFAULT,
  };
  ret = adc_cali_create_scheme_line_fitting(&cali_config, &adc1_cali_handle);
  if (ret == ESP_OK) {
    calibration_enabled = true;
    ESP_LOGI(TAG, "ADC calibration initialized - Scheme: Line Fitting");
  }
#endif

  return ESP_OK;
}

int adc_read_battery_voltage() {
  if (adc1_handle == NULL) {
    return ESP_ERR_INVALID_STATE;
  }

  int adc_raw;
  esp_err_t ret;

  // Read raw ADC value
  ret = adc_oneshot_read(adc1_handle, ADC_CHANNEL, &adc_raw);
  if (ret != ESP_OK) {
    ESP_LOGE(TAG, "Failed to read ADC: %s", esp_err_to_name(ret));
  }
  int voltage_mv;
  if (calibration_enabled) {

    // Convert to calibrated voltage in mV
    ret = adc_cali_raw_to_voltage(adc1_cali_handle, adc_raw, &voltage_mv);
    if (ret != ESP_OK) {
      ESP_LOGE(TAG, "Failed to convert ADC to voltage: %s",
               esp_err_to_name(ret));
    }
    voltage_mv = ((voltage_mv > V_MAX)   ? V_MAX
                  : (voltage_mv < V_MIN) ? V_MIN
                                         : voltage_mv);
  }
  return ((voltage_mv - V_MIN) * 100 / (V_MAX - V_MIN));
}