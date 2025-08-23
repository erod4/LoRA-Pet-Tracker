import { faCog } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

const Options = () => {
  return (
    <View className='absolute top-20 z-10 right-3 bg-[#202229] rounded-lg items-center justify-center border border-stone-600'>
      <TouchableOpacity className='px-4 py-4  items-center justify-center'>
        <FontAwesomeIcon icon={faCog} color='#2455dd' />
      </TouchableOpacity>
    </View>
  )
}

export default Options
