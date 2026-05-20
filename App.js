import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Animated, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import SetupScreen from './src/screens/SetupScreen';
import TimerScreen from './src/screens/TimerScreen';
import WarmUpScreen from './src/screens/WarmUpScreen';
import { COLORS } from './src/utils/theme';
import { SoundManager } from './src/utils/SoundManager';

// Keep native splash visible until we manually hide it
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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          borderTopWidth:  0.5,
          height:          60,
          paddingBottom:   8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize:    11,
          fontWeight:  '600',
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
  const [appIsReady,      setAppIsReady     ] = useState(false);
  const [splashVisible,   setSplashVisible  ] = useState(true);

  // Animated values
  const splashOpacity = useRef(new Animated.Value(0)).current;  // starts invisible
  const appOpacity    = useRef(new Animated.Value(0)).current;  // app starts invisible

  // ── Step 1: Fade splash IN as soon as component mounts ──────────────────────
  useEffect(() => {
    Animated.timing(splashOpacity, {
      toValue:         1,
      duration:        600,   // ease-in over 600ms
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Step 2: Load resources while splash is showing ───────────────────────────
  useEffect(() => {
    async function prepare() {
      try {
        await SoundManager.init();
        // Small extra delay so splash is seen even on fast devices
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        console.warn('App prepare error:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // ── Step 3: When ready, fade splash OUT then fade app IN ─────────────────────
  useEffect(() => {
    if (!appIsReady) return;

    // Hide native splash screen first
    SplashScreen.hideAsync();

    // Fade out the custom splash overlay
    Animated.timing(splashOpacity, {
      toValue:         0,
      duration:        500,   // ease-out over 500ms
      useNativeDriver: true,
    }).start(() => {
      // Once splash is gone, remove it from the tree
      setSplashVisible(false);
    });

    // Fade app in simultaneously
    Animated.timing(appOpacity, {
      toValue:         1,
      duration:        500,
      useNativeDriver: true,
    }).start();
  }, [appIsReady]);

  return (
    <View style={styles.root}>

      {/* ── App content (fades in) ── */}
      <Animated.View style={[styles.fill, { opacity: appOpacity }]}>
        <NavigationContainer theme={NAV_THEME}>
          <StatusBar style="light" backgroundColor={COLORS.bg} />
          <Stack.Navigator
            screenOptions={{
              headerShown:  false,
              cardStyle:    { backgroundColor: COLORS.bg },
              presentation: 'modal',
              gestureEnabled: false,
            }}
          >
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen
              name="Timer"
              component={TimerScreen}
              options={{
                presentation:   'fullScreenModal',
                gestureEnabled: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Animated.View>

      {/* ── Custom splash overlay (fades in then out) ── */}
      {splashVisible && (
        <Animated.View
          style={[styles.splash, { opacity: splashOpacity }]}
          pointerEvents="none"
        >
          {/* Dark background */}
          <View style={styles.splashBg} />

          {/* App icon */}
          <Image
            source={require('./assets/icon.png')}
            style={styles.splashIcon}
            resizeMode="contain"
          />

          {/* App name */}
          <Text style={styles.splashTitle}>RoundMaster</Text>

          {/* Tagline */}
          <Text style={styles.splashTagline}>Train Harder. Fight Smarter.</Text>

          {/* Bottom brand mark */}
          <Text style={styles.splashFooter}>🥊 Boxing Timer Pro</Text>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#1C2247' },
  fill:  { flex: 1 },

  // ── Custom splash ─────────────────────────────────────────────────────────
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
  splashIcon: {
    width:        120,
    height:       120,
    borderRadius: 28,
    marginBottom: 24,
  },
  splashTitle: {
    color:         '#80E4E9',
    fontSize:      36,
    fontWeight:    '700',
    letterSpacing: -0.5,
    marginBottom:  8,
  },
  splashTagline: {
    color:         '#A8BDD0',
    fontSize:      14,
    letterSpacing: 1,
    fontWeight:    '400',
  },
  splashFooter: {
    position:      'absolute',
    bottom:        48,
    color:         '#476485',
    fontSize:      11,
    letterSpacing: 0.5,
  },
});