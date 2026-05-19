import 'react-native-gesture-handler';
import React, { useEffect, useCallback, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import SetupScreen from './src/screens/SetupScreen';
import TimerScreen from './src/screens/TimerScreen';
import WarmUpScreen from './src/screens/WarmUpScreen';
import { COLORS } from './src/utils/theme';
import { SoundManager } from './src/utils/SoundManager';

// Keep splash screen visible until we are ready
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    primary: COLORS.primary,
    notification: COLORS.primary,
  },
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Setup"
        component={SetupScreen}
        options={{
          tabBarLabel: 'Session',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🥊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="WarmUp"
        component={WarmUpScreen}
        options={{
          tabBarLabel: 'Warm-up',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔥</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialise sounds while splash is showing
        await SoundManager.init();
      } catch (e) {
        console.warn('App prepare error:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the splash screen now that the app is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} onLayout={onLayoutRootView}>
      <NavigationContainer theme={NAV_THEME}>
        <StatusBar style="light" backgroundColor={COLORS.bg} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.bg },
            presentation: 'modal',
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeTabs} />
          <Stack.Screen
            name="Timer"
            component={TimerScreen}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}