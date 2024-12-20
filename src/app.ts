import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { SetUpDiscord } from './discord'
import { TOKEN } from './config/config'
import { handleMezoTrooperCommand } from './game/commands/mezoTrooper'
import { endRound, getNextRoundEndTime, toTitleCase, updateLeaderboardMessage } from './game/utilities'
import { handlePowerLevelOptions, handlePowerLevelSelection } from './game/actions/power'
import { handleAttackOptions } from './game/actions/attack'
import { handleDefendOptions } from './game/actions/defend'
import { handleHelp } from './game/actions/help'
import { handleHowToPlay } from './game/actions/play'
import { handleMain } from './game/actions/main'
import { handleWormholeCommand, handleWormholeOptions } from './game/actions/wormhole'
import { activeGames, defences, weapons } from './game/constants'
import { handleCooldown, checkCooldown } from './game/actions/cooldown'

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
    })

    HandleEvents(discordClient)

    discordClient.on('interactionCreate', async (interaction) => {
      if (interaction.isCommand() && interaction.guildId) {
        const { commandName, user, guildId } = interaction

        switch (commandName) {
          case 'mezo_trooper': {

            // Check if a cooldown exists
            const userId = user.id;
            const now = Date.now();
            const cooldownEndTime = cooldowns.get(userId) || 0;
            const isOnCooldown = cooldownEndTime > now;

            if (isOnCooldown) {
              console.log('Player is on cooldown. Triggering handleCooldown.');
              await handleCooldown(interaction, cooldownEndTime); // Show the cooldown embed
              break;
            }
                      
            await handleMezoTrooperCommand(interaction)
            break
          }

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
          const destination = toTitleCase(customId.replace('wormhole_', '').replace(/_/g, ' '))
          await handleWormholeCommand(interaction, destination)
          return
        }
        console.log('BUTTON ' + customId)
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
          case 'continue': {
            // Check if a cooldown exists
            const userId = interaction.user.id;
            const now = Date.now();
            const cooldownEndTime = cooldowns.get(userId) || 0;
            const isOnCooldown = cooldownEndTime > now;

            if (isOnCooldown) {
              console.log('Player is on cooldown. Triggering handleCooldown.');
              await handleCooldown(interaction, cooldownEndTime); // Show the cooldown embed
              break;
            }
          
            await handleMain(interaction, roundEndTime, discordClient);
            break;
          }
          case 'help':
            await handleHelp(interaction)
            break
          case weapons.BLASTER:
          case weapons.CANNON:
          case weapons.FIST:
          case weapons.DAGGER:
          case defences.BUILD_WALL:
          case defences.SET_TRAP:
          case defences.SUPPLY_RUN:
          case defences.SNACKING:
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
