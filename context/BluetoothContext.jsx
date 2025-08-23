import React, { createContext, useContext, useEffect, useState } from 'react'
import { BleManager } from 'react-native-ble-plx'

const BleDeviceContext = createContext()

export const useBleDevice = () => useContext(BleDeviceContext)

export const BleDeviceProvider = ({ children }) => {
  const [bleDevice, setBleDevice] = useState(null)
  const [bleManager, setBLEManager] = useState(null)

  useEffect(() => {

      setBLEManager(new BleManager())

    return () => {
      if (bleManager) {
        bleManager.destroy()
      }
    }
  }, [])


   const deviceDisconnect = async () => {
      if (bleDevice) {
        try {
          const isConnected = await bleDevice.isConnected() // Check if the device is connected
          if (isConnected) {
            await bleManager.cancelDeviceConnection(bleDevice.id)
            console.log("Success Disconnecting");
            
          } else {
            console.log('Device already disconnected or not connected.')
          }
        } catch (error) {
          if (error.message.includes('Operation was cancelled')) {
            console.log('Device connection already cancelled.')
          } else {
            console.error('Cancel Device Connection Error:', error)
          }
        }
      }
    }
  return (
    <BleDeviceContext.Provider value={{ bleDevice, setBleDevice, bleManager ,deviceDisconnect}}>
      {children}
    </BleDeviceContext.Provider>
  )
}
