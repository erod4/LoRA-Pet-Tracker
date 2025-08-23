import * as Location from 'expo-location'
import { Stack } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useBleDevice } from '../../context/BluetoothContext'
import { BRIDGE_UUID, DIS_BATT_UUID, DIS_FIRMWARE_UUID, readByUUID, subscribeByUUID, TRACKER_BATT_UUID, TRACKER_FW_UUID, TRACKER_LAT_UUID, TRACKER_LIGHT_UUID, TRACKER_LONG_UUID, TRACKER_UUID } from '../../helpers/connectDevice'
import ActionModal from '../../src/ActionModal/ActionModal'
import ConnectedOptions from '../../src/ConnectedOptions/ConnectedOptions'

const Connected = () => {
  const {bleDevice,deviceDisconnect}=useBleDevice()

  const [location, setLocation] = useState(null)
  const [petLocation, setPetLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)


  const [bridgeInfo,setBridgeInfo]=useState({firmware:null,batt:null})
  const [trackerInfo,setTrackerInfo]=useState({firmware:null,batt:null, lat:null,long:null,light:null})

  const mapRef = useRef(null)
  useEffect(()=>{
    if(!bleDevice) return
    let subs=[]
   const getServices=async()=>{
    try {
      if(!bleDevice) return
      const isConnected=await bleDevice.isConnected()

      
      await bleDevice.discoverAllServicesAndCharacteristics()
      //Bridge//
      //read firmware once
      const bridgeFw=await readByUUID(bleDevice,BRIDGE_UUID,DIS_FIRMWARE_UUID,'string')   
      setBridgeInfo(prev => ({ ...prev, firmware: bridgeFw }))
      const bridgeBatt=await readByUUID(bleDevice,BRIDGE_UUID,DIS_BATT_UUID,'uint8')   
      setBridgeInfo(prev => ({ ...prev, batt: bridgeBatt }))

      const subBridgeBatt=await subscribeByUUID(bleDevice,BRIDGE_UUID,DIS_BATT_UUID,'uint8',(val) => setBridgeInfo(prev => ({ ...prev, batt: val })))
      if(subBridgeBatt)subs.push(subBridgeBatt)
      
      //Tracker//
      //read tracker firmware once
      const trackerFW=await readByUUID(bleDevice,TRACKER_UUID,TRACKER_FW_UUID,'string')
      const trackerBatt=await readByUUID(bleDevice,TRACKER_UUID,TRACKER_BATT_UUID,'uint8')
      const trackerLat=await readByUUID(bleDevice,TRACKER_UUID,TRACKER_LAT_UUID,'string')
      const trackerLong=await readByUUID(bleDevice,TRACKER_UUID,TRACKER_LONG_UUID,'string')
      const trackerLight=await readByUUID(bleDevice,TRACKER_UUID,TRACKER_LIGHT_UUID,'string')

      setTrackerInfo(prev => ({ ...prev, firmware: trackerFW ,batt:trackerBatt,lat:trackerLat,long:trackerLong,light:trackerLight}))

      const subTrackerBatt=await subscribeByUUID(bleDevice,TRACKER_UUID,TRACKER_BATT_UUID,'uint8',(val) => setTrackerInfo(prev => ({ ...prev, batt: val })))

      if(subTrackerBatt)subs.push(subTrackerBatt)

      const subLat=await subscribeByUUID(bleDevice,TRACKER_UUID, TRACKER_LAT_UUID,"string",(val) => setTrackerInfo(prev => ({ ...prev, lat: Number(val) })))

      if(subLat) subs.push(subLat)
      
      const subLong=await subscribeByUUID(bleDevice,TRACKER_UUID,TRACKER_LONG_UUID,"string",(val) => setTrackerInfo(prev => ({ ...prev, long: Number(val) })))
      
      if(subLong)subs.push(subLong)

      const subLight=await subscribeByUUID(bleDevice,TRACKER_UUID,TRACKER_LIGHT_UUID,"uint8",(val) => setTrackerInfo(prev => ({ ...prev, light: val })))

      if(subLight)subs.push(subLight)
   

    } catch (error) {
      console.log(error);
      
    }
   }
   getServices()

   return ()=>{
    subs.forEach((s)=>s?.remove?.())
    subs=[]
   }
  },[bleDevice])
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

useEffect(()=>{
 setPetLocation({
            longitude:trackerInfo.long,
            latitude: trackerInfo.lat
          })
},[trackerInfo])
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
    if (!mapRef.current || !location||!petLocation) return

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
  return (
    <View className='flex-1'>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ConnectedOptions onRecenterPress={recenterMap} />
      {location && (
        <MapView
        initialRegion={{ latitude: location.latitude ,
              longitude: location.longitude ,latitudeDelta:0.01,longitudeDelta:0.01}}
          ref={mapRef}
          showsUserLocation={true}
          style={{ height: '100%', width: '100%' }}

        >
          <Marker
            pinColor='#2455dd'
            coordinate={{
              latitude: petLocation.latitude + 0.001,
              longitude: petLocation.longitude + 0.001,
            }}
          />
        </MapView>
      )}
      <ActionModal onLocatePress={centerToPet} bridge={bridgeInfo} onDisconnect={deviceDisconnect} tracker={trackerInfo}/>
    </View>
  )
}

export default Connected
