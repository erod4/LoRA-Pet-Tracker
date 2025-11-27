#include "LoRa.h"

#include "driver/gpio.h"
#include "driver/uart.h"
#include "freertos/timers.h"
#include "GPIO.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "sdkconfig.h"
#include "tasks_common.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "freertos/semphr.h"
#include "esp_sleep.h"
#include "driver/uart.h"
#include "driver/rtc_io.h"

SemaphoreHandle_t light_lvl_mutex;
int tracker_light_lvl = -1;

// init uart to receive and transmit via LoRa (x)

// make function to read from lora (x)

// make function to write to lora
static const char* TAG = "LORA";

static QueueHandle_t uart2_event_queue;

typedef struct
{
    int type;  // 0=sleep,1=light,2=buzzer
    int val;   // for buzzer/light/sleep
} lora_msg_t;

static QueueHandle_t lora_msg_q;

bool await_response(void)
{
    uint8_t data[128];
    int len = 0;
    int total_wait = 0;

    while (total_wait < 1000)
    {
        len = uart_read_bytes(LORA_UART_NUM, data, sizeof(data) - 1, pdMS_TO_TICKS(100));

        if (len > 0)
        {
            data[len] = '\0';
            ESP_LOGI(TAG, "Response: %s", (char*)data);

            // check for +OK
            if (strstr((char*)data, "+OK") != NULL)
            {
                ESP_LOGI(TAG, "GOT +OK");
                return true;
            }
            if (strstr((char*)data, "+ERR=1") != NULL)
            {
                ESP_LOGI(TAG, "GOT +ERR=1");
                return false;
            }
            if (strstr((char*)data, "+ERR=2") != NULL)
            {
                ESP_LOGI(TAG, "GOT +ERR=1");
                return false;
            }
        }
        total_wait += 100;
    }
    ESP_LOGE(TAG, "Timeout occured");
    return false;
}

void buzzer_off_cb(TimerHandle_t xTimer)
{
    buzzer_off();
}

static void lora_consumer_task(void* arg)
{
    lora_msg_t m;
    for (;;)
    {
        if (xQueueReceive(lora_msg_q, &m, portMAX_DELAY))
        {
            switch (m.type)
            {
                case 0:
                    ESP_LOGI(TAG, "Entering light sleep...");

                    // Ensure UART TX is complete
                    uart_wait_tx_idle_polling(LORA_UART_NUM);

                    // Small delay to ensure UART is ready
                    vTaskDelay(pdMS_TO_TICKS(10));

                    // Flush RX buffer before sleep
                    uart_flush_input(LORA_UART_NUM);

                    // Enter light sleep

                    esp_err_t err = esp_light_sleep_start();

                    if (err != ESP_OK)
                    {
                        ESP_LOGE(TAG, "Light sleep failed: %s", esp_err_to_name(err));
                    }
                    else
                    {
                        esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
                        ESP_LOGI(TAG, "Woke from sleep, cause: %d", cause);

                        if (cause == ESP_SLEEP_WAKEUP_UART)
                        {
                            ESP_LOGI(TAG, "Woken by UART");
                        }
                    }

                    break;
                case 1:
                    // set light level
                    set_brightness(m.val);

                    // lock resource [this is bc status handler needs updated light level]
                    if (xSemaphoreTake(light_lvl_mutex, portMAX_DELAY))
                    {
                        // update resource
                        tracker_light_lvl = m.val;

                        // unlock resource
                        xSemaphoreGive(light_lvl_mutex);
                    }

                    break;
                case 2:
                    ESP_LOGI("LORA", "Buzzer: %d", m.val);
                    // turn buzzer on
                    buzzer_on();
                    TimerHandle_t buzzer_timer = xTimerCreate(
                        "Buzzer On Timer", pdMS_TO_TICKS(2000), pdFALSE, NULL, buzzer_off_cb);

                    if (buzzer_timer != NULL)
                    {
                        xTimerStart(buzzer_timer, 0);  // start timer immediately
                    }
                    break;
            }
        }
    }
}

