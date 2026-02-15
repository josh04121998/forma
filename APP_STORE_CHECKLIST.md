# App Store Publishing Checklist

## 1. Apple Developer Account ($99/year)
- [ ] Sign up at https://developer.apple.com/programs/
- [ ] Complete enrollment (may take 24-48 hours to approve)
- [ ] Note your **Team ID** from Membership details

## 2. App Assets Needed

### App Icon (REQUIRED)
- [ ] **1024x1024 PNG** - square, no transparency, no rounded corners
- Save to: `assets/images/icon.png`

### Screenshots (REQUIRED for App Store listing)
- [ ] 6.7" iPhone (1290 x 2796) - iPhone 15 Pro Max
- [ ] 6.5" iPhone (1284 x 2778) - iPhone 14 Plus  
- [ ] 5.5" iPhone (1242 x 2208) - iPhone 8 Plus (optional but recommended)
- Minimum 1, maximum 10 screenshots per size

### App Store Listing
- [ ] App Name: "Forma - Workout Tracker"
- [ ] Subtitle (30 chars): "AI-Powered Fitness Coach"
- [ ] Description (4000 chars max)
- [ ] Keywords (100 chars, comma-separated)
- [ ] Category: Health & Fitness
- [ ] Privacy Policy URL (REQUIRED)
- [ ] Support URL

## 3. EAS Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Link project (creates project ID)
cd forma
eas init

# Configure credentials (Apple account needed)
eas credentials
```

## 4. Update Config Files

In `app.json`, replace:
- `YOUR_EAS_PROJECT_ID` → from `eas init`
- `YOUR_EXPO_USERNAME` → your Expo username

In `eas.json`, replace:
- `YOUR_APPLE_ID@email.com` → Apple Developer email
- `YOUR_APP_STORE_CONNECT_APP_ID` → from App Store Connect
- `YOUR_TEAM_ID` → from Apple Developer Membership

## 5. Build & Submit

```bash
# Build for iOS (takes ~15-30 min, runs in cloud)
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios --latest
```

## 6. App Store Connect

After submission:
1. Go to https://appstoreconnect.apple.com
2. Complete app information
3. Add screenshots and description
4. Set pricing (Free + In-App Purchases for AI features)
5. Submit for review (usually 24-48 hours)

## Privacy Policy

You need a privacy policy. Quick options:
- Use a generator like https://www.privacypolicygenerator.info/
- Host on GitHub Pages or any URL
- Must mention: data collection, workout data storage, Supabase usage

## App Review Tips

- Make sure app doesn't crash
- All features should work or be clearly marked as "coming soon"
- Login must be optional (users can use app without account)
- AI features can be gated behind paywall ✓
