import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useBleDevice } from '../../context/BluetoothContext'
import { capatilize } from '../../helpers/capitalize'
import { connectDevice } from '../../helpers/connectDevice'
import { scanDevices } from '../../helpers/scanDevices'
import BluetoothDevice from '../../src/BluetoothDevice/BluetoothDevice'
import Button from '../../src/Button/Button'
import Modal from '../../src/Modal/Modal'
import Safeview from '../../src/safeview/Safeview'

const Scanning = () => {
  const {bleManager,setBleDevice}=useBleDevice()

  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isScanning,setIsScanning]=useState(false)
  const [devices,setDevices]=useState([])
  useFocusEffect(useCallback(()=>{  
    setDevices([])
    setIsScanning(true)

    scanDevices(setDevices,bleManager)
    // Stop scanning after 5s
      const timerId = setTimeout(() => {
        setIsScanning(false)
        bleManager.stopDeviceScan()
      }, 5000)

      // Cleanup: stop scanning and clear the timeout if user leaves screen
      return () => {
        bleManager.stopDeviceScan()
        clearTimeout(timerId)
        setSelectedDevice(null)
        setDevices([])

      }
  },[]))
  const router = useRouter()


  return (
    <Safeview gradient={true} goBack={true}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className='flex-1 justify-center'>
        <View className='flex-1 justify-center items-center w-full gap-2'>
          {devices.map((dev, idx) => {
            console.log(dev);
            
            return (
              <BluetoothDevice

                name={capatilize(dev.localName.split('-')[0] )}
                version={dev.localName.split('-')[2]}
                battery={dev.localName.split('-')[1]}
                key={idx}
                selected={idx == selectedDevice}
                onPress={() => {

                    setSelectedDevice((prev)=>(prev===idx?null:idx))
                }}
              />
              
            )
          })}
        </View>
        <Modal>
          <View className='gap-14 items-center '>
            <View className='w-full gap-2 items-center'>
              <Text className='font-bold text-2xl w-full text-center color-slate-100'>
                Device Selection
              </Text>
              <Text className='font-normal text-lg w-10/12 text-center color-slate-300'>
                Select one of the available devices above to connect
              </Text>
            </View>

            <Button
              title={'Connect'}
              onPress={async () => {
                setSelectedDevice(null)
                const device= await connectDevice(devices[selectedDevice]);
                setBleDevice(device)
                router.push({
                  pathname: '/connected',

                })
              }}
              disabled={selectedDevice == null}
            />
          </View>
        </Modal>
      </View>
    </Safeview>
  )
}

export default Scanning
