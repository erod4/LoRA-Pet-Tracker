#include "ble.h"
#include "LoRa.h"
#include "battery.h"
#include "esp_log.h"
#include "host/ble_hs.h"
#include "nimble/ble.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"
#include "tasks_common.h"
#include <stdint.h>
#include <stdio.h>
#include <string.h>

uint8_t ble_addr_type;
uint16_t tracker_long_handle;
uint16_t tracker_lat_handle;
uint16_t current_con_handle = BLE_HS_CONN_HANDLE_NONE;
static char full_device_name[32];

/**
 * Callback functions for ble
 */

// notify function
void notify_ble(uint16_t conn_handle, uint16_t att_handle, void *data,
                size_t len) {
  if (current_con_handle == BLE_HS_CONN_HANDLE_NONE)
    return;
  struct os_mbuf *om;
  om = ble_hs_mbuf_from_flat(data, len);
  ble_gatts_notify_custom(conn_handle, att_handle, om);
}

// bridge
static int firmware_char_cb(uint16_t conn_handle, uint16_t attr_handle,
                            struct ble_gatt_access_ctxt *ctxt, void *arg) {
  return os_mbuf_append(ctxt->om, VERSION, strlen(VERSION));
}
static int battery_lvl_char_cb(uint16_t conn_handle, uint16_t attr_handle,
                               struct ble_gatt_access_ctxt *ctxt, void *arg) {
  int batt = adc_read_battery_voltage();
  return os_mbuf_append(ctxt->om, &batt, 1);
}

// tracker
static int tracker_firmware_cb(uint16_t conn_handle, uint16_t attr_handle,
                               struct ble_gatt_access_ctxt *ctxt, void *arg) {
  return os_mbuf_append(ctxt->om, VERSION, strlen(VERSION));
}

static int tracker_sleep_cb(uint16_t conn_handle, uint16_t attr_handle,
                            struct ble_gatt_access_ctxt *ctxt, void *arg) {
  lora_send_data("1", 0);
  return 0;
}

static int tracker_batt_lvl_cb(uint16_t conn_handle, uint16_t attr_handle,
                               struct ble_gatt_access_ctxt *ctxt, void *arg) {
  int bat = -1;

  bat = tracker_battery_lvl;
  ESP_LOGI("Tracker Batt", "%d", bat);
  return os_mbuf_append(ctxt->om, &bat, 1);
}

static int tracker_lat_cb(uint16_t conn_handle, uint16_t attr_handle,
                          struct ble_gatt_access_ctxt *ctxt, void *arg) {
  char *latitude = lat ? lat : "-1";

  return os_mbuf_append(ctxt->om, latitude, strlen(latitude));
}

static int tracker_long_cb(uint16_t conn_handle, uint16_t attr_handle,
                           struct ble_gatt_access_ctxt *ctxt, void *arg) {
  char *longitude = lon ? lon : "-1";

  return os_mbuf_append(ctxt->om, longitude, strlen(longitude));
}

static int tracker_light_info_cb(uint16_t conn_handle, uint16_t attr_handle,
                                 struct ble_gatt_access_ctxt *ctxt, void *arg) {

  return os_mbuf_append(ctxt->om, &tracker_light_lvl, 1);
}

static int tracker_light_lvl_cb(uint16_t conn_handle, uint16_t attr_handle,
                                struct ble_gatt_access_ctxt *ctxt, void *arg) {
  // store data from buffer (0-100 -> uint8_t)
  uint8_t data = *ctxt->om->om_data;
  ESP_LOGI("Tracker", "Light Level-%d", data);
  char cdata[4];
  itoa(data, cdata, 10);
  lora_send_data(cdata, 1);
  return 0;
}

static int tracker_buzzer_lvl_cb(uint16_t conn_handle, uint16_t attr_handle,
                                 struct ble_gatt_access_ctxt *ctxt, void *arg) {
  // store data from buffer (0-100 -> uint8_t)
  uint8_t data = *ctxt->om->om_data;
  ESP_LOGI("Tracker", "Buzzer Level-%d", data);
  char cdata[4];
  itoa(data, cdata, 10);
  lora_send_data(cdata, 2);
  return 0;
}

