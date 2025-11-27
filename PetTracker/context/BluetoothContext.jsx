import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { BleManager } from 'react-native-ble-plx'
import { connectDevice } from '../helpers/connectDevice'

const BleDeviceContext = createContext()

export const useBleDevice = () => useContext(BleDeviceContext)

export const BleDeviceProvider = ({ children }) => {
  const [bleDevice, setBleDevice] = useState(null)
  const [bleManager, setBLEManager] = useState(null)
  const [deviceDisconnected, setDeviceDisconnected] = useState(true)
  const isManualRef = useRef(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const deviceInfoRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  useEffect(() => {
    setBLEManager(new BleManager())

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (bleManager) {
        bleManager.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (!bleDevice || !bleManager) return

    deviceInfoRef.current = {
      id: bleDevice.id,
      name: bleDevice.name,
    }
    setDeviceDisconnected(false)
    const subscription = bleManager.onDeviceDisconnected(
      bleDevice.id,
      (error, dev) => {
        if (error) {
          console.log('Disconnection Error: ', error)
        }
        console.log('Device Disconnected: ', dev?.id)

        if (isManualRef.current) {
          setDeviceDisconnected(true)
          setTimeout(() => {
            isManualRef.current = false
          }, 1000)
          return
        }
        setTimeout(() => {
          if (!isManualRef.current) {
            setDeviceDisconnected(true)
          }
        }, 5000)
      }
    )

    return () => {
      subscription.remove()
      setDeviceDisconnected(true)
    }
  }, [bleDevice, bleManager])
  const deviceDisconnect = async () => {
    if (bleDevice) {
      isManualRef.current = true
      try {
        const isConnected = await bleDevice.isConnected() // Check if the device is connected
        if (isConnected) {
          await bleManager.cancelDeviceConnection(bleDevice.id)
          console.log('Success Disconnecting')
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
  const handleReconnect = async () => {
    if (!bleDevice || !bleManager || isReconnecting || isManualRef.current) {
      if (isManualRef.current) {
        console.log('Manual disconnect - skipping reconnection')
      }
      return
    }
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      reconnectAttemptsRef.current = 0
      return
    }
    console.log('Reconnecting')
    setIsReconnecting(true) //let ui know we're reconnecting
    reconnectAttemptsRef.current++ //increment attempts
    try {
      const isConnected = await bleDevice.isConnected()
      if (isConnected) {
        console.log('Dev already connected')
        setIsReconnecting(false)
        setDeviceDisconnected(false)
        reconnectAttemptsRef.current = 0
        return
      }
      const connectedDev = await connectDevice(bleDevice)

      if (connectDevice) {
        setBleDevice(connectedDev)
        setDeviceDisconnected(false)
        setIsReconnecting(false)
        reconnectAttemptsRef.current = 0
        console.log('Succesfully reconnected')
      } else {
        throw new Error('Failed to connect to device')
      }
    } catch (error) {
      console.error('Reconnection attemp failed', error.message)

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log('Waiting 5s before next attempt...')

        reconnectTimeoutRef.current = setTimeout(() => {
          handleReconnect()
        }, 5000)
      } else {
        console.error('Max reconnection attempts reached')
        reconnectAttemptsRef.current = 0
        setIsReconnecting(false)
      }
    }
  }
  return (
    <BleDeviceContext.Provider
      value={{
        bleDevice,
        setBleDevice,
        bleManager,
        deviceDisconnect,
        deviceDisconnected,
        handleReconnect,
        isReconnecting,
        isManualRef,
      }}
    >
      {children}
    </BleDeviceContext.Provider>
  )
}
