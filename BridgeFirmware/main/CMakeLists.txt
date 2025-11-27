idf_component_register(
    SRCS "battery.c" "LoRa.c" "main.c" "ble.c"
    INCLUDE_DIRS "."
    REQUIRES nvs_flash bt log driver esp_adc
)
