# 🥊 Boxing Timer

A clean, reliable cross-platform boxing timer for iOS and Android built with Expo + React Native.

---

## Features
- Unlimited rounds with customisable round and rest durations
- Warm-up timer (0–60 seconds)
- +5 / +10 / +15 / +30s increment buttons for fast setup
- Full-screen active timer with circular progress ring
- Round dot progress indicator
- Haptic feedback on phase transitions and 3-second warning
- Screen kept awake during sessions
- Ads hidden during active rounds (only shown during rest or pause)
- Dark theme, works on portrait and landscape

---

## Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ LTS | https://nodejs.org |
| VS Code | latest | https://code.visualstudio.com |
| Expo Go app | latest | App Store / Google Play |

> **Optional** for building native binaries: Xcode (macOS only) and/or Android Studio.

---

## VS Code Setup (Step by Step)

### Step 1 — Install VS Code extensions

Open VS Code, press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS) and install:

- **React Native Tools** (Microsoft) — debugging + IntelliSense
- **ES7+ React/Redux/React-Native snippets** (dsznajder) — code snippets
- **Prettier - Code formatter** (Prettier) — auto-formatting
- **ESLint** (Microsoft) — linting

### Step 2 — Open the project

```bash
# Option A: from terminal
code boxing-timer

# Option B: VS Code menu
# File → Open Folder → select the boxing-timer folder
```

### Step 3 — Install dependencies

Open the integrated terminal in VS Code:  
`Ctrl+`` ` (backtick) or **Terminal → New Terminal**

```bash
npm install
```

This installs all packages listed in `package.json`. Takes 1–3 minutes.

### Step 4 — Start the development server

```bash
npx expo start
```

You'll see a QR code and a menu in the terminal.

---

## Running the App

### On your physical phone (easiest — no emulator needed)

1. Install **Expo Go** from the App Store (iOS) or Google Play (Android)
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. Run `npx expo start` in the terminal
4. **iOS**: Open the Camera app and scan the QR code
5. **Android**: Open Expo Go → tap "Scan QR code" → scan

### On iOS Simulator (macOS only)

Requires Xcode installed from the Mac App Store.

```bash
npx expo start --ios
```

Or press `i` in the terminal after `npx expo start`.

### On Android Emulator

Requires Android Studio with an AVD (Android Virtual Device) set up.

```bash
npx expo start --android
```

Or press `a` in the terminal after `npx expo start`.

### On Web (browser)

```bash
npx expo start --web
```

Or press `w` in the terminal. Note: haptics won't work in the browser.

---

## Project Structure

```
boxing-timer/
├── App.js                        # Root — navigation setup
├── app.json                      # Expo config
├── package.json                  # Dependencies
├── babel.config.js               # Babel config
└── src/
    ├── components/
    │   ├── TimeControl.js        # Time setting widget (+/- + increments)
    │   ├── RoundsControl.js      # Rounds counter widget
    │   └── ProgressRing.js       # SVG circular progress ring
    ├── hooks/
    │   └── useBoxingTimer.js     # Core timer state machine
    ├── screens/
    │   ├── SetupScreen.js        # Configure session settings
    │   ├── TimerScreen.js        # Full-screen active timer
    │   └── WarmUpScreen.js       # Standalone warm-up timer
    └── utils/
        ├── theme.js              # Colors, fonts, constants
        └── format.js            # Time formatting helpers
```

---

## Common Issues

### "Unable to resolve module" error
```bash
npx expo install
npm install
```

### QR code doesn't connect
- Check that phone and computer are on the same Wi-Fi
- Try pressing `s` in the terminal to switch to tunnel mode: `npx expo start --tunnel`

### Expo Go crashes on launch
```bash
npx expo start --clear
```
The `--clear` flag resets the Metro bundler cache.

### Module not found after install
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

---

## Building for Production

### Using EAS Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK/AAB for Play Store
eas build --platform ios       # IPA for App Store
```

### Local build

```bash
npx expo run:android           # requires Android Studio
npx expo run:ios               # requires Xcode (macOS only)
```

---

## Adding Real Ads (AdMob)

1. Install the package:
   ```bash
   npx expo install react-native-google-mobile-ads
   ```

2. Add your AdMob App IDs to `app.json`:
   ```json
   "plugins": [
     ["react-native-google-mobile-ads", {
       "androidAppId": "ca-app-pub-XXXX~XXXX",
       "iosAppId": "ca-app-pub-XXXX~XXXX"
     }]
   ]
   ```

3. Replace the `<View style={styles.adBanner}>` placeholder in each screen with the `BannerAd` component from the library.

---

## License

MIT — free to use and modify.
