#ifndef BLE_H_
#define BLE_H_

#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define DEVICE_NAME "TRACKER"
#define VERSION "1.0"

#define DEVICE_INFO_SERVICE 0x180A
#define FIRMWARE_INFO_CHAR 0x2A26
#define BATT_LVL_INFO_CHAR 0x2A19

#define TRACKER_INFO_SERVICE_UUID                                              \
  BLE_UUID128_DECLARE(0xe2, 0x55, 0xd0, 0x1d, 0x5b, 0xae, 0x54, 0x8f, 0xd1,    \
                      0x40, 0x37, 0x98, 0x75, 0xbc, 0x78, 0x84)

// Firmware: 8a088803-d3ae-4e53-9e60-0427d42f422c
#define TRACKER_FIRMWARE_INFO_CHAR_UUID                                        \
  BLE_UUID128_DECLARE(0x2c, 0x42, 0x2f, 0xd4, 0x27, 0x04, 0x60, 0x9e, 0x53,    \
                      0x4e, 0xae, 0xd3, 0x03, 0x88, 0x08, 0x8a)

// Battery: 9d8d07a6-84c2-4351-8417-77181f711e52
#define TRACKER_BATT_LVL_INFO_CHAR_UUID                                        \
  BLE_UUID128_DECLARE(0x52, 0x1e, 0x71, 0x1f, 0x18, 0x77, 0x17, 0x84, 0x51,    \
                      0x43, 0xc2, 0x84, 0xa6, 0x07, 0x8d, 0x9d)

// Latitude: 615bb390-b88a-4935-ac4a-6d225af0d7e5  (yours already matched this)
#define TRACKER_LAT_INFO_CHAR_UUID                                             \
  BLE_UUID128_DECLARE(0xe5, 0xd7, 0xf0, 0x5a, 0x22, 0x6d, 0x4a, 0xac, 0x35,    \
                      0x49, 0x8a, 0xb8, 0x90, 0xb3, 0x5b, 0x61)

// Longitude: 05554d8c-acd1-403c-ac0e-5dee9f0d6e78
#define TRACKER_LONG_INFO_CHAR_UUID                                            \
  BLE_UUID128_DECLARE(0x78, 0x6e, 0x0d, 0x9f, 0xee, 0x5d, 0x0e, 0xac, 0x3c,    \
                      0x40, 0xd1, 0xac, 0x8c, 0x4d, 0x55, 0x05)

// Light: ebb4aff2-4a90-458e-a8d0-d102c2b39120
#define TRACKER_LIGHT_INFO_CHAR_UUID                                           \
  BLE_UUID128_DECLARE(0x20, 0x91, 0xb3, 0xc2, 0x02, 0xd1, 0xd0, 0xa8, 0x8e,    \
                      0x45, 0x90, 0x4a, 0xf2, 0xaf, 0xb4, 0xeb)

// Light Level:  7f3a1c6d-23f9-4d90-b96a-04f42f893aa7
#define TRACKER_LIGHT_LVL_CHAR_UUID                                            \
  BLE_UUID128_DECLARE(0xa7, 0x3a, 0x89, 0x2f, 0xf4, 0x04, 0x6a, 0xb9, 0x90,    \
                      0x4d, 0xf9, 0x23, 0x6d, 0x1c, 0x3a, 0x7f)

// Buzzer Level:  d2f64a13-9f1c-470d-bc33-8bbf86d25e7f
#define TRACKER_BUZZER_LVL_CHAR_UUID                                           \
  BLE_UUID128_DECLARE(0x7f, 0x5e, 0xd2, 0x86, 0xbf, 0x8b, 0x33, 0xbc, 0x0d,    \
                      0x47, 0x1c, 0x9f, 0x13, 0x4a, 0xf6, 0xd2)
//Sleep: f3c2a9e4-7b1d-4557-92c9-6a4ff12b83d1
#define TRACKER_SLEEP_CHAR_UUID \
  BLE_UUID128_DECLARE(0xd1, 0x83, 0x2b, 0xf1, 0x4f, 0x6a, 0xc9, 0x92, \
                      0x57, 0x45, 0x1d, 0x7b, 0xe4, 0xa9, 0xc2, 0xf3)
  
extern uint16_t tracker_long_handle;
extern uint16_t tracker_lat_handle;
extern uint16_t current_con_handle;

void ble_app_advertise(void);

void ble_init(void);

void ble_app_on_sync(void);

void host_task(void *param);

void notify_ble(uint16_t conn_handle, uint16_t att_handle, void *data,
                size_t len);
#endif