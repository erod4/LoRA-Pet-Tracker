import { Stack } from 'expo-router'

import { faBluetoothB } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import Button from '../../src/Button/Button'
import Modal from '../../src/Modal/Modal'
import Safeview from '../../src/safeview/Safeview'

const Home_screen = () => {
  const router = useRouter()

  return (
    <Safeview gradient={true}>
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View className='flex-1'>
          <View className='flex-1 justify-center items-center'>
            <View className='rounded-full bg-[#121313] w-52 h-52 justify-center items-center border-[#2f3233] border-2'>
              <FontAwesomeIcon icon={faBluetoothB} size={100} color='#f1f5f9' />
            </View>
          </View>
          <Modal>
            <View className='gap-14 items-center '>
              <View className='w-full gap-2 items-center'>
                <Text className='font-bold text-2xl w-full text-center color-slate-100'>
                  Device Scanner
                </Text>
                <Text className='font-normal text-lg w-10/12 text-center color-slate-300'>
                  Press "Scan" to start scanning for nearby Bluetooth devices.
                </Text>
              </View>

              <Button
                title={'Scan'}
                onPress={() => {
                  router.navigate('/scanning')
                }}
              />
            </View>
          </Modal>
        </View>
      </>
    </Safeview>
  )
}

export default Home_screen
