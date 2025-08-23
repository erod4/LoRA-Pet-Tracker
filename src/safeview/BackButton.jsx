import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity } from 'react-native'

const BackButton = () => {
  const router = useRouter()

  const handleFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  return (
    <TouchableOpacity
      className='p-5 z-10'
      activeOpacity={1}
      onPress={() => {
        handleFeedback()
        router.back()
      }}
    >
      <FontAwesomeIcon icon={faArrowLeft} color='#fff' size={20} />
    </TouchableOpacity>
  )
}

export default BackButton
