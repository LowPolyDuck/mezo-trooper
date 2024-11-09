import { ActionRowBuilder, bold, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { Trooper } from '../../types'

// Helper function to convert string to title case
function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

export async function handleWormholeOptions(interaction: ButtonInteraction) {
  const options = [
    { label: '🌱 Satoshi’s Camp', value: 'satoshi’s camp' },
    { label: '🌾 Yield Farming Base', value: 'yield farming base' },
    { label: '🏦 Lending Command', value: 'lending command' },
    { label: '🌌 Experimental Frontier', value: 'experimental frontier' },
  ]

  const buttons = options.map((option) =>
    new ButtonBuilder()
      .setCustomId(`wormhole_${option.value.toLowerCase().replace(/ /g, '_')}`)
      .setLabel(option.label)
      .setStyle(ButtonStyle.Primary),
  )

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)

  const embed = new EmbedBuilder()
  .setTitle(`Select your Destination:`)
  .setDescription("Explore the territories in the Mezo Troopers universe. Each territory has unique challenges and rewards. Moving to higher territories costs points, so choose wisely!")
  .setColor(0x00AE86)
  .addFields(
    {
      name: "🌱 Satoshi's Camp",
      value: "Cost: **0 points**",
    },
    {
      name: "🌾 Yield Farming Base",
      value: "Cost: **1,000 points**",
    },
    {
      name: "🏦 Lending Command",
      value: "Cost: **10,000 points**",
    },
    {
      name: "🌌 Experimental Frontier",
      value: "Cost: **20,000 points**",
    }
  );

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

export async function handleWormholeCommand(interaction: ButtonInteraction, destination: string) {
  // await interaction.deferReply()
  const userId = interaction.user.id

  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: 'satoshi’s camp',
  }

  // Check if the user is already in the selected territory
  if (trooper.currentTerritory === destination) {
    await interaction.update({
      content: `You are already in ${bold(toTitleCase(destination))} territory!`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary))],
    })
    return
  }

  const updateSuccessful = await updatePlayerTerritory(userId, trooper.points, destination)

  // Define a GIF URL to include in the reply
  const wormholeGifUrl = 'https://media1.tenor.com/m/mny-6-XqV1kAAAAd/wormhole.gif'

  // Create the "Go Back" button to return to the main menu
  const goBackButton = new ButtonBuilder()
    .setCustomId('go_back')
    .setLabel('Go Back')
    .setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton)

  if (updateSuccessful) {
    const embed = new EmbedBuilder()
      .setTitle(`Wormhole Travel to ${bold(toTitleCase(destination))}!`)
      .setDescription(`You have successfully traveled to ${bold(toTitleCase(destination))}, gas fees deducted.`)
      .setImage(wormholeGifUrl)

      await interaction.update({
        content: '', // Clear previous content
        embeds: [embed],
        components: [actionRow],
      })
  } else {
    await interaction.update({
      content: `You do not have enough points to travel to ${bold(toTitleCase(destination))}.`,
      components: [actionRow],
    })
  }
}

async function updatePlayerTerritory(userId: string, currentPoints: number, newTerritory: string) {
  const gasFees: { [key: string]: number } = {
    "satoshi’s camp": 0,
    "yield farming base": 1000,
    "lending command": 10000,
    "experimental frontier": 20000,
  }

  const fee = gasFees[newTerritory]
  console.log(newTerritory)
  console.log(gasFees)
  if (currentPoints >= fee) {
    await insertOrUpdatePlayer({
      userId,
      points: currentPoints - fee,
      currentTerritory: newTerritory,
    })
    return true
  } else {
    return false
  }
}
