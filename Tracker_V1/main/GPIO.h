#ifndef GPIO_H
#define GPIO_H

#define LEDC_GPIO 2
#define LEDC_TIMER LEDC_TIMER_0
#define LEDC_MODE LEDC_LOW_SPEED_MODE
#define LEDC_CHANNEL LEDC_CHANNEL_0
#define LEDC_DUTY_RES LEDC_TIMER_13_BIT
#define LEDC_FREQUENCY 5000

#define BUZZER_GPIO 3
#define BUZZER_MODE LEDC_LOW_SPEED_MODE
#define BUZZER_CHANNEL LEDC_CHANNEL_1
#define BUZZER_TIMER LEDC_TIMER_1
#define BUZZER_DUTY_RES LEDC_TIMER_13_BIT
#define BUZZER_FREQUENCY 4000  // 4 kHz

void config_leds(void);

void set_brightness(int lvl);

void config_buzzer(void);

void buzzer_on(void);

void buzzer_off(void);

#endif