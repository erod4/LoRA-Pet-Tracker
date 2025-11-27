import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'

import { faBell } from '@fortawesome/free-regular-svg-icons'
import { faBattery, faPaw } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useBleDevice } from '../../context/BluetoothContext'
import {
  BRIDGE_BUZZER_UUID,
  BRIDGE_LIGHT_UUID,
  TRACKER_UUID,
  writeByUUID,
} from '../../helpers/connectDevice'
import LightSliderButton from '../LightSliderButton/LightSliderButton'

const ActionModal = ({
  onLocatePress,
  tracker,
  bridge,
  onDisconnect,
  time,
}) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const { bleDevice, bleManager, isManualRef } = useBleDevice()
  const [light, setLight] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [recall, setRecall] = useState(false)
  const [brightness, setBrightness] = useState(0)
  const router = useRouter()
  const bottomSheetRef = useRef(null)
  const [modalidx, setModalIdx] = useState(null)
  const [disableOverDrag, setDisableOverDrag] = useState(false)
  const handleFeedback = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  const handleFeedBackWarning = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }
  const fadeIn = () => {
    setShowContent(true)
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.sin),
      useNativeDriver: true,
    }).start()
  }
  useEffect(() => {})
  const fadeOut = () => {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 800,
      easing: Easing.in(Easing.sin),
      useNativeDriver: true,
    }).start(() => {
      setShowContent(false) // unmount after animation completes
    })
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
          onPress: async () => {
            isManualRef.current = true
            await onDisconnect()
            router.navigate('/home')
          },
          style: 'destructive',
        },
      ]
    )
  }
  const snapPoints = ['12%', '30%']
  const handleSheetChange = useCallback((idx) => {
    setModalIdx(idx)
  }, [])
  useEffect(() => {
    if (modalidx === 0) {
      fadeOut()
    } else {
      fadeIn()
    }
  }, [modalidx])
  const bridge_batt_ref = useRef(false)
  const tracker_batt_ref = useRef(false)
  useEffect(() => {
    writeByUUID(
      bleManager,
      bleDevice,
      TRACKER_UUID,
      BRIDGE_LIGHT_UUID,
      brightness
    )
  }, [brightness])
  useEffect(() => {
    if (recall) {
      setTimeout(() => {
        setRecall(false)
      }, 3000)
    }
  }, [recall])
  useEffect(() => {
    if (bridge?.batt && bridge?.batt < 20 && !bridge_batt_ref.current) {
      bridge_batt_ref.current = true
      return Alert.alert(
        'Bridge Low Battery',
        `${bridge.batt}% of battery remaining`
      )
    }
    if (tracker?.batt && tracker?.batt < 20 && !tracker_batt_ref.current) {
      tracker_batt_ref.current = true
      return Alert.alert(
        'Tracker Low Battery',
        `${tracker.batt}% of battery remaining`
      )
    }
  }, [bridge?.batt, tracker?.batt])
  return (
    <BottomSheet
      gestureVelocityImpact={0.5}
      detached
      bottomInset={modalidx !== 0 ? 5 : -10}
      style={{ width: '100%' }}
      containerStyle={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
      handleStyle={{}}
      enableContentPanningGesture={false}
      // ✓ still allow dragging the handle
      enableHandlePanningGesture={true}
      // ✓ allow a pan-down (on that handle) to actually close
      enablePanDownToClose={false}
      // ✕ disable any overshoot pull
      enableOverDrag={true}
      ref={bottomSheetRef}
      onChange={handleSheetChange}
      snapPoints={snapPoints}
      backgroundStyle={{
        backgroundColor: '#171c26',
        borderRadius: 50,
        marginHorizontal: '1%',
        width: '98%',
        opacity: 0.95,
        borderWidth: 0.5,
        borderColor: '#555',
        height: modalidx === 0 && '33%',
        // borderWidth: 1,
        // borderColor: 'red',
      }}
      handleIndicatorStyle={{
        backgroundColor: '#555',
      }}
    >
      <BottomSheetView
        style={{
          borderRadius: 40,
          padding: modalidx !== 0 ? 18 : 0,
          paddingHorizontal: 18,
          alignItems: 'center',
          opacity: 1,
          gap: 10,
          flexDirection: 'column',
          width: '96%',
          justifyContent: 'center',
          marginLeft: '2%',
          marginRight: '2%',
        }}
      >
        {modalidx !== 0 && showContent && (
          <Animated.View
            style={[
              {
                opacity: fadeAnimation,
              },
            ]}
          >
            <View className='w-full'>
              <View className='flex flex-row justify-between px-5'>
                <View className='flex flex-row items-center justify-start  '>
                  <Text className='text-sm font-bold text-[#999]'>
                    Bridge:{' '}
                  </Text>
                  <Text className='font-bold text-[#999] text-sm '>
                    {bridge?.firmware ? 'V.' + bridge.firmware + ' ' : 'Ver -'}
                  </Text>
                  <View className='text-[#9999] flex flex-row items-center'>
                    <Text className='text-[#999] font-bold text-sm '>
                      {bridge?.batt > 100 || bridge?.batt < 0
                        ? '-'
                        : bridge.batt}
                      %
                    </Text>
                    <FontAwesomeIcon
                      size={10}
                      icon={faBattery}
                      color='#999'
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                  </View>
                </View>
                <View>
                  <Text className='text-xs font-bold text-[#999]'></Text>
                </View>
              </View>
              <View className='rounded-full p-2 items-center flex-row border border-[#555] w-full gap-2 bg-[#161517]'>
                <View className='w-full flex-row px-1 gap-2'>
                  <View className='p-2 rounded-full bg-[#ddd]'>
                    <FontAwesomeIcon icon={faPaw} size={20} />
                  </View>
                  <View className='flex-row items-center justify-between flex-1'>
                    <View className='flex-col justify-between'>
                      <Text className='text-white font-bold text-lg'>
                        Tracker
                      </Text>
                      <Text className='text-slate-300 text-xs font-medium'>
                        Firmware:{' '}
                        {tracker?.firmware ? tracker.firmware + ' V' : '-'}
                      </Text>
                    </View>
                    <View className='flex-row'>
                      <Text className='text-slate-300 font-bold'>
                        {tracker?.batt > 100 || tracker?.batt < 0
                          ? '-'
                          : tracker?.batt}
                        %
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
            </View>
            <View className='w-full gap-1 flex-row justify-between my-2'>
              <TouchableOpacity
                onPressIn={() => {
                  setDisableOverDrag(true)
                }}
                onPressOut={() => {
                  setDisableOverDrag(false)
                }}
                onPress={() => {
                  writeByUUID(
                    bleManager,
                    bleDevice,
                    TRACKER_UUID,
                    BRIDGE_BUZZER_UUID,
                    1
                  )
                  setRecall(true)
                }}
                style={{
                  backgroundColor: recall ? '#292929' : '#161517',
                  opacity: 0.8,
                }}
                className='flex-grow  bg-[#161517] rounded-[32px] p-4 w-1/2 border border-[#555] gap-4'
              >
                <View
                  className='rounded-full p-2 bg-[#ddd] w-8 h-8 items-center justify-center z-10'
                  style={{
                    opacity: recall ? 1 : 0.15,
                    backgroundColor: 'rgb(255, 0, 0)',
                  }}
                >
                  <FontAwesomeIcon icon={faBell} color='#ddd' />
                </View>
                <Text className='font-bold color-white z-10'>
                  Recall {recall ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
              <LightSliderButton
                onPressIn={() => {
                  setDisableOverDrag(true)
                }}
                initialBrightness={brightness}
                onPressOut={() => {
                  setDisableOverDrag(false)
                }}
                onBrightnessChange={setBrightness}
                onPress={() => setLight((prev) => !prev)}
              />
            </View>
          </Animated.View>
        )}
        <View className='w-full flex-row pb-10 gap-2' style={{}}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: '#2455dd' }}
            className='rounded-full h-14 justify-center items-center  w-1/2 '
            onPress={() => {
              onLocatePress()
              handleFeedback()
            }}
          >
            <Text className='font-semibold text-xl color-[#fff]'>Locate</Text>
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
