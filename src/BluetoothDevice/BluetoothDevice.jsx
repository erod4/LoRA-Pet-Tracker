import { faBluetoothB } from '@fortawesome/free-brands-svg-icons'
import { faBattery } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import * as Haptics from 'expo-haptics'
import { Text, TouchableOpacity, View } from 'react-native'

const BluetoothDevice = ({ name, version, battery, onPress, selected }) => {
  const feedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        onPress()
        feedback()
      }}
      className='flex-row w-11/12  bg-[rgb(22,21,23)]  p-3 rounded-3xl items-center gap-5'
      style={{
        borderWidth: 1.5,
        borderColor: selected ? '#2455dd' : '#3a373c',
      }}
    >
      <View className='h-12 w-12 bg-[#3a373c] justify-center items-center rounded-xl'>
        <FontAwesomeIcon color='#fff' icon={faBluetoothB} size={25} />
      </View>
      <View className='flex-col'>
        <Text className='color-white font-semibold text-xl'>
          Bridge: {' ' + name}
        </Text>
        <View className='flex-row gap-3 items-center'>
          <View className='justify-center items-center flex-row gap-1'>
            <FontAwesomeIcon icon={faBattery} color='#cbd5e1' />
            <Text className='color-slate-300 text-sm font-semibold'>
              {battery}%
            </Text>
          </View>
          <Text className='color-slate-400 text-xs'>{'V.' + version}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default BluetoothDevice
