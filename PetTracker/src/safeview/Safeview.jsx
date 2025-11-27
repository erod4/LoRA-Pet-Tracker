import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from './BackButton'

const Safeview = ({ children, goBack = false, gradient, styling = {} }) => {
  return (
    <>
      {gradient ? (
        <LinearGradient
          colors={['#111', '#222', '#111']}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView className='flex-1' edges={['top']} style={styling}>
            {goBack && <BackButton />}
            {children}
          </SafeAreaView>
        </LinearGradient>
      ) : (
        <View className='flex-1 bg-[#202229]'>
          <SafeAreaView className='flex-1 ' edges={['top']}>
            {goBack && <BackButton />}
            {children}
          </SafeAreaView>
        </View>
      )}
    </>
  )
}

export default Safeview
