import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BleDeviceProvider } from '../context/BluetoothContext'


export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: '/home',
}
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <GluestackUIProvider mode='system'>
      <BleDeviceProvider>
      <Stack screenOptions={{ headerShown: false }} />
      </BleDeviceProvider>
        
      </GluestackUIProvider>
    </GestureHandlerRootView>
  )
}