static const struct ble_gatt_svc_def gatt_svcs[] = {
    {.type = BLE_GATT_SVC_TYPE_PRIMARY,
     .uuid = BLE_UUID16_DECLARE(DEVICE_INFO_SERVICE),
     .characteristics =
         (struct ble_gatt_chr_def[]){
             {.uuid = BLE_UUID16_DECLARE(FIRMWARE_INFO_CHAR),
              .flags = BLE_GATT_CHR_F_READ,
              .access_cb = firmware_char_cb},
             {.uuid = BLE_UUID16_DECLARE(BATT_LVL_INFO_CHAR),
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
              .access_cb = battery_lvl_char_cb},
             {0}}},
    {.type = BLE_GATT_SVC_TYPE_PRIMARY,
     .uuid = TRACKER_INFO_SERVICE_UUID,
     .characteristics =
         (struct ble_gatt_chr_def[]){
             {.uuid = TRACKER_FIRMWARE_INFO_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_READ,
              .access_cb = tracker_firmware_cb},
             {.uuid = TRACKER_BATT_LVL_INFO_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
              .access_cb = tracker_batt_lvl_cb},
             {.uuid = TRACKER_LAT_INFO_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
              .access_cb = tracker_lat_cb},
             {.uuid = TRACKER_LONG_INFO_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
              .access_cb = tracker_long_cb},
             {.uuid = TRACKER_LIGHT_INFO_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY,
              .access_cb = tracker_light_info_cb},
             {.uuid = TRACKER_BUZZER_LVL_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_WRITE,
              .access_cb = tracker_buzzer_lvl_cb},
             {.uuid = TRACKER_LIGHT_LVL_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_WRITE,
              .access_cb = tracker_light_lvl_cb},
             {.uuid = TRACKER_SLEEP_CHAR_UUID,
              .flags = BLE_GATT_CHR_F_WRITE,
              .access_cb = tracker_sleep_cb},

             {0}}},

    {0}};
static int ble_gap_event(struct ble_gap_event *event, void *arg) {

  switch (event->type) {

  case BLE_GAP_EVENT_CONNECT:
    ESP_LOGI("GAP", "BLE_GAP_EVENT_CONNECT %s",
             event->connect.status == 0 ? "OK" : "FAILED");
    if (event->connect.status == 0) {
      current_con_handle = event->connect.conn_handle;
    }
    break;
  case BLE_GAP_EVENT_DISCONNECT:
    ESP_LOGI("GAP", "BLE_GAP_EVENT_DISCONNECT:");
    current_con_handle = BLE_HS_CONN_HANDLE_NONE;
    ble_app_advertise();
    break;
  case BLE_GAP_EVENT_ADV_COMPLETE:
    ESP_LOGI("GAP", "BLE_GAP_EVENT_ADV_COMPLETE");
    ble_app_advertise();
    break;
  case BLE_GAP_EVENT_SUBSCRIBE:
    ESP_LOGI("GAP", "BLE_GAP_EVENT_SUBSCRIBE");

    break;
  default:
    break;
  }
  return 0;
}

void ble_init(void) {

  nimble_port_init();
  snprintf(full_device_name, sizeof(full_device_name), "%s-%d-%s", DEVICE_NAME,
           adc_read_battery_voltage(), VERSION);
  ble_svc_gap_device_name_set(full_device_name);

  ble_svc_gap_init();

  ble_svc_gatt_init();

  ble_gatts_count_cfg(gatt_svcs);
  ble_gatts_add_svcs(gatt_svcs);

  ble_hs_cfg.sync_cb = ble_app_on_sync;
  nimble_port_freertos_init(host_task);
}

void ble_app_advertise(void) {
  // init advertise fields to 0
  struct ble_hs_adv_fields fields;
  memset(&fields, 0, sizeof(fields));

  // enable advertise discovery general and limited
  fields.flags = BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_DISC_LTD;

  // enable power level presence
  fields.tx_pwr_lvl_is_present = 1;
  fields.tx_pwr_lvl = BLE_HS_ADV_TX_PWR_LVL_AUTO;

  // set name of device
  fields.name = (uint8_t *)ble_svc_gap_device_name();
  fields.name_len = strlen(ble_svc_gap_device_name());
  fields.name_is_complete = 1;

  ESP_LOGI("DEV", "%s", ble_svc_gap_device_name());
  // set fields
  ble_gap_adv_set_fields(&fields);

  // advertise parameters struct
  struct ble_gap_adv_params adv_params;
  memset(&adv_params, 0, sizeof(adv_params));

  // connection mode unidirectional
  adv_params.conn_mode = BLE_GAP_CONN_MODE_UND;

  // discovery mode general
  adv_params.disc_mode = BLE_GAP_DISC_MODE_GEN;

  // start advertising
  ble_gap_adv_start(ble_addr_type, NULL, BLE_HS_FOREVER, &adv_params,
                    ble_gap_event, NULL);

  // ble_gap_adv_start(ble_addr_type,);
}

void ble_app_on_sync(void) {
  ble_hs_id_infer_auto(0, &ble_addr_type);
  int rc;

  rc = ble_gatts_find_chr(TRACKER_INFO_SERVICE_UUID, TRACKER_LAT_INFO_CHAR_UUID,
                          NULL, &tracker_lat_handle);
  assert(rc == 0);
  rc =
      ble_gatts_find_chr(TRACKER_INFO_SERVICE_UUID, TRACKER_LONG_INFO_CHAR_UUID,
                         NULL, &tracker_long_handle);
  assert(rc == 0);
  ble_app_advertise();
}

void host_task(void *param) { nimble_port_run(); }