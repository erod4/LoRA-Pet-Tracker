import { decode as atob, encode as btoa } from 'base-64'

// Standard Device Information Service (your firmware also put Battery char here)
export const BRIDGE_UUID = '0000180a-0000-1000-8000-00805f9b34fb'
export const DIS_FIRMWARE_UUID = '00002a26-0000-1000-8000-00805f9b34fb'
export const DIS_BATT_UUID = '00002a19-0000-1000-8000-00805f9b34fb'

// Tracker custom service + chars (the real ones you asked for)
export const TRACKER_UUID = '8478bc75-9837-40d1-8f54-ae5b1dd055e2'
export const TRACKER_FW_UUID = '8a088803-d3ae-4e53-9e60-0427d42f422c'
export const TRACKER_BATT_UUID = '9d8d07a6-84c2-4351-8417-77181f711e52'
export const TRACKER_LAT_UUID = '615bb390-b88a-4935-ac4a-6d225af0d7e5'
export const TRACKER_LONG_UUID = '05554d8c-acd1-403c-ac0e-5dee9f0d6e78'
export const TRACKER_LIGHT_UUID = 'ebb4aff2-4a90-458e-a8d0-d102c2b39120'
export const TRACKER_SLEEP_UUID = 'f3c2a9e4-7b1d-4557-92c9-6a4ff12b83d1'

export const BRIDGE_LIGHT_UUID = '7f3a1c6d-23f9-4d90-b96a-04f42f893aa7'
export const BRIDGE_BUZZER_UUID = 'd2f64a13-9f1c-470d-bc33-8bbf86d25e7f'

export const connectDevice = async (dev) => {
  let device
  try {
    if (dev) {
      device = await dev.connect()
      await device.discoverAllServicesAndCharacteristics()
      return device
    }
    return null
  } catch (error) {
    console.log('Dev connect error: ', error)
    return null
  }
}

export const readByUUID = async (
  device,
  serviceUUID,
  charUUID,
  parse = 'string'
) => {
  try {
    if (!device) return null
    const char = await device.readCharacteristicForService(
      serviceUUID,
      charUUID
    )
    if (!char?.value) return null
    const decoded = atob(char.value)
    return parseValue(decoded, parse)
  } catch (error) {
    console.log('Read By UUID: ', error)
    return null
  }
}
export const debugServices = async (device) => {
  try {
    if (!device) {
      console.log('No device provided to debugServices')
      return
    }
    const dev = await device.services()
    console.log('=== Available Services ===')

    console.log(dev)
  } catch (error) {
    console.log('Debug Services Error:', error)
  }
}
export const writeByUUID = async (
  manager,
  device,
  serviceUUID,
  charUUID,
  data
) => {
  try {
    if (!device) return

    const byteValue = String.fromCharCode(data & 0xff)
    const encoded = btoa(byteValue)

    const char = await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      charUUID,
      encoded
    )
    // const char = await manager.writeCharacteristicWithResponseForDevice(
    //   device.id,
    //   serviceUUID,
    //   charUUID,
    //   encoded
    // )
    console.log('Write to BLE Device: ', char)
  } catch (error) {
    console.log('Write to BLE Device Error:', error)
  }
}
export const subscribeByUUID = async (
  device,
  serviceUUID,
  charUUID,
  parse = 'string',
  onValue
) => {
  try {
    if (!device) return null

    const sub = await device.monitorCharacteristicForService(
      serviceUUID,
      charUUID,
      (error, char) => {
        if (error) {
          console.log('Error: Monitor Characteristic For Service-', serviceUUID)
          return
        }
        if (!char.value) return

        const decoded = atob(char.value)
        const parsed = parseValue(decoded, parse)

        onValue?.(parsed)
      }
    )
    return sub
  } catch (e) {
    console.log('Subscribe By UUID Error: ', e)
  }
}

const parseValue = (decoded, parse) => {
  switch (parse) {
    case 'uint8':
      return decoded.charCodeAt(0)
    case 'float':
      return parseFloat(decoded)
    default:
      return decoded
  }
}
