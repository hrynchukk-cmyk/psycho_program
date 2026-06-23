import React from 'react'
import { Text } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/auth'
import { Loading } from './src/ui'
import { colors, serif } from './src/theme'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'
import JournalScreen from './src/screens/JournalScreen'
import ResourcesScreen from './src/screens/ResourcesScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import ActivityScreen from './src/screens/ActivityScreen'
import ProgramScreen from './src/screens/ProgramScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const tabIcon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
)

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontFamily: serif, fontSize: 18 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Головна', tabBarLabel: 'Головна', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: 'Щоденник', tabBarLabel: 'Щоденник', headerShown: false, tabBarIcon: tabIcon('📔') }} />
      <Tab.Screen name="Resources" component={ResourcesScreen} options={{ title: 'Матеріали', tabBarLabel: 'Матеріали', headerShown: false, tabBarIcon: tabIcon('📚') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профіль', tabBarLabel: 'Профіль', headerShown: false, tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  )
}

function Root() {
  const { ready, user } = useAuth()
  if (!ready) return <Loading />
  if (!user) return <AuthScreen />
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.text, fontFamily: serif, fontSize: 18 },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Активність' }} />
      <Stack.Screen name="Program" component={ProgramScreen} options={{ title: 'Програма' }} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
