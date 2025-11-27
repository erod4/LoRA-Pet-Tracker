export const scanDevices = (set_devices, bleManager) => {
  const devices = []
  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.log(error)
      return
    }
    set_devices((prevDevices) => {
      if (device.name && device.name.includes('TRACKER')) {
        if (!prevDevices.find((d) => d.id === device.id)) {
          const updatedDevices = [...prevDevices, device]

          return updatedDevices
        }
      }
      return prevDevices
    })
  })

  return devices
}
