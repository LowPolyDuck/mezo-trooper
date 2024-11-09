import {
  CommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  bold,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  time,
} from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { defenceOptions, quotes, weaponOptions } from '../constants'
import { Trooper, Outcome } from '../../types'
import { addMillisecondsToDate } from '../utilities'
import { Territories } from '../constants'

export async function handleCombatCommand(
  interaction: ButtonInteraction,
  commandName: string,
  userChoice: string,
  powerLevel: number,
  cooldowns: Map<string, number> = new Map(),
) {
  // // Immediately defer the reply to buy time for processing
  // await interaction.deferReply()
  const userId = interaction.user.id

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
  // const powerLevel = (interaction.options.get('power-level')?.value as number) || 1
  // const userChoice = (interaction.options.get('choose_action')?.value as string) || 'Blaster'
  // console.log(userChoice)
  // const powerLevel = 1
  // Special outcomes for "Stick" or "Snacking"
  if (interaction.isButton() && (userChoice === 'Stick' || userChoice === 'Snacking')) {
    await handleSpecialOutcome(interaction, userChoice, trooper, userId)
    return // Exit the function early for special cases
  }

  // Determine if the selected weapon is boosted
  const boosted = randomBoostedItem()
  console.log('Available weapons:', weaponOptions);
console.log('Available defenses:', defenceOptions);
console.log('Randomly chosen boosted item:', boosted);
console.log('User choice:', userChoice);
  console.log('boosted item:')
  console.log(boosted)
  const isBoosted = userChoice === boosted

  // Adjusting success chance and points change based on the territory and power level
  const successChance = getSuccessChance(powerLevel, trooper.currentTerritory)
  const isSuccessful = Math.random() < successChance
console.log('Current Territory:', trooper.currentTerritory);
console.log('Power Level:', powerLevel);
console.log('Points before calculation:', trooper.points);
let pointsChange = isSuccessful ? calculatePoints(powerLevel, trooper.currentTerritory) : 0;
console.log('Points Change after calculation:', pointsChange);
  if (isBoosted) {
    pointsChange *= 5
  }

  let messageContent = ''
  let gifUrl = ''

  if (isSuccessful) {
    trooper.points += pointsChange

    messageContent = `Your ${commandName === 'attack' ? 'attack' : 'defence'} was ${bold(
      'successful',
    )}, you earned ${bold(pointsChange + ' points')}.\nNew total: ${bold(trooper.points.toString())} points.`

    // Transfer mats based on the pointsChange (Example usage of mats distribution for commands)
    // const matsToTransfer = Math.floor(pointsChange * 0.1); // Example calculation 10% of points earned the player receives in mats
    // await pointsManager.addPoints(interaction.user.id, matsToTransfer);

    // messageContent += `\nYou also earned ${matsToTransfer} mats!`;

    if (isBoosted) {
      const boosts = ['airdrop', 'teamwork', 'grenade']
      const randomIndex = Math.floor(Math.random() * boosts.length)
      const boost = boosts[randomIndex]

      switch (boost) {
        case 'airdrop':
          messageContent = `\nThe latest sharding BitcoinFi Assault Rifle was airdropped 🪂 from Mezo, Fiat hive was ${bold(
            'OBLITERATED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl =
            'https://media1.tenor.com/m/C0vINUKPPtUAAAAC/dizzy-flores-isabel-flores-isabelle-flores-dina-meyer-starship-troopers.gif'
          break
        case 'grenade':
          messageContent = `\nTactical Mezo Decentralization Grenade Deployed, Fiat hive was ${bold(
            'NUKED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl = 'https://i.gifer.com/IcYx.gif'
          break
        default:
        case 'teamwork': {
          messageContent = `\n Squad ${bold('Mezo G6')} joins your postion, Fiat hive was ${bold(
            'DESTROYED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl = 'https://c.tenor.com/41agPzUN8gAAAAAd/tenor.gif'
          break
        }
      }
    }
  } else {
    // If user dies, handle defeat based on their current territory
    if (trooper.currentTerritory !== 'Satoshi’s Camp') {
      trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
      trooper.points = 0 // Reset points to 0
      messageContent = `You have been ${bold(
        'DEFEATED',
      )} and lost all your points. 💀💀💀 \nBitcoinFi recovery ship deployed, falling back to the ${bold(
        trooper.currentTerritory,
      )} territory.`
      gifUrl = 'https://media1.tenor.com/m/0uCuBpDbYVYAAAAd/dizzy-death.gif'
    } else {
      trooper.points = 0 // Lose all points in Satoshi’s Camp as well
      //Different message when you die in the Satoshi’s Camp realm
      messageContent = ` You were ${bold('DEFEATED')} and lost all your points! 💀💀💀`
      gifUrl = 'https://media1.tenor.com/m/iWJOxKk1s84AAAAd/bug-attack-starship-troopers.gif'

      messageContent += getQuote()
    }

    cooldowns.set(userId, Date.now() + 1000) // Apply 4-hour cooldown 4 * 60 * 60 * 1000
  }

  function getQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return `\n\n${quotes[randomIndex]}\n`
  }

  // Update player data
  await insertOrUpdatePlayer(trooper)

  // Construct and send the reply
  // const commandNameCapitalized = interaction.commandName.charAt(0).toUpperCase() + interaction.commandName.slice(1)
  const embed = new EmbedBuilder().setDescription(messageContent)

  // Conditionally add an image if the URL is not empty
  if (gifUrl !== '') {
    console.log(gifUrl)
    embed.setImage(gifUrl)
  }
  // Add the "Continue" button for another round
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
  cooldowns: Map<string, number> = new Map(),
) {
  const outcomes: Record<string, Outcome> = {
    Stick: {
      message: `A stick? where's your ${bold('Mezo')} BitcoinFi-Assault Rifle trooper? you ${bold('DIED')}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/pvgQeEnepkQAAAAd/killer-bugs-starship-troopers.gif', // Replace with actual URL
    },
    Snacking: {
      message: `Eating soldier? ${bold(
        'Mezo',
      )} troopers run on adrenline & decentralized weaponry only. Fiat bugs ambush you, you ${bold('DIED')}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/e-Ngztd2-lYAAAAC/starship-troopers-burn.gif',
    },
  }

  if (!(userChoice in outcomes)) {
    console.error(`Invalid userChoice: ${userChoice}`)
    return // Or handle this case appropriately
  }

  const outcome = outcomes[userChoice]

  trooper.points = 0
  if (trooper.currentTerritory !== 'Satoshi’s Camp') {
    trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
    cooldowns.set(userId, Date.now() + 1000) // 4-hour cooldown
  } else {
    cooldowns.set(userId, Date.now() + 1000) // 4-hour cooldown in Satoshi’s Camp as well
  }

  await insertOrUpdatePlayer(trooper) // Update player data

  // embed with special outcome message and GIF
  const specialOutcomeEmbed = new EmbedBuilder()
    .setTitle("You're the worst Mezo Trooper ever!") //
    .setDescription(outcome.message)
    .setImage(outcome.gifUrl)

  await interaction.followUp({ embeds: [specialOutcomeEmbed] })
}

function calculatePoints(powerLevel: number, territory: string): number {
  let basePoints: number;

  switch (territory) {
    case Territories.SATOSHIS_CAMP:
      basePoints = 100;
      break;
    case Territories.YIELD_FARMING_BASE:
      basePoints = 300;
      break;
    case Territories.LENDING_COMMAND:
      basePoints = 600;
      break;
    case Territories.EXPERIMENTAL_FRONTIER:
      basePoints = 1200;
      break;
    default:
      basePoints = 100;
  }

  switch (powerLevel) {
    case 1:
      return basePoints // 1x
    case 5:
      return basePoints * 2
    case 10:
      return basePoints * 4
    case 100:
      return basePoints * 10
    default:
      return basePoints
  }
  // Scaling points based on power level
  return basePoints * (powerLevel / 1); // Multiplies by power level multiplier


 
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
  const allOptions = [...weaponOptions, ...defenceOptions] // Include "Snacking" if it's a defense option
  const randomIndex = Math.floor(Math.random() * allOptions.length)
  return allOptions[randomIndex]
}
