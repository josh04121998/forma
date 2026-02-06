// Configuration - loads from .env file
// Expo requires EXPO_PUBLIC_ prefix and .env file (not .env.local)
// Restart Expo after changing env vars: npx expo start -c

export const config = {
  groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

// Debug: uncomment to check if env vars are loaded
// console.log('Config loaded:', { 
//   hasGroqKey: !!config.groqApiKey,
//   hasSupabase: !!config.supabaseUrl 
// });
