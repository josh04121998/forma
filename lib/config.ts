// Configuration - API keys loaded from environment
// Create a .env file with your keys (see .env.example)

export const config = {
  groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// For development/testing, you can temporarily set keys here
// WARNING: Never commit real API keys to git!
// export const config = {
//   groqApiKey: 'your-key-here',
//   ...
// };
