import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { SetUpDiscord } from './discord'
import { TOKEN } from './config/config'
import { handleMezoTrooperCommand } from './game/commands/mezoTrooper'
import { handleHelpCommand } from './game/commands/help'
import { handleLeaderboardCommand } from './game/commands/leaderboard'
import { endRound, getNextRoundEndTime, updateLeaderboardMessage } from './game/utilities'
import { handlePointsCommand } from './game/commands/points'
import { handlePowerLevelOptions, handlePowerLevelSelection } from './game/actions/power'
import { handleAttackOptions } from './game/actions/attack'
import { handleDefendOptions } from './game/actions/defend'
import { handleHelp } from './game/actions/help'
import { handleHowToPlay } from './game/actions/play'
import { handlePoints } from './game/actions/points'
import { handleWormholeCommand, handleWormholeOptions } from './game/actions/wormhole'

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.User, Partials.Message],
})

const cooldowns: Map<string, number> = new Map()
const pastLeaderboards: Array<{ date: string; leaderboard: string }> = []
let roundEndTime: Date = getNextRoundEndTime()

export async function Run(): Promise<void> {
  try {
    discordClient.once('ready', () => {
      console.log(`Logged in as ${discordClient.user?.tag}`)
      setInterval(async () => {
        await updateLeaderboardMessage(discordClient)
      }, 60 * 1000)
    })

    HandleEvents(discordClient)

    discordClient.on('interactionCreate', async (interaction) => {
      if (interaction.isCommand() && interaction.guildId) {
        const { commandName } = interaction

        switch (commandName) {
          case 'mezo_trooper':
            await handleMezoTrooperCommand(interaction)
            break
          case 'help':
            await handleHelpCommand(interaction)
            break
          case 'leaderboard':
            await handleLeaderboardCommand(interaction)
            break
          case 'points':
            await handlePointsCommand(interaction, roundEndTime)
            break
          default:
            await interaction.reply({
              content: 'Unknown command.',
              ephemeral: true,
            })
            break
        }
        await updateLeaderboardMessage(discordClient)
      }

      if (interaction.isButton()) {
        const { customId } = interaction

        if (customId.startsWith('wormhole_')) {
          const destination = customId.replace('wormhole_', '').replace(/_/g, ' ')
          await handleWormholeCommand(interaction, destination)
          return
        }

        switch (interaction.customId) {
          case 'attack':
            await handleAttackOptions(interaction)
            break
          case 'defend':
            await handleDefendOptions(interaction)
            break
          case 'wormhole':
            await handleWormholeOptions(interaction)
            break
          case 'how_to_play':
            await handleHowToPlay(interaction)
            break
          case 'points':
            await handlePoints(interaction)
            break
          case 'help':
            await handleHelp(interaction)
            break
          case 'go_back':
          case 'continue':
            await handleMezoTrooperCommand(interaction)
            break
          case 'blaster':
          case 'cannon':
          case 'fist':
          case 'stick':
          case 'build_wall':
          case 'set_trap':
          case 'supply_run':
          case 'snacking':
            await handlePowerLevelOptions(interaction, interaction.customId)
            break
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'power_level_select') {
          await handlePowerLevelSelection(interaction, cooldowns)
        }
      }
    })

    await SetUpDiscord(discordClient, TOKEN)
    console.log(`Bot status: ${discordClient.user?.presence?.status}`)
  } catch (error) {
    console.error('Error during bot execution:', error)
  }
}
Run()

// Schedule game reset every 24 hours at midnight UTC
setInterval(async () => {
  await endRound(pastLeaderboards)
  roundEndTime = getNextRoundEndTime()
}, 24 * 60 * 60 * 1000)

function HandleEvents(discordClient: Client) {
  discordClient.on('debug', (info) => {
    console.log('Info', info)
  })

  discordClient.on('warn', (warning) => {
    console.warn(warning)
  })

  discordClient.on('error', (error) => {
    console.error('Discord client error:', error)
  })
}
