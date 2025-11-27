import { faLightbulb } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import * as Haptics from 'expo-haptics'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, View } from 'react-native'

export default function LightSliderButton({
  initialBrightness = 50,
  onBrightnessChange = () => {},
  onPress = () => {},
  onPressIn = () => {},
  onPressOut = () => {},
}) {
  const [brightness, setBrightness] = useState(initialBrightness)
  const [adjusting, setAdjusting] = useState(false)

  // Refs to avoid stale closures
  const brightnessRef = useRef(brightness)
  const lastNonZeroRef = useRef(initialBrightness)
  const startBrightnessRef = useRef(brightness)
  const adjustingRef = useRef(false)
  const longPressTimer = useRef(null)
  const sliderWidthRef = useRef(1)
  const lastWarnedRef = useRef(null)

  const handleFeedBackWarning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
  // Keep refs in sync
  useEffect(() => {
    brightnessRef.current = brightness
    if (brightness > 0) lastNonZeroRef.current = brightness
  }, [brightness])
  useEffect(() => {
    adjustingRef.current = adjusting
  }, [adjusting])

  // PanResponder handles long-press + slide + tap
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // start long-press timer
        longPressTimer.current = setTimeout(() => {
          setAdjusting(true)
        }, 300)
        startBrightnessRef.current = brightnessRef.current
      },

      onPanResponderMove: (_, { dx }) => {
        onPressIn()
        if (!adjustingRef.current) return
        const w = sliderWidthRef.current
        const deltaPct = (dx / w) * 100
        let newPct = Math.round(
          Math.max(0, Math.min(100, startBrightnessRef.current + deltaPct))
        )
        if (newPct % 10 === 0 && lastWarnedRef.current !== newPct) {
          lastWarnedRef.current = newPct
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setBrightness(newPct)
          onBrightnessChange(newPct)
        }
      },

      onPanResponderRelease: () => {
        clearTimeout(longPressTimer.current)
        if (adjustingRef.current) {
          // finished sliding
          setAdjusting(false)
          onPressOut()
        } else {
          // simple tap → toggle
          if (brightnessRef.current > 0) {
            setBrightness(0)
            onBrightnessChange(0)
          } else {
            const restore = lastNonZeroRef.current || initialBrightness
            setBrightness(restore)
            onBrightnessChange(restore)
          }
          onPress()
        }
      },

      onPanResponderTerminate: () => {
        clearTimeout(longPressTimer.current)
        if (adjustingRef.current) setAdjusting(false)
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current

  // Capture container width for percent calculations
  const handleLayout = (e) => {
    sliderWidthRef.current = e.nativeEvent.layout.width
  }

  const isOn = brightness > 0

  return (
    <View
      className='border border-[#555] gap-4'
      onLayout={handleLayout}
      style={[
        styles.button,
        {
          shadowColor: 'red',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isOn && 0.6,
          shadowRadius: isOn && 8,
          elevation: 20,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* fill background */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.fill,
          { width: `${brightness}%` },
        ]}
      />

      {/* padded content */}
      <View style={styles.content} className='p-4'>
        <View
          className='rounded-full p-2 bg-[#2455dd] w-8 h-8 items-center justify-center'
          style={{ opacity: brightness < 15 ? 0.15 : brightness / 100 }}
        >
          <FontAwesomeIcon icon={faLightbulb} color='#ddd' />
        </View>
        <Text className='font-bold color-white'>
          {isOn ? `${brightness}% Brightness` : 'Light Off'}
        </Text>
      </View>
    </View>
  )
}

LightSliderButton.propTypes = {
  initialBrightness: PropTypes.number,
  onBrightnessChange: PropTypes.func,
  onPress: PropTypes.func,
}

const styles = StyleSheet.create({
  button: {
    width: '50%',

    backgroundColor: '#161517',
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    backgroundColor: '#292929',
    opacity: 0.8,
  },
  content: {
    flexDirection: 'column',
    flexGrow: 1,
    zIndex: 1,
    justifyContent: 'space-between',
  },
})
