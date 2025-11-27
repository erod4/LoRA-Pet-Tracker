import { Spinner } from '@/components/ui/spinner'
import * as Location from 'expo-location'
import { Stack } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert, Modal, Text, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useBleDevice } from '../../context/BluetoothContext'
import {
  BRIDGE_UUID,
  DIS_BATT_UUID,
  DIS_FIRMWARE_UUID,
  readByUUID,
  TRACKER_BATT_UUID,
  TRACKER_FW_UUID,
  TRACKER_LAT_UUID,
  TRACKER_LIGHT_UUID,
  TRACKER_LONG_UUID,
  TRACKER_SLEEP_UUID,
  TRACKER_UUID,
  writeByUUID,
} from '../../helpers/connectDevice'
import ActionModal from '../../src/ActionModal/ActionModal'
import ConnectedOptions from '../../src/ConnectedOptions/ConnectedOptions'
import CustomModal from '../../src/Modal/Modal'

import { faBolt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { getTime } from '../../helpers/time'
import Button from '../../src/Button/Button'
import Safeview from '../../src/safeview/Safeview'

const Connected = () => {
  const {
    bleDevice,
    deviceDisconnect,
    deviceDisconnected,
    handleReconnect,
    isReconnecting,
    isManualRef,
  } = useBleDevice()
  const [isDeviceSleeping, setIsDeviceSleeping] = useState(false)
  const [location, setLocation] = useState(null)
  const [petLocation, setPetLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const [bridgeInfo, setBridgeInfo] = useState({ firmware: null, batt: null })
  const [timer, setTimer] = useState({
    startTime: null,
    endTime: null,
    lastLongVal: null,
    lastLatVal: null,
  })
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [trackerInfo, setTrackerInfo] = useState({
    firmware: null,
    batt: null,
    lat: null,
    long: null,
    light: null,
  })

  useEffect(() => {
    if (deviceDisconnected) {
      handleReconnect()
    }
  }, [deviceDisconnected])

  const mapRef = useRef(null)

  useEffect(() => {
    if (!bleDevice) return
    let subs = []
    const getServices = async () => {
      try {
        if (!bleDevice) return
        const isConnected = await bleDevice.isConnected()

        await bleDevice.discoverAllServicesAndCharacteristics()
        //Bridge//
        //read firmware once
        const bridgeFw = await readByUUID(
          bleDevice,
          BRIDGE_UUID,
          DIS_FIRMWARE_UUID,
          'string'
        )

        setBridgeInfo((prev) => ({ ...prev, firmware: bridgeFw }))
        const bridgeBatt = await readByUUID(
          bleDevice,
          BRIDGE_UUID,
          DIS_BATT_UUID,
          'uint8'
        )
        // console.log('Bridge Batt', bridgeBatt)

        setBridgeInfo((prev) => ({ ...prev, batt: bridgeBatt }))

        // const subBridgeBatt = await subscribeByUUID(
        //   bleDevice,
        //   BRIDGE_UUID,
        //   DIS_BATT_UUID,
        //   'uint8',
        //   (val) => setBridgeInfo((prev) => ({ ...prev, batt: val }))
        // )
        // if (subBridgeBatt) subs.push(subBridgeBatt)

        //Tracker//
        //read tracker firmware once
        const trackerFW = await readByUUID(
          bleDevice,
          TRACKER_UUID,
          TRACKER_FW_UUID,
          'string'
        )
        const trackerBatt = await readByUUID(
          bleDevice,
          TRACKER_UUID,
          TRACKER_BATT_UUID,
          'uint8'
        )
        const trackerLat = await readByUUID(
          bleDevice,
          TRACKER_UUID,
          TRACKER_LAT_UUID,
          'string'
        )
        const trackerLong = await readByUUID(
          bleDevice,
          TRACKER_UUID,
          TRACKER_LONG_UUID,
          'string'
        )
        const trackerLight = await readByUUID(
          bleDevice,
          TRACKER_UUID,
          TRACKER_LIGHT_UUID,
          'string'
        )

        setTrackerInfo((prev) => ({
          ...prev,
          firmware: trackerFW,
          batt: trackerBatt,
          lat: trackerLat,
          long: trackerLong,
          light: trackerLight,
        }))

        // console.log('Successfully read all characteristics')
      } catch (error) {
        console.log(error)
      }
    }
    getServices()
    const bridgeInfo = async () => {
      const bridgeFw = await readByUUID(
        bleDevice,
        BRIDGE_UUID,
        DIS_FIRMWARE_UUID,
        'string'
      )

      setBridgeInfo((prev) => ({ ...prev, firmware: bridgeFw }))
      const bridgeBatt = await readByUUID(
        bleDevice,
        BRIDGE_UUID,
        DIS_BATT_UUID,
        'uint8'
      )
      //console.log('Bridge Batt', bridgeBatt)

      setBridgeInfo((prev) => ({ ...prev, batt: bridgeBatt }))
    }

    const trackerInfo = async () => {
      //Tracker//

      const trackerBatt = await readByUUID(
        bleDevice,
        TRACKER_UUID,
        TRACKER_BATT_UUID,
        'uint8'
      )
      const trackerLat = await readByUUID(
        bleDevice,
        TRACKER_UUID,
        TRACKER_LAT_UUID,
        'string'
      )
      const trackerLong = await readByUUID(
        bleDevice,
        TRACKER_UUID,
        TRACKER_LONG_UUID,
        'string'
      )
      const trackerLight = await readByUUID(
        bleDevice,
        TRACKER_UUID,
        TRACKER_LIGHT_UUID,
        'string'
      )

      setTrackerInfo((prev) => ({
        ...prev,

        batt: trackerBatt,
        lat: trackerLat,
        long: trackerLong,
        light: trackerLight,
      }))
    }
    const intervalId = setInterval(() => {
      console.log('Interval firing')

      bridgeInfo()
    }, 1000 * 60 * 5) //5min
    const tIntervalId = setInterval(() => {
      trackerInfo()
    }, 5000)
    return () => {
      clearInterval(intervalId)
      clearInterval(tIntervalId)
      subs.forEach((s) => s?.remove?.())
      subs = []
    }
  }, [bleDevice])

  useEffect(() => {
    let subscription = null

    ;(async () => {
      // 1. Ask the user for permission
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        return
      }

      // 2. Start watching the position
      subscription = await Location.watchPositionAsync(
        {
          // adjust these to suit your needs:
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000, // minimum time (ms) between updates
          distanceInterval: 1, // minimum change (meters) between updates
        },
        (loc) => {
          // this callback fires on every location update
          setLocation(loc.coords)
        }
      )
    })()

    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (
      (Number(trackerInfo?.long) == -1 || Number(trackerInfo?.lat) == -1) &&
      isFirstTime
    ) {
      setIsFirstTime(false)
      setPetLocation({
        longitude: null,
        latitude: null,
      })
    } else if (
      Number(trackerInfo?.long) !== -1 ||
      (Number(trackerInfo?.lat) !== -1 && Number(trackerInfo?.long) !== null) ||
      Number(trackerInfo?.lat) !== null
    ) {
      setPetLocation({
        longitude: Number(trackerInfo?.long),
        latitude: Number(trackerInfo?.lat),
      })
    }
  }, [trackerInfo])
  const recenterMap = () => {
    if (!mapRef.current || !location) return

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500 // animation duration in ms
    )
  }

  const centerToPet = () => {
    if (
      !mapRef.current ||
      !location ||
      !petLocation.latitude ||
      !petLocation.longitude
    )
      return

    mapRef.current.animateToRegion(
      {
        latitude: petLocation.latitude,
        longitude: petLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500 // animation duration in ms
    )
  }
  const infoPress = () => {
    return Alert.alert(
      'Device Status',
      `Signal Strength: ${2} dBm\n
Tracker Battery: ${5} hours remaining\n
Bridge Battery: ${5} hours remaining`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ]
    )
  }
  return (
    <>
      {isDeviceSleeping ? (
        <Safeview gradient={true} styling={{ flex: 1 }}>
          <>
            <View className='flex-1'>
              <View className='flex-1 justify-center items-center'>
                <View className='rounded-full bg-[#121313] w-52 h-52 justify-center items-center border-[#2f3233] border-2'>
                  <FontAwesomeIcon icon={faBolt} size={100} color='#f1f5f9' />
                </View>
              </View>
              <CustomModal>
                <View className='gap-14 items-center '>
                  <View className='w-full gap-2 items-center'>
                    <Text className='font-bold text-2xl w-full text-center color-slate-100'>
                      Energy Savings Mode
                    </Text>
                    <Text className='font-normal text-lg w-10/12 text-center color-slate-300'>
                      Press "Wake Device" to wake the tracker from energy
                      savings // mode.
                    </Text>
                  </View>

                  <Button
                    title={'Wake Device'}
                    onPress={() => {
                      writeByUUID(
                        null,
                        bleDevice,
                        TRACKER_UUID,
                        TRACKER_SLEEP_UUID,
                        65
                      )
                      setIsDeviceSleeping(false)
                    }}
                  />
                </View>
              </CustomModal>
            </View>
          </>
        </Safeview>
      ) : (
        <View className='flex flex-1 items-center'>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          {isReconnecting && !isManualRef.current && (
            <Modal
              animationType='fade'
              transparent={true}
              visible={isReconnecting}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  className='flex rounded-3xl bg-[#202226] p-8'
                  style={{
                    gap: 20,
                    backgroundColor: '#202226',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Spinner />
                  <Text
                    style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}
                  >
                    Reconnecting
                  </Text>
                </View>
              </View>
            </Modal>
          )}
          <ConnectedOptions
            onRecenterPress={recenterMap}
            onSleep={() => {
              writeByUUID(null, bleDevice, TRACKER_UUID, TRACKER_SLEEP_UUID, 65)
              setIsDeviceSleeping(true)
            }}
            onInfoPress={infoPress}
          />
          {location && (
            <MapView
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              ref={mapRef}
              showsUserLocation={true}
              style={{ height: '100%', width: '100%' }}
            >
              {petLocation?.latitude !== null &&
                petLocation?.longitude !== null && (
                  <Marker
                    style={{}}
                    pinColor='#2455dd'
                    coordinate={{
                      latitude: petLocation.latitude,
                      longitude: petLocation.longitude,
                    }}
                  />
                )}
            </MapView>
          )}
          <ActionModal
            onLocatePress={centerToPet}
            bridge={bridgeInfo}
            onDisconnect={deviceDisconnect}
            tracker={trackerInfo}
            time={getTime(timer.startTime, timer.endTime)}
          />
        </View>
      )}
    </>
  )
}

export default Connected
