import React from 'react'
import { View } from 'react-native'

const Modal = ({ children }) => {
  return (
    <View
      className='bg-[#161517] pb-16 pt-8 z-10'
      style={{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 10,
      }}
    >
      {children}
    </View>
  )
}

export default Modal
