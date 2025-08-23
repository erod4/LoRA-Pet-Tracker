import { faPaw } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const Locate = () => {
  return (
    <TouchableOpacity className='flex w-full border rounded-lg p-2 flex-row items-center gap-5 bg-[#2455dd]'>
      <View className='justify-center items-center h-10 w-10 rounded-full bg-slate-300'>
        <FontAwesomeIcon icon={faPaw} />
      </View>
      <Text>Locate</Text>
    </TouchableOpacity>
  )
}

export default Locate
