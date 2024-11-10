import {
  Client,
  ButtonInteraction,
  bold,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  time,
} from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { defences, quotes, weapons } from '../constants'
import { addMillisecondsToDate, logPlayerDeath } from '../utilities'
import { territories } from '../constants'
import { handleSpecialOutcome } from './special'
import { getFallbackTerritory } from './territories'

export async function handleCombatCommand(
  interaction: ButtonInteraction,
  itemUsed: string,
  userChoice: string,
  powerLevel: number,
  cooldowns: Map<string, number> = new Map(),
) {
  const userId = interaction.user.id
  const avatarUrl = interaction.user.displayAvatarURL()
  const lastCommandTime = cooldowns.get(userId) || 0
  const now = Date.now()
  const timeLeft = now - lastCommandTime

  if (timeLeft < 0) {
    const waitUntil = addMillisecondsToDate(new Date(now), timeLeft)
    await interaction.editReply(`You're on cooldown. Try again later. Wait ${time(waitUntil, 'R')}`)
    return
  }

  const trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: territories.CAMP_SATOSHI,
  }

  if (interaction.isButton() && (userChoice === weapons.DAGGER || userChoice === defences.SNACKING)) {
    await handleSpecialOutcome(interaction, userChoice, trooper, userId, powerLevel, userChoice, avatarUrl)
    return
  }

  const boostedResult = isBoosted()
  const successChance = getSuccessChance(powerLevel, trooper.currentTerritory)
  const isSuccessful = Math.random() < successChance
  let pointsChange = isSuccessful ? calculatePoints(powerLevel, trooper.currentTerritory) : 0

  if (boostedResult) pointsChange *= 7

  let title = ''
  let messageContent = ''
  let gifUrl = ''
  let color = 0x00ff00

  if (isSuccessful) {
    trooper.points += pointsChange
    title = '🎉 Mission accomplished!'
    messageContent = `You've earned ✨${bold(pointsChange.toString())} points!\nYour new total is ✨${bold(
      trooper.points.toString(),
    )} points. Keep up the great work, Trooper! 💪`

    if (boostedResult) {
      const boosts = [
        {
          type: 'airdrop',
          title: '🪂 Airdrop Incoming!',
          message: `The latest sharding BitcoinFi Assault Rifle was airdropped from Mezo, Fiat hive was ${bold(
            'OBLITERATED',
          )}!`,
          gifUrl:
            'https://media1.tenor.com/m/C0vINUKPPtUAAAAC/dizzy-flores-isabel-flores-isabelle-flores-dina-meyer-starship-troopers.gif',
        },
        {
          type: 'grenade',
          title: '💥 Grenade Deployed!',
          message: `Tactical Mezo Decentralization Grenade deployed, Fiat hive was ${bold('NUKED')}!`,
          gifUrl: 'https://i.gifer.com/IcYx.gif',
        },
        {
          type: 'teamwork',
          title: '👥 Teamwork Boost!',
          message: `Squad ${bold('Mezo G6')} joins your position, Fiat hive was ${bold('DESTROYED')}!`,
          gifUrl: 'https://c.tenor.com/41agPzUN8gAAAAAd/tenor.gif',
        },
        {
          type: 'strike',
          title: '⚔️ Precision Strike!',
          message: `You initiated a precise Mezo strike, the Fiat Bug Empire is ${bold('DEVASTATED')}!`,
          gifUrl: 'https://c.tenor.com/c9scti8m3HAAAAAd/tenor.gif',
        },
        {
          type: 'ambush',
          title: '🚀 Surprise Ambush!',
          message: `You led an ambush, overwhelming the Fiat Empire forces, leaving them ${bold('CRUSHED')}!`,
          gifUrl: 'https://c.tenor.com/yuBjFMtigKMAAAAd/tenor.gif',
        },
        {
          type: 'recon',
          title: '🔍 Recon Success!',
          message: `Recon gathered crucial intel, catching Fiat Bugs off guard and ${bold(
            'DEMOLISHING',
          )} their defenses!`,
          gifUrl: 'https://c.tenor.com/N4KgRUxSD7gAAAAd/tenor.gif',
        },
      ]

      const randomBoost = boosts[Math.floor(Math.random() * boosts.length)]
      title = randomBoost.title
      messageContent = `${randomBoost.message}\nYou earned ✨${bold(
        pointsChange.toString(),
      )} points! New total: ✨${bold(trooper.points.toString())} points.`
      gifUrl = randomBoost.gifUrl
    }
  } else {
    title = '💀 Mission failed!'
    color = 0xffffff
    const pointsBeforeReset = trooper.points
    trooper.points = 0
    gifUrl = 'https://media1.tenor.com/m/0uCuBpDbYVYAAAAd/dizzy-death.gif'

    if (trooper.currentTerritory !== territories.CAMP_SATOSHI) {
      trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
      messageContent = `You were ${bold('DEFEATED')} and lost all points! Falling back to ${bold(
        trooper.currentTerritory,
      )}.`
    } else {
      messageContent = `You were ${bold('DEFEATED')} and lost all points! 💀💀💀\n${getQuote()}`
    }

    // await logPlayerDeath(
    //   interaction.client as Client,
    //   userId,
    //   pointsBeforeReset,
    //   trooper.currentTerritory,
    //   itemUsed,
    //   powerLevel,
    //   avatarUrl,
    // )
    cooldowns.set(userId, Date.now() + 4 * 60 * 60 * 1000) // 4-hour cooldown
  }

  await insertOrUpdatePlayer(trooper)
  const embed = new EmbedBuilder().setTitle(title).setDescription(messageContent).setColor(color)
  if (gifUrl) embed.setImage(gifUrl)

  const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

function getQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  return quotes[randomIndex]
}

function calculatePoints(powerLevel: number, territory: string): number {
  let basePoints: number

  switch (territory) {
    case territories.CAMP_SATOSHI:
      basePoints = 100
      break
    case territories.MATS_FARMING_BASE:
      basePoints = 500
      break
    case territories.MEZO_COMMAND:
      basePoints = 1000
      break
    case territories.BITCOINFI_FRONTIER:
      basePoints = 2500
      break
    default:
      basePoints = 100
  }

  switch (powerLevel) {
    case 1:
      return basePoints
    case 5:
      return basePoints * 2
    case 10:
      return basePoints * 4
    case 100:
      return basePoints * 10
    default:
      return basePoints
  }
}

function getSuccessChance(powerLevel: number, territory: string): number {
  let successChance: number
  switch (territory) {
    case territories.CAMP_SATOSHI:
      successChance = powerLevel === 100 ? 0.5 : powerLevel === 10 ? 0.75 : 0.95
      break
    case territories.MATS_FARMING_BASE:
      successChance = powerLevel === 100 ? 0.45 : powerLevel === 10 ? 0.7 : 0.9
      break
    case territories.MEZO_COMMAND:
      successChance = powerLevel === 100 ? 0.4 : powerLevel === 10 ? 0.65 : 0.85
      break
    case territories.BITCOINFI_FRONTIER:
      successChance = powerLevel === 100 ? 0.3 : powerLevel === 10 ? 0.5 : 0.8
      break
    default:
      successChance = 0.95
  }
  return successChance
}

function isBoosted() {
  return Math.floor(Math.random() * 5) === 0
}
