#include "GPIO.h"
#include "LoRa.h"
#include "battery.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "sdkconfig.h"
#include "status_handler.h"
#include "driver/gpio.h"
#include "driver/uart.h"

void app_main(void)
{
    nvs_flash_init();
    config_leds();
    set_brightness(0);
    config_buzzer();
    esp_err_t ret = adc_battery_init();
    if (ret != ESP_OK)
    {
        ESP_LOGE("Battery", "Failed to initialize ADC, aborting...");
        return;
    }

    light_lvl_mutex = xSemaphoreCreateMutex();

    if (light_lvl_mutex == NULL)
    {
        ESP_LOGE("MUTEX", "Light Level Mutex Creation Failed");
    }
    else
    {
        ESP_LOGI("MUTEX", "Light Level Mutex Creation Success");
    }
    init_lora();

    lora_task_config();

    init_status_handler_task();
}