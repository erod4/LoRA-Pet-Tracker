#include "LoRa.h"

#include "driver/gpio.h"
#include "driver/uart.h"

#include "ble.h"
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

int tracker_battery_lvl = -1;
int tracker_light_lvl = -1;
char *lat = NULL;
char *lon = NULL;

// init uart to receive and transmit via LoRa (x)

// make function to read from lora (x)

// make function to write to lora
static const char *TAG = "LORA";

static QueueHandle_t uart2_event_queue;

typedef struct {
  int type;     // 0=batt,1=light,2=coords
  int val;      // for batt/light
  char lat[24]; // for coords
  char lon[24]; // for coords
} lora_msg_t;

static QueueHandle_t lora_msg_q;

bool await_response(void) {
  uint8_t data[128];
  int len = 0;
  int total_wait = 0;

  while (total_wait < 1000) {
    len = uart_read_bytes(LORA_UART_NUM, data, sizeof(data) - 1,
                          pdMS_TO_TICKS(100));

    if (len > 0) {
      data[len] = '\0';
      ESP_LOGI(TAG, "Response: %s", (char *)data);

      // check for +OK
      if (strstr((char *)data, "+OK") != NULL) {
        ESP_LOGI(TAG, "GOT +OK");
        return true;
      }
      if (strstr((char *)data, "+ERR=1") != NULL) {
        ESP_LOGI(TAG, "GOT +ERR=1");
        return false;
      }
      if (strstr((char *)data, "+ERR=2") != NULL) {
        ESP_LOGI(TAG, "GOT +ERR=1");
        return false;
      }
    }
    total_wait += 100;
  }
  ESP_LOGE(TAG, "Timeout occured");
  return false;
}

static void lora_consumer_task(void *arg) {
  lora_msg_t m;
  for (;;) {
    if (xQueueReceive(lora_msg_q, &m, portMAX_DELAY)) {
      switch (m.type) {
      case 0:
        ESP_LOGI("LORA", "Battery: %d", m.val);
        tracker_battery_lvl = m.val;

        break;
      case 1:
        ESP_LOGI("LORA", "Light: %d", m.val);
        tracker_light_lvl = m.val;

        break;
      case 2:
        ESP_LOGI("LORA", "Lat: %s, Lon: %s", m.lat, m.lon);
        // update
        lat = strdup(m.lat);
        break;
      }
    }
  }
}

void init_lora(void) {
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
  ESP_ERROR_CHECK(uart_driver_install(LORA_UART_NUM, RX_BUFF_SIZE * 2, 0, 20,
                                      &uart2_event_queue, intr_alloc_flags));
  ESP_ERROR_CHECK(uart_param_config(LORA_UART_NUM, &lora_uart_config));
  ESP_ERROR_CHECK(
      uart_set_pin(LORA_UART_NUM, LORA_TX_PIN, LORA_RX_PIN, 0, 0)); // Change

  // configure LoRa Module
  ESP_LOGI(TAG, "1");
  const char *test = "AT\r\n";
  uart_write_bytes(LORA_UART_NUM, test, strlen(test));
  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }

  // set mode
  ESP_LOGI(TAG, "2");
  const char *mode = "AT+MODE=0\r\n";
  uart_write_bytes(LORA_UART_NUM, mode, strlen(mode));
  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }

  // set band
  ESP_LOGI(TAG, "3");
  const char *band = "AT+BAND=915000000\r\n";
  uart_write_bytes(LORA_UART_NUM, band, strlen(band));
  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }

  // set params
  ESP_LOGI(TAG, "4");
  const char *param = "AT+PARAMETER=9,7,1,12\r\n";
  uart_write_bytes(LORA_UART_NUM, param, strlen(param));
  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }

  // set address      //**CHANGE ON OTHER DEVICE**/
  ESP_LOGI(TAG, "5");
  const char *addr = "AT+ADDRESS=1\r\n";
  uart_write_bytes(LORA_UART_NUM, addr, strlen(addr));
  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }
  // set network id
  ESP_LOGI(TAG, "6");
  const char *network = "AT+NETWORKID=6\r\n";
  uart_write_bytes(LORA_UART_NUM, network, strlen(network));

  if (!await_response()) {
    ESP_LOGE(TAG, "INVALID");
  }
}

