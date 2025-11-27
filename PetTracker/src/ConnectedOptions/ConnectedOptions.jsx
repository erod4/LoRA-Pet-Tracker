import {
  faBolt,
  faLocationArrow,
  faTowerBroadcast,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { Alert, Pressable, View } from 'react-native'

const ConnectedOptions = ({
  onRecenterPress,

  onSleep = () => {},
  onInfoPress = () => {},
}) => {
  const handlePress = () => {
    return Alert.alert('Energy Savings Mode', 'Enable Energy Savings Mode.', [
      {
        text: 'Confirm',
        onPress: () => {
          onSleep()
        },
        style: 'default',
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ])
  }

  return (
    <>
      <View
        style={{ borderWidth: 0.5, borderColor: '#555', opacity: 0.95 }}
        className='absolute top-40 z-10 right-3 bg-[#171c26] rounded-3xl items-center justify-center '
      >
        <View className='w-full' />
        <Pressable
          style={{ borderBottomWidth: 0.2, borderBottomColor: '#555' }}
          className='px-4 py-4  items-center justify-center'
          onPress={handlePress}
        >
          <FontAwesomeIcon icon={faBolt} color='#2455dd' />
        </Pressable>
        <Pressable
          className='px-4 py-4 item-center justify-center '
          onPress={onRecenterPress}
        >
          <FontAwesomeIcon icon={faLocationArrow} color='#2455dd' />
        </Pressable>
      </View>

      <Pressable
        style={{ borderWidth: 0.5, borderColor: '#555', opacity: 0.95 }}
        onPress={onInfoPress}
        className='absolute top-72 z-10 right-3 bg-[#171c26] rounded-full items-center justify-center '
      >
        <View style={{}} className='px-4 py-4  items-center justify-center'>
          <FontAwesomeIcon icon={faTowerBroadcast} color='#2455dd' />
        </View>
      </Pressable>
    </>
  )
}

export default ConnectedOptions
