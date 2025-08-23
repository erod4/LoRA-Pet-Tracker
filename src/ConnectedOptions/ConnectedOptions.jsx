import { faCog, faLocationArrow } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

const ConnectedOptions = ({ onRecenterPress }) => {
  return (
    <View className='absolute top-40 z-10 right-3 bg-[#202229] rounded-lg items-center justify-center'>
      <TouchableOpacity
        className='px-4 py-4 item-center justify-center '
        onPress={onRecenterPress}
      >
        <FontAwesomeIcon icon={faLocationArrow} color='#2455dd' />
      </TouchableOpacity>
      <View className='border-b border-stone-600 w-full' />
      <TouchableOpacity className='px-4 py-4  items-center justify-center'>
        <FontAwesomeIcon icon={faCog} color='#2455dd' />
      </TouchableOpacity>
    </View>
  )
}

export default ConnectedOptions