void init_lora(void)
{
    // Configure UART driver params
    uart_config_t lora_uart_config = {
        .baud_rate = LORA_BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };

    int intr_alloc_flags = 0;

#if CONFIG_UART_ISR_IN_IRAM
    intr_alloc_flags = ESP_INTR_FLAG_IRAM;
#endif
    ESP_ERROR_CHECK(uart_driver_install(LORA_UART_NUM, RX_BUFF_SIZE * 2, 0, 20, &uart2_event_queue,
                                        intr_alloc_flags));
    ESP_ERROR_CHECK(uart_param_config(LORA_UART_NUM, &lora_uart_config));
    ESP_ERROR_CHECK(uart_set_pin(LORA_UART_NUM, LORA_TX_PIN, LORA_RX_PIN, 0, 0));  // Change

    // configure LoRa Module
    ESP_LOGI(TAG, "1");
    const char* test = "AT\r\n";
    uart_write_bytes(LORA_UART_NUM, test, strlen(test));
    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }

    // set mode
    ESP_LOGI(TAG, "2");
    const char* mode = "AT+MODE=0\r\n";
    uart_write_bytes(LORA_UART_NUM, mode, strlen(mode));
    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }

    // set band
    ESP_LOGI(TAG, "3");
    const char* band = "AT+BAND=915000000\r\n";
    uart_write_bytes(LORA_UART_NUM, band, strlen(band));
    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }

    // set params
    ESP_LOGI(TAG, "4");
    const char* param = "AT+PARAMETER=9,7,1,12\r\n";
    uart_write_bytes(LORA_UART_NUM, param, strlen(param));
    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }

    // set address      //**CHANGE ON OTHER DEVICE**/
    ESP_LOGI(TAG, "5");
    const char* addr = "AT+ADDRESS=0\r\n";
    uart_write_bytes(LORA_UART_NUM, addr, strlen(addr));
    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }
    // set network id
    ESP_LOGI(TAG, "6");
    const char* network = "AT+NETWORKID=6\r\n";
    uart_write_bytes(LORA_UART_NUM, network, strlen(network));

    if (!await_response())
    {
        ESP_LOGE(TAG, "INVALID");
    }
    // Configure wake-up threshold (characters needed to wake up)
    ESP_ERROR_CHECK(uart_set_wakeup_threshold(LORA_UART_NUM, 3));

    // CRITICAL: Enable light sleep retention for UART
    uart_set_hw_flow_ctrl(LORA_UART_NUM, UART_HW_FLOWCTRL_DISABLE, 0);

    // Configure RX pin to hold its state during sleep
    gpio_pullup_en(LORA_RX_PIN);
    gpio_pulldown_dis(LORA_RX_PIN);

    // Enable UART wake-up
    ESP_ERROR_CHECK(esp_sleep_enable_uart_wakeup(LORA_UART_NUM));

    // IMPORTANT: Configure light sleep to keep UART domain powered
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);

    int thres;
    uart_get_wakeup_threshold(LORA_UART_NUM, &thres);
    ESP_LOGI(TAG, "Wake threshold: %d", thres);
}

void lora_uart_event_task(void* param)
{
    uart_event_t event;
    char rx_tmp[RX_TMP_BUF];

    static char line[LINE_BUF_LEN];
    size_t line_len = 0;

    while (1)
    {
        if (!xQueueReceive(uart2_event_queue, &event, portMAX_DELAY)) continue;

        switch (event.type)
        {
            case UART_DATA:
                int read;
                const TickType_t READ_TIMEOUT = pdMS_TO_TICKS(5);

                do
                {
                    read = uart_read_bytes(LORA_UART_NUM, rx_tmp, RX_TMP_BUF, READ_TIMEOUT);
                    if (read <= 0) break;

                    int start = 0;
                    for (int i = 0; i < read; ++i)
                    {
                        if (rx_tmp[i] == '\n')
                        {
                            // segment [start..i] includes '\n'
                            int seg_len = i - start + 1;
                            if (line_len + seg_len >= sizeof(line))
                            {
                                ESP_LOGW(TAG, "RX line overflow, dropping");
                                line_len = 0;  // drop partial
                            }
                            else
                            {
                                memcpy(&line[line_len], &rx_tmp[start], seg_len);
                                line_len += seg_len;
                                line[line_len] = '\0';  // includes CRLF if present
                                handle_rx(line);        // <-- pass with CRLF
                                line_len = 0;           // reset for next line
                            }
                            start = i + 1;
                        }
                    }

                    // copy any tail (partial line without '\n')
                    if (start < read)
                    {
                        int rem = read - start;
                        if (line_len + rem >= sizeof(line))
                        {
                            ESP_LOGW(TAG, "RX partial overflow, dropping");
                            line_len = 0;
                        }
                        else
                        {
                            memcpy(&line[line_len], &rx_tmp[start], rem);
                            line_len += rem;
                            line[line_len] = '\0';
                        }
                    }
                } while (read > 0);
                taskYIELD();
                break;

            default:
                break;
        }
    }
}

