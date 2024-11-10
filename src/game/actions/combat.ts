import { Client, ButtonInteraction, bold, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, time } from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { defenceOptions, quotes, weaponOptions } from '../constants'
import { Trooper, Outcome } from '../../types'
import { addMillisecondsToDate, logPlayerDeath } from '../utilities'
import { Territories } from '../constants'

export async function handleCombatCommand(
  interaction: ButtonInteraction,
  itemUsed: string,
  userChoice: string,
  powerLevel: number,
  cooldowns: Map<string, number> = new Map(),
) {
  // await interaction.deferReply()
  const userId = interaction.user.id
  const avatarUrl = interaction.user.displayAvatarURL() 

  // Cooldown logic for all commands
  const lastCommandTime = cooldowns.get(userId) || 0
  const now = Date.now()
  const timeLeft = now - lastCommandTime
  const isOnCooldown = timeLeft < 0

  if (isOnCooldown) {
    const waitUntil = addMillisecondsToDate(new Date(now), timeLeft)
    await interaction.editReply(`You are on cooldown. Try again later. Wait ${time(waitUntil, 'R')}`)
    return
  }

  // Game logic
  // Fetch the current trooper's status, including territory
  const trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: 'Satoshi’s Camp',
  }

  if (interaction.isButton() && (userChoice === 'dagger' || userChoice === 'snacking')) {
    await handleSpecialOutcome(interaction, userChoice, trooper, userId, powerLevel, userChoice, avatarUrl)
    return
  }

  // Determine if the selected weapon is boosted
  const boosted = randomBoostedItem()
  console.log('Available weapons:', weaponOptions)
  console.log('Available defenses:', defenceOptions)
  console.log('Randomly chosen boosted item:', boosted)
  console.log('User choice:', userChoice)
  console.log('boosted item:')
  console.log(boosted)
  const isBoosted = userChoice === boosted

  const successChance = getSuccessChance(powerLevel, trooper.currentTerritory)
  const isSuccessful = Math.random() < successChance
  console.log('Current Territory:', trooper.currentTerritory)
  console.log('Power Level:', powerLevel)
  console.log('Points before calculation:', trooper.points)
  let pointsChange = isSuccessful ? calculatePoints(powerLevel, trooper.currentTerritory) : 0
  console.log('Points Change after calculation:', pointsChange)
  if (isBoosted) {
    pointsChange *= 5
  }

  let title = ''
  let messageContent = ''
  let gifUrl = ''
  let color = 0x00ff00

  if (isSuccessful) {
    trooper.points += pointsChange
    title = '🎉 Mission accomplished!'
    messageContent = `You've earned ✨${bold(
      pointsChange + ' points',
    )} for your efforts.\n\n Your new total is now ✨${bold(
      trooper.points.toString(),
    )} points. Keep up the great work, Trooper! 💪`

    if (isBoosted) {
      const boosts = ['airdrop', 'teamwork', 'grenade', 'strike', 'ambush']
      const randomIndex = Math.floor(Math.random() * boosts.length)
      const boost = boosts[randomIndex]
      title = '🪖 Special Event!'

      if (isBoosted) {
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

        // Select a random boost eventi
        const randomBoost = boosts[Math.floor(Math.random() * boosts.length)]
        title = randomBoost.title

        // Common message structure with specific boost details
        messageContent = `\n${randomBoost.message}\n\nYou earned ✨${bold(
          pointsChange as any as string,
        )} points, Hurray! \nNew total: ✨${bold(trooper.points.toString())} points.`
        gifUrl = randomBoost.gifUrl
      }
    }
  } else {
    title = '💀 Mission failed!'
    color = 0xffffff
    if (trooper.currentTerritory !== 'Satoshi’s Camp') {
      trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
      const pointsBeforeReset = trooper.points 
      trooper.points = 0
      messageContent = `You have been ${bold(
        'DEFEATED',
      )} and lost all your points! 💀💀💀\n\n Mezo recovery ship deployed, falling back to the ${bold(
        trooper.currentTerritory,
      )} territory.`
      gifUrl = 'https://media1.tenor.com/m/0uCuBpDbYVYAAAAd/dizzy-death.gif'
            // Log the player's death in Satoshi’s Camp
            await logPlayerDeath(
              interaction.client as Client,
              userId,
              pointsBeforeReset,
              trooper.currentTerritory,
              itemUsed,
              powerLevel,
              avatarUrl
            )
    } else {
      const pointsBeforeReset = trooper.points 
      trooper.points = 0
      messageContent = `You were ${bold('DEFEATED')} and lost all your points! 💀💀💀`
      gifUrl = 'https://media1.tenor.com/m/iWJOxKk1s84AAAAd/bug-attack-starship-troopers.gif'

      messageContent += getQuote()
            // Log the player's death in Satoshi’s Camp

            await logPlayerDeath(
              interaction.client as Client,
              userId,
              pointsBeforeReset,
              trooper.currentTerritory,
              itemUsed,
              powerLevel,
              avatarUrl
            )
    }

    cooldowns.set(userId, Date.now() + 1000) // Apply 4-hour cooldown 4 * 60 * 60 * 1000
  }

  function getQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return `\n\n${quotes[randomIndex]}\n`
  }

  await insertOrUpdatePlayer(trooper)
  const embed = new EmbedBuilder().setTitle(title).setDescription(messageContent).setColor(color)

  if (gifUrl !== '') {
    embed.setImage(gifUrl)
  }

  const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

