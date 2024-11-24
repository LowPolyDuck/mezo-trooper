import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// Ensure the required environment variables are defined
const validateEnvVar = (envVar: string | undefined, varName: string) => {
  if (!envVar) {
    throw new Error(`Missing environment variable: ${varName}`)
  }
  return envVar
}

export const CLIENT_ID = validateEnvVar(process.env.CLIENT_ID, 'CLIENT_ID')
export const GUILD_ID = validateEnvVar(process.env.GUILD_ID, 'GUILD_ID')
export const TOKEN = validateEnvVar(process.env.BOT_TOKEN, 'BOT_TOKEN')

export const MONGO_USER = validateEnvVar(process.env.MONGO_USER, 'MONGO_USER')
export const MONGO_SECRET = validateEnvVar(process.env.MONGO_SECRET, 'MONGO_SECRET')

export const MONGO_URL = validateEnvVar(process.env.MONGO_URL, 'MONGO_URL')
export const MESSAGE_ID = validateEnvVar(process.env.MESSAGE_ID, 'MESSAGE_ID')
export const MONGO_DB = validateEnvVar(process.env.MONGO_DB, 'MONGO_DB')
export const MONGO_COLLECTION = validateEnvVar(process.env.MONGO_COLLECTION, 'MONGO_COLLECTION')

export const DRIP_API_KEY = validateEnvVar(process.env.DRIP_API_KEY, 'DRIP_API_KEY')
export const DRIP_REALM_ID = validateEnvVar(process.env.DRIP_REALM_ID, 'DRIP_REALM_ID')

export const LOG_CHANNEL_ID = validateEnvVar(process.env.LOG_CHANNEL_ID, 'LOG_CHANNEL_ID')
export const GAME_CHANNEL_ID = validateEnvVar(process.env.GAME_CHANNEL_ID, 'GAME_CHANNEL_ID') // leaderboard + play