void lora_task_config(void)
{
    xTaskCreate(lora_uart_event_task, "lora_task", LORA_TASK_STACK_SIZE, NULL, LORA_TASK_PRIORITY,
                NULL);
    lora_msg_q = xQueueCreate(8, sizeof(lora_msg_t));
    xTaskCreate(lora_consumer_task, "lora_consumer", 2048, NULL, tskIDLE_PRIORITY + 1, NULL);
}

int lora_send_data(const char* payload, int type_int)
{
    // check size of payload is below 240bytes
    size_t len = strlen(payload);
    if (len > MAX_PAYLOAD_LEN)
    {
        ESP_LOGE(TAG, "Invalid payload length: %d", (int)len);
        return 1;
    }

    char command[300];
    snprintf(command, sizeof(command), "AT+SEND=%d,%d,%d,%s\r\n", LORA_DEST_ADDR, len + 2, type_int,
             payload);
    ESP_LOGI(TAG, "SENT: %s", command);
    int written = uart_write_bytes(LORA_UART_NUM, command, strlen(command));

    if (written < 0)
    {
        ESP_LOGE(TAG, "UART write failed");
        return 1;
    }

    return 0;
}

char* retrieve_data(char* str, int start_idx, int end_idx)
{
    if (!str || start_idx > end_idx) return NULL;

    char* copy = strdup(str);
    if (!copy) return NULL;

    char* token = strtok(copy, ",");
    int idx = 0;
    char* result = NULL;

    while (token)
    {
        if (idx == start_idx)
        {
            result = strdup(token);
        }
        else if (idx > start_idx && idx <= end_idx)
        {
            char* tmp = malloc(strlen(result) + strlen(token) + 2);  // +1 for ',' +1 for '\0'
            sprintf(tmp, "%s,%s", result, token);
            free(result);
            result = tmp;
        }
        idx++;
        token = strtok(NULL, ",");
        if (idx > end_idx) break;
    }

    free(copy);
    return result;  // caller must free
}

char** classify_data(char* data)
{
    if (!data) return NULL;

    // Split by first comma only: type,data
    char* comma = strchr(data, ',');
    if (!comma) return NULL;  // malformed

    *comma = '\0';  // terminate type
    char* meta_data = data;
    char* true_data = comma + 1;

    // allocate result array
    char** result = malloc(3 * sizeof(char*));
    if (!result) return NULL;

    result[0] = strdup(meta_data);
    result[1] = strdup(true_data);
    result[2] = NULL;

    if (!result[0] || !result[1])
    {
        free(result[0]);
        free(result[1]);
        free(result);
        return NULL;
    }

    return result;
}

void handle_rx(const char* line)
{
    ESP_LOGI(TAG, "RX: %s", line);
    char* work = strdup(line);
    if (!work) return;

    char* payload = retrieve_data(work, 2, 3);

    if (!payload)
    {
        free(work);
        return;
    }

    char** tokens = classify_data(payload);

    free(payload);

    int type = atoi(tokens[0]);
    lora_msg_t msg = {0};

    switch (type)
    {
        case 0:  // sleep
            msg.type = 0;
            msg.val = atoi(tokens[1]);
            ;
            break;
        case 1:  // light level
            msg.type = 1;
            msg.val = atoi(tokens[1]);
            break;

        case 2:  // buzzer
            msg.type = 2;
            msg.val = atoi(tokens[1]);
            break;
    }
    // send to logger/consumer (non-blocking)
    (void)xQueueSend(lora_msg_q, &msg, 0);
    free(tokens[0]);
    free(tokens[1]);
    free(tokens);
    free(work);
}
