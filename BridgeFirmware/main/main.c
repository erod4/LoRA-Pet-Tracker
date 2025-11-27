
#include "LoRa.h"
#include "battery.h"
#include "ble.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "sdkconfig.h"

void app_main(void) {

  nvs_flash_init();
  esp_err_t ret = adc_battery_init();
  if (ret != ESP_OK) {
    // ESP_LOGE("Battery", "Failed to initialize ADC, aborting...");
    return;
  }
  init_lora();
  lora_task_config();
  ble_init();
}