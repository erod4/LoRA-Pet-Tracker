#include "tasks_common.h"
#include "status_handler.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "esp_mac.h"
#include "LoRa.h"
#include "battery.h"
#include <stdio.h>

void status_handler_task(void* pvParam)
{
    for (;;)
    {
        // 3 second timeout
        vTaskDelay(3000 / portTICK_PERIOD_MS);
        // send battery level
        char batt_buff[4];
        snprintf(batt_buff, sizeof(batt_buff), "%d", adc_read_battery_voltage());
        ESP_LOGI("Battery Level", "%s", batt_buff);
        lora_send_data(batt_buff, 0);
        vTaskDelay(pdMS_TO_TICKS(500));
        // send light level
        // lock resource [this is bc two task are reading or writing this resource]
        if (tracker_light_lvl != -1)
        {
            if (xSemaphoreTake(light_lvl_mutex, portMAX_DELAY))
            {
                // read and send resource if not -1

                char light_buff[4];
                snprintf(light_buff, sizeof(light_buff), "%d", tracker_light_lvl);
                lora_send_data(light_buff, 1);

                // unlock resource
                xSemaphoreGive(light_lvl_mutex);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(500));

        // send coordinates
        lora_send_data("37.7749&-122.4194", 2);
    }
}

void init_status_handler_task(void)
{
    xTaskCreate(status_handler_task, "Status Handler", STATUS_HANDLER_STACK_SIZE, NULL,
                STATUS_HANDLER_STACK_PRIORITY, NULL);
}
