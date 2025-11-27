#ifndef LORA_H
#define LORA_H

#define LORA_BAUD_RATE 115200 // Change
#define RX_BUFF_SIZE 256
#define TX_BUFF_SIZE 256
#define LORA_UART_NUM UART_NUM_1
#define LORA_RX_PIN 19
#define LORA_TX_PIN 18
#define MAX_PAYLOAD_LEN 240
#define LORA_DEST_ADDR 0

#define LORA_EVENT_QUEUE_LEN 20
#define RX_TMP_BUF 256
#define LINE_BUF_LEN 256

#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include <stdbool.h>

extern int tracker_light_lvl;
extern int tracker_battery_lvl;

extern char *lat;
extern char *lon;

void init_lora(void);

int lora_send_data(const char *payload, int type_int);

void lora_task_config(void);

char *retrieve_data(char *str, int start_idx, int end_idx);

char **classify_data(char *data);

void handle_rx(const char *line);

bool await_response(void);
#endif