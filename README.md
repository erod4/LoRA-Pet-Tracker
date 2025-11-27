# Pet Tracker System

A wireless pet tracking system consisting of an iOS React Native app, a bridge device, a tracker, and custom PCB design. This project enables real-time GPS tracking, device control, and sensor monitoring **without requiring internet or cellular connectivity**.

---

## iOS React Native App

The source code for this subproject is in the `pet-tracker` folder.  

**Features:**
- Connects to the bridge device via **BLE** to receive and relay messages to the tracker.
- Displays a **map with GPS coordinates** of your pet.
- Provides a menu to:
  - Send a **recall command** to the tracker.
  - Adjust **LED brightness** on the tracker.
- Displays **battery levels** and **firmware versions** of both the tracker and the bridge.

---

## Bridge Firmware

The bridge firmware contains:

- **BLE interface** for the iOS companion app:
  - Service for the bridge.
  - Service for the tracker with various characteristics for reading/writing data.
- **LoRa interface** to receive asynchronous information from the tracker, such as:
  - GPS coordinates
  - Battery levels
  - Device state

---

## Tracker

The tracker includes:

- **GPS module**
- **Buzzer**
- **LEDs**
- **LoRa interface**

**Functionality:**

- Sends coordinates, battery status, and other sensor data every **3 seconds** via LoRa to the iOS app (no cellular or internet required).
- LEDs are controlled via **PWM** with brightness adjustable from 0–100.
- Buzzer emits a frequency for **3 seconds** before turning off.
- Receives asynchronous commands from the iOS app to toggle peripherals on/off.

---

## PCB Design

The PCB is designed using **EasyEDA** and includes:

- **BMS** (Battery Management System)
- **LoRa interface** for the RYLR998 module
- **GPS module**: SAM-M10Q-00B
- **Battery charging system**
- **Power switch** and **boost converter** with 3.3V regulator
- **USB-C connection** that, when connected, bypasses the battery and uses USB power
- **Battery voltage sensing**
- **ESP32-C6** microcontroller
- **ESD protection**

> The same PCB design can be used for both the bridge and tracker devices.

---

## Future Direction

Planned improvements include:

- Designing a **3D case** for the system.
- Reducing PCB size by **25%**.
- Enabling system power **on/off via the iOS app**.
- Adding support for **sleep mode** via the UART peripheral for the LoRa interface.

---

