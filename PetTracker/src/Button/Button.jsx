import { Spinner } from '@/components/ui/spinner'
import * as Haptics from 'expo-haptics'
import { Text, TouchableOpacity } from 'react-native'

const Button = ({
  title,
  onPress = () => {},
  isLoading,
  disabled = false,
  fill = true,
}) => {
  const handleFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={1}
      style={{
        backgroundColor: disabled ? '#6188f2' : '#2455dd',
        width: fill && '100%',
      }}
      onPress={() => {
        onPress()
        handleFeedback()
      }}
      className='rounded-full h-14 justify-center items-center flex-grow'
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <Text className='font-semibold text-xl color-white'>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

export default Button
