import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'

import { faBell } from '@fortawesome/free-regular-svg-icons'
import { faBattery, faPaw } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import LightSliderButton from '../LightSliderButton/LightSliderButton'
const ActionModal = ({ onLocatePress, tracker,bridge, onDisconnect }) => {
  const [light, setLight] = useState(false)
  const [recall, setRecall] = useState(false)
  const [brightness, setBrightness] = useState(50)
  const router = useRouter()
  const bottomSheetRef = useRef(null)
  const [modalidx, setModalIdx] = useState(null)
  const handleFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  const handleFeedBackWarning = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }
  const handleDisconnect = () => {
    return Alert.alert(
      'Disconnect from device',
      'Are you sure you want to disconnect from this device?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          onPress: async () =>{ await onDisconnect();router.navigate('/home')},
          style: 'destructive',
        },
      ]
    )
  }
  const snapPoints = ['15%', '30%']
  const handleSheetChange = useCallback((idx) => {
    if (setModalIdx) {
      setModalIdx(idx)
    }
  }, [])

  return (
    <BottomSheet
  enableContentPanningGesture={false}
  // ✓ still allow dragging the handle
  enableHandlePanningGesture={true}
  // ✓ allow a pan-down (on that handle) to actually close
  // enablePanDownToClose={true}
  // ✕ disable any overshoot pull
  enableOverDrag={false}
      ref={bottomSheetRef}
      onChange={handleSheetChange}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: '#202226' }}
      handleIndicatorStyle={{ backgroundColor: '#555' }}
    >
      <BottomSheetView
        style={{
          padding: 18,
          alignItems: 'center',
          backgroundColor: '#202226',
          gap: 15,
          flexDirection: 'column',
        }}
      >
        {modalidx == 1 ||
          (modalidx == 2 && (
            <>
              <View className='rounded-2xl p-2 items-center flex-row border border-[#555] w-full gap-2 bg-[#161517]'>
<View className='w-1/2 border-r border-r-[#555] flex-row px-1 gap-2'>
                  <View className='p-2 rounded-full bg-[#ddd]'>
                  <FontAwesomeIcon icon={faPaw} size={20} />
                </View>
                <View className='flex-row items-center justify-between flex-1'>
                  <View className='flex-col justify-between'>
                    <Text className='text-white font-bold text-lg'>
                      Tracker
                    </Text>
                    <Text className='text-slate-300 text-xs font-medium'>
                      Firmware: V.{tracker?.firmware}
                    </Text>
                  </View>
                  <View className='flex-row'>
                    <Text className='text-slate-300 font-bold'>
                      {tracker?.batt}%
                    </Text>
                    <FontAwesomeIcon
                      icon={faBattery}
                      color='#cbd5e1'
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                  </View>
                </View>
</View>
<View className='w-1/2  flex-row gap-2 px-1'>

                <View className='flex-row items-center justify-between flex-1'>
                  <View className='flex-col justify-between'>
                    <Text className='text-white font-bold text-lg'>
                      Bridge
                    </Text>
                    <Text className='text-slate-300 text-xs font-medium'>
                      Firmware: V.{bridge?.firmware}
                    </Text>
                  </View>
                  <View className='flex-row'>
                    <Text className='text-slate-300 font-bold'>
                      {bridge?.batt}%
                    </Text>
                    <FontAwesomeIcon
                      icon={faBattery}
                      color='#cbd5e1'
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                  </View>
                </View>
</View>
              </View>
              <View className='w-full gap-1 flex-row justify-between'>
                <TouchableOpacity
                  onPress={() => {
                    setRecall(!recall)
                  }}
                  style={{
                  backgroundColor:recall?"rgba(255, 0, 0, 0.25)":"#161517",

                  }}
                  className='flex-grow  bg-[#161517] rounded-2xl p-3 w-1/2 border border-[#555] gap-4'
                >
                  <View className='rounded-full p-2 bg-[#ddd] w-8 h-8 items-center justify-center z-10'>
                    <FontAwesomeIcon icon={faBell} />
                  </View>
                  <Text className='font-bold color-white z-10'>Recall On</Text>
                </TouchableOpacity>
                <LightSliderButton   initialBrightness={brightness}
  onBrightnessChange={setBrightness}
  onPress={() => setLight(prev => !prev)}/>
                {/* <TouchableOpacity
                  activeOpacity={1}
                  onLongPress={() => setAdjusting(true)}
                  onPressOut={() => {
                    setAdjusting(false);
                    setLight(brightness > 0);
                    // send brightness command to your devicse here
                  }}
                  onPress={() => {
                    setLight(!light)
                  }}
                  style={{
                    shadowColor: 'cyan',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: light && 0.6,
                    shadowRadius: light && 8,
                    elevation: 20,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className='flex-grow bg-[#161517] rounded-2xl p-3 w-1/2 gap-4 border border-[#555] '
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${brightness}%`,
                      backgroundColor: 'cyan',
                      opacity: 0.15,
                    }}
                  />
                  <View className='rounded-full p-2 bg-[#ddd] w-8 h-8 items-center justify-center'>
                    <FontAwesomeIcon icon={faLightbulb} />
                  </View>
                  <Text className='font-bold color-white'>Light On</Text>
                </TouchableOpacity> */}
              </View>
            </>
          ))}
        <View className='w-full flex-row pb-10 gap-2'>
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: '#2455dd' }}
            className='rounded-full h-14 justify-center items-center  w-1/2 '
            onPress={() => {
              onLocatePress()
              handleFeedback()
            }}
          >
            <Text className='font-semibold text-xl color-white'>Locate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              handleFeedBackWarning()
              handleDisconnect()
            }}
            style={{ backgroundColor: '#D75043' }}
            className='rounded-full h-14 justify-center items-center  w-1/2 '
          >
            <Text className='font-semibold text-xl color-white'>
              Disconnect
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
}

export default ActionModal
