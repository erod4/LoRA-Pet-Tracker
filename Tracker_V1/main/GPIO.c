#include "GPIO.h"
#include "driver/gpio.h"
#include "driver/ledc.h"
#include "esp_adc_cal.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

void config_leds(void) {
  ledc_timer_config_t ledc_timer = {.speed_mode = LEDC_MODE,
                                    .timer_num = LEDC_TIMER,
                                    .duty_resolution = LEDC_DUTY_RES,
                                    .freq_hz = LEDC_FREQUENCY,
                                    .clk_cfg = LEDC_AUTO_CLK};
  ESP_ERROR_CHECK(ledc_timer_config(&ledc_timer));

  ledc_channel_config_t ledc_channel = {
      .speed_mode = LEDC_MODE,
      .channel = LEDC_CHANNEL,
      .timer_sel = LEDC_TIMER,
      .intr_type = LEDC_INTR_DISABLE,
      .gpio_num = LEDC_GPIO,
      .duty = 0, // duty cycle (0 - 8191 for 13-bit resolution)
      .hpoint = 0};
  ESP_ERROR_CHECK(ledc_channel_config(&ledc_channel));
}

void set_brightness(int lvl) {
  // clamp between 0-100
  lvl = lvl < 0 ? 0 : lvl > 100 ? 100 : lvl;
  // calculate duty based on 0-100%
  uint32_t duty = (lvl * 8191) / 100;

  // apply new duty
  ledc_set_duty(LEDC_MODE, LEDC_CHANNEL, duty);
  ledc_update_duty(LEDC_MODE, LEDC_CHANNEL);
}

void config_buzzer(void) {
  ledc_timer_config_t ledc_timer = {.speed_mode = BUZZER_MODE,
                                    .timer_num = BUZZER_TIMER,
                                    .duty_resolution = BUZZER_DUTY_RES,
                                    .freq_hz = BUZZER_FREQUENCY,
                                    .clk_cfg = LEDC_AUTO_CLK};
  ESP_ERROR_CHECK(ledc_timer_config(&ledc_timer));

  ledc_channel_config_t ledc_channel = {.speed_mode = BUZZER_MODE,
                                        .channel = BUZZER_CHANNEL,
                                        .timer_sel = BUZZER_TIMER,
                                        .intr_type = LEDC_INTR_DISABLE,
                                        .gpio_num = BUZZER_GPIO,
                                        .duty = 0, // start off
                                        .hpoint = 0};
  ESP_ERROR_CHECK(ledc_channel_config(&ledc_channel));
}

void buzzer_on(void) {
  // 50% duty cycle for a clear tone
  uint32_t duty = (1 << BUZZER_DUTY_RES) / 2;
  ledc_set_duty(BUZZER_MODE, BUZZER_CHANNEL, duty);
  ledc_update_duty(BUZZER_MODE, BUZZER_CHANNEL);
}

void buzzer_off(void) {
  ledc_set_duty(BUZZER_MODE, BUZZER_CHANNEL, 0);
  ledc_update_duty(BUZZER_MODE, BUZZER_CHANNEL);
}