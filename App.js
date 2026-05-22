import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Animated, StyleSheet, Image, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import SetupScreen   from './src/screens/SetupScreen';
import TimerScreen   from './src/screens/TimerScreen';
import WarmUpScreen  from './src/screens/WarmUpScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { COLORS } from './src/utils/theme';
import { SoundManager } from './src/utils/SoundManager';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background:   COLORS.bg,
    card:         COLORS.surface,
    text:         COLORS.textPrimary,
    border:       COLORS.border,
    primary:      COLORS.primary,
    notification: COLORS.primary,
  },
};

function HomeTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          borderTopWidth:  0.5,
          height:          60 + insets.bottom,
          paddingBottom:   Math.max(insets.bottom, 8),
          paddingTop:      8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize:      11,
          fontWeight:    '600',
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
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🕐</Text>
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

// ─── Responsive splash overlay ────────────────────────────────────────────────
function SplashOverlay({ opacity }) {
  const { width, height } = useWindowDimensions();

  const iconSize   = width * 0.30;
  const titleSize  = Math.round(width * 0.09);
  const tagSize    = Math.round(width * 0.036);
  const footerSize = Math.round(width * 0.028);

  return (
    <Animated.View
      style={[styles.splash, { opacity }]}
      pointerEvents="none"
    >
      <View style={styles.splashBg} />

      <Image
        source={require('./assets/icon.png')}
        style={{
          width:        iconSize,
          height:       iconSize,
          borderRadius: iconSize * 0.23,
          marginBottom: height * 0.03,
        }}
        resizeMode="contain"
      />

      <Text style={[styles.splashTitle, { fontSize: titleSize }]}>
        RoundMaster
      </Text>

      <Text style={[styles.splashTagline, { fontSize: tagSize }]}>
        Train Harder. Fight Smarter.
      </Text>

      <Text style={[styles.splashFooter, { fontSize: footerSize, bottom: height * 0.06 }]}>
        🥊 Boxing Timer Pro
      </Text>
    </Animated.View>
  );
}

export default function App() {
  const [appIsReady,    setAppIsReady   ] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  const splashOpacity = useRef(new Animated.Value(0)).current;
  const appOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(splashOpacity, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await SoundManager.init();
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        console.warn('App prepare error:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady) return;
    SplashScreen.hideAsync();
    Animated.timing(splashOpacity, {
      toValue: 0, duration: 500, useNativeDriver: true,
    }).start(() => setSplashVisible(false));
    Animated.timing(appOpacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
  }, [appIsReady]);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>

        <Animated.View style={[styles.fill, { opacity: appOpacity }]}>
          <NavigationContainer theme={NAV_THEME}>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            <Stack.Navigator
              screenOptions={{
                headerShown:    false,
                cardStyle:      { backgroundColor: COLORS.bg },
                presentation:   'modal',
                gestureEnabled: false,
              }}
            >
              <Stack.Screen name="Home"  component={HomeTabs} />
              <Stack.Screen
                name="Timer"
                component={TimerScreen}
                options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </Animated.View>

        {splashVisible && <SplashOverlay opacity={splashOpacity} />}

      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C2247' },
  fill: { flex: 1 },

  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         999,
  },
  splashBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C2247',
  },
  splashTitle: {
    color:         '#80E4E9',
    fontWeight:    '700',
    letterSpacing: -0.5,
    marginBottom:  8,
  },
  splashTagline: {
    color:         '#A8BDD0',
    letterSpacing: 1,
    fontWeight:    '400',
  },
  splashFooter: {
    position:      'absolute',
    color:         '#476485',
    letterSpacing: 0.5,
  },
});