export async function handleSpecialOutcome(
  interaction: ButtonInteraction,
  userChoice: string,
  trooper: Trooper,
  userId: string,
  powerLevel: number,           // Added
  itemUsed: string,           // Added
  avatarUrl: string,             // Added
  cooldowns: Map<string, number> = new Map(),
) {
  const outcomes: Record<string, Outcome> = {
    dagger: {
      message: `A dagger? where's your ${bold('Mezo')} BitcoinFi-Assault Rifle trooper?\n\n You are overrun, you ${bold(
        'DIED',
      )}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/pvgQeEnepkQAAAAd/killer-bugs-starship-troopers.gif',
    },
    snacking: {
      message: `Eating your mats soldier? ${bold(
        'Mezo Troopers',
      )}  run on adrenline & BitcoinFi weaponry only.\n\n Fiat bugs ambush you, you ${bold('DIED')}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/e-Ngztd2-lYAAAAC/starship-troopers-burn.gif',
    },
  }

  if (!(userChoice in outcomes)) {
    console.error(`Invalid userChoice: ${userChoice}`)
    return
  }

  const outcome = outcomes[userChoice]
  const pointsBeforeReset = trooper.points  // Capture points before resetting


  await logPlayerDeath(
    interaction.client as Client,
    userId,
    pointsBeforeReset,
    trooper.currentTerritory,
    itemUsed,
    powerLevel,
    avatarUrl
  )
  trooper.points = 0
  if (trooper.currentTerritory !== 'Satoshi’s Camp') {
    trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
    cooldowns.set(userId, Date.now() + 1000)
  } else {
    cooldowns.set(userId, Date.now() + 1000)
  }

  await insertOrUpdatePlayer(trooper)
  const embed = new EmbedBuilder()
    .setTitle("You're the worst Mezo Trooper ever!") //
    .setDescription(outcome.message)
    .setImage(outcome.gifUrl)
    .setColor(0xffffff)

  const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

function calculatePoints(powerLevel: number, territory: string): number {
  let basePoints: number

  switch (territory) {
    case Territories.SATOSHIS_CAMP:
      basePoints = 100
      break
    case Territories.YIELD_FARMING_BASE:
      basePoints = 300
      break
    case Territories.LENDING_COMMAND:
      basePoints = 600
      break
    case Territories.EXPERIMENTAL_FRONTIER:
      basePoints = 1200
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
    case Territories.SATOSHIS_CAMP:
      successChance = powerLevel === 100 ? 0.5 : powerLevel === 10 ? 0.75 : 0.95
      break
    case Territories.YIELD_FARMING_BASE:
      successChance = powerLevel === 100 ? 0.45 : powerLevel === 10 ? 0.7 : 0.9
      break
    case Territories.LENDING_COMMAND:
      successChance = powerLevel === 100 ? 0.4 : powerLevel === 10 ? 0.65 : 0.85
      break
    case Territories.EXPERIMENTAL_FRONTIER:
      successChance = powerLevel === 100 ? 0.3 : powerLevel === 10 ? 0.5 : 0.8
      break
    default:
      successChance = 0.95
  }
  return successChance
}

function getFallbackTerritory(currentTerritory: string): string {
  const territoryOrder = ['satoshi’s camp', 'yield farming base', 'lending command', 'experimental frontier']
  const currentIndex = territoryOrder.indexOf(currentTerritory)
  return currentIndex > 0 ? territoryOrder[currentIndex - 1] : 'satoshi’s camp'
}

function randomBoostedItem() {
  const allOptions = [...weaponOptions, ...defenceOptions]
  const randomIndex = Math.floor(Math.random() * allOptions.length)
  return allOptions[randomIndex]
}
