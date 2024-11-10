import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { SetUpDiscord } from './discord'
import { TOKEN } from './config/config'
import { handleMezoTrooperCommand } from './game/commands/mezoTrooper'
import { handleHelpCommand } from './game/commands/help'
import { handleLeaderboardCommand } from './game/commands/leaderboard'
import { endRound, getNextRoundEndTime, updateLeaderboardMessage } from './game/utilities'
import { handlePowerLevelOptions, handlePowerLevelSelection } from './game/actions/power'
import { handleAttackOptions } from './game/actions/attack'
import { handleDefendOptions } from './game/actions/defend'
import { handleHelp } from './game/actions/help'
import { handleHowToPlay } from './game/actions/play'
import { handleMain } from './game/actions/main'
import { handleWormholeCommand, handleWormholeOptions } from './game/actions/wormhole'
import { activeGames } from './game/constants'

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
        const { commandName, user, guildId } = interaction

        switch (commandName) {
          case 'mezo_trooper': {
            const userGameKey = `${guildId}-${user.id}`; // Wrap in braces to fix lexical declaration issue
    
            if (activeGames.has(userGameKey)) {
              await interaction.reply({
                content: 'You already have an active game. Complete it before starting a new one!',
                ephemeral: true,
              });
              return;
            }
    
            activeGames.set(userGameKey, user.id);
            await handleMezoTrooperCommand(interaction);
            break;
          }
          case 'help':
            await handleHelpCommand(interaction)
            break
          case 'leaderboard':
            await handleLeaderboardCommand(interaction)
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
          case 'main':
          case 'go_back':
          case 'continue':
            await handleMain(interaction, roundEndTime)
            break
          case 'help':
            await handleHelp(interaction)
            break
          case 'blaster':
          case 'cannon':
          case 'fist':
          case 'dagger':
          case 'build_wall':
          case 'set_trap':
          case 'supply_run':
          case 'snacking':
            await handlePowerLevelOptions(interaction)
            break
          case '1':
          case '5':
          case '10':
          case '100':
            await handlePowerLevelSelection(interaction, cooldowns)
            break
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
  for (const [userGameKey, _] of activeGames.entries()) {
    const [guildId, userId] = userGameKey.split('-')
    await endRound(pastLeaderboards, guildId, userId)
  }
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
