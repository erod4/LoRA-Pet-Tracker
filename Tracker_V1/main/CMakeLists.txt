idf_component_register(
    SRCS "GPIO.c" "battery.c" "LoRa.c" "main.c" "status_handler.c"
    INCLUDE_DIRS "."
    REQUIRES nvs_flash log driver esp_adc
)