void lora_uart_event_task(void *param) {
  uart_event_t event;
  char rx_tmp[RX_TMP_BUF];

  static char line[LINE_BUF_LEN];
  size_t line_len = 0;

  while (1) {
    if (!xQueueReceive(uart2_event_queue, &event, portMAX_DELAY))
      continue;

    switch (event.type) {
    case UART_DATA:
      int read;
      const TickType_t READ_TIMEOUT = pdMS_TO_TICKS(5);

      do {
        read = uart_read_bytes(LORA_UART_NUM, rx_tmp, RX_TMP_BUF, READ_TIMEOUT);
        if (read <= 0)
          break;

        int start = 0;
        for (int i = 0; i < read; ++i) {
          if (rx_tmp[i] == '\n') {
            // segment [start..i] includes '\n'
            int seg_len = i - start + 1;
            if (line_len + seg_len >= sizeof(line)) {
              ESP_LOGW(TAG, "RX line overflow, dropping");
              line_len = 0; // drop partial
            } else {
              memcpy(&line[line_len], &rx_tmp[start], seg_len);
              line_len += seg_len;
              line[line_len] = '\0'; // includes CRLF if present
              handle_rx(line);       // <-- pass with CRLF
              line_len = 0;          // reset for next line
            }
            start = i + 1;
          }
        }

        // copy any tail (partial line without '\n')
        if (start < read) {
          int rem = read - start;
          if (line_len + rem >= sizeof(line)) {
            ESP_LOGW(TAG, "RX partial overflow, dropping");
            line_len = 0;
          } else {
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

void lora_task_config(void) {
  xTaskCreate(lora_uart_event_task, "lora_task", LORA_TASK_STACK_SIZE, NULL,
              LORA_TASK_PRIORITY, NULL);
  lora_msg_q = xQueueCreate(8, sizeof(lora_msg_t));
  xTaskCreate(lora_consumer_task, "lora_consumer", 2048, NULL,
              tskIDLE_PRIORITY + 1, NULL);
}
// I (79816) LORA: +RCV=0,3,0,0,-23,10

// I (80146) LORA: +RCV=0,19,2,37.7749&-122.4194,-23,11
int lora_send_data(const char *payload, int type_int) {
  // check size of payload is below 240bytes
  size_t len = strlen(payload);
  if (len > MAX_PAYLOAD_LEN) {
    ESP_LOGE(TAG, "Invalid payload length: %d", (int)len);
    return 1;
  }

  char command[300];
  snprintf(command, sizeof(command), "AT+SEND=%d,%d,%d,%s\r\n", LORA_DEST_ADDR,
           len + 2, type_int, payload);
  ESP_LOGI(TAG, "%s", command);
  int written = uart_write_bytes(LORA_UART_NUM, command, strlen(command));

  if (written < 0) {
    ESP_LOGE(TAG, "UART write failed");
    return 1;
  }
  return 0;
}

char *retrieve_data(char *str, int start_idx, int end_idx) {
  if (!str || start_idx > end_idx)
    return NULL;

  char *copy = strdup(str);
  if (!copy)
    return NULL;

  char *token = strtok(copy, ",");
  int idx = 0;
  char *result = NULL;

  while (token) {
    if (idx == start_idx) {
      result = strdup(token);
    } else if (idx > start_idx && idx <= end_idx) {
      char *tmp =
          malloc(strlen(result) + strlen(token) + 2); // +1 for ',' +1 for '\0'
      sprintf(tmp, "%s,%s", result, token);
      free(result);
      result = tmp;
    }
    idx++;
    token = strtok(NULL, ",");
    if (idx > end_idx)
      break;
  }

  free(copy);
  return result; // caller must free
}

char **classify_data(char *data) {
  if (!data)
    return NULL;

  // Split by first comma only: type,data
  char *comma = strchr(data, ',');
  if (!comma)
    return NULL; // malformed

  *comma = '\0'; // terminate type
  char *meta_data = data;
  char *true_data = comma + 1;

  // allocate result array
  char **result = malloc(3 * sizeof(char *));
  if (!result)
    return NULL;

  result[0] = strdup(meta_data);
  result[1] = strdup(true_data);
  result[2] = NULL;

  if (!result[0] || !result[1]) {
    free(result[0]);
    free(result[1]);
    free(result);
    return NULL;
  }

  return result;
}

void handle_rx(const char *line) {

  char *work = strdup(line);
  if (!work)
    return;

  char *payload = retrieve_data(work, 2, 3);

  if (!payload) {
    free(work);
    return;
  }

  char **tokens = classify_data(payload);

  free(payload);

  int type = atoi(tokens[0]);
  lora_msg_t msg = {0};

  switch (type) {
  case 0:
    msg.type = 0;
    msg.val = atoi(tokens[1]);
    break;
  case 1:
    msg.type = 1;
    msg.val = atoi(tokens[1]);

    break;
  case 2: {
    // parse lat&lon into local buffers
    const char *amp = strchr(tokens[1], '&');
    if (amp) {
      size_t latlen = (size_t)(amp - tokens[1]);
      size_t lonlen = strlen(amp + 1);

      latlen = latlen < sizeof(msg.lat) - 1 ? latlen : sizeof(msg.lat) - 1;
      lonlen = lonlen < sizeof(msg.lon) - 1 ? lonlen : sizeof(msg.lon) - 1;

      memcpy(msg.lat, tokens[1], latlen);
      msg.lat[latlen] = 0;
      memcpy(msg.lon, amp + 1, lonlen);
      msg.lon[lonlen] = 0;
      msg.type = 2;

      // Update globals
      free(lat);
      free(lon);

      // notify_ble(current_con_handle, tracker_lat_handle, lat, latlen);
      // notify_ble(current_con_handle, tracker_long_handle, lon, lonlen);
    }
    break;
  }

  }
  // send to logger/consumer (non-blocking)
  (void)xQueueSend(lora_msg_q, &msg, 0);
  free(tokens[0]);
  free(tokens[1]);
  free(tokens);
  free(work);
}
