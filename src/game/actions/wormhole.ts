import { ActionRowBuilder, bold, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { Trooper } from '../../types'
import { continueButton, goBackButton } from './common/buttons'
import { territories } from '../constants'
import { toTitleCase, updateLeaderboardMessage } from '../utilities'

export async function handleWormholeOptions(interaction: ButtonInteraction) {
  const options = [
    { label: `🌱 ${territories.CAMP_SATOSHI}`, value: territories.CAMP_SATOSHI, cost: '0 points' },
    { label: `🌾 ${territories.MATS_FARMING_BASE}`, value: territories.MATS_FARMING_BASE, cost: '1,000 points' },
    { label: `🏦 ${territories.MEZO_COMMAND}`, value: territories.MEZO_COMMAND, cost: '10,000 points' },
    { label: `🌌 ${territories.BITCOINFI_FRONTIER}`, value: territories.BITCOINFI_FRONTIER, cost: '20,000 points' },
  ]

  const buttons = options.map((option) =>
    new ButtonBuilder()
      .setCustomId(`wormhole_${option.value.toLowerCase().replace(/ /g, '_')}`)
      .setLabel(option.label)
      .setStyle(ButtonStyle.Primary),
  )

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons, goBackButton())

  const embed = new EmbedBuilder()
    .setTitle('Select your Destination:')
    .setDescription(
      'Explore the territories in the Mezo Troopers universe. Each territory has unique challenges and rewards. Moving to higher territories costs points, so choose wisely!',
    )
    .setColor(0x00ae86)
    .addFields(
      options.map((option) => ({
        name: option.label,
        value: `Cost: **${option.cost}**`,
      })),
    )

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

export async function handleWormholeCommand(interaction: ButtonInteraction, destination: string) {
  const userId = interaction.user.id

  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: territories.CAMP_SATOSHI,
  }

  if (toTitleCase(trooper.currentTerritory) === destination) {
    await interaction.update({
      content: `You are already in ${bold(destination)} territory!`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton())],
    })
    return
  }

  const updateSuccessful = await updatePlayerTerritory(userId, trooper.points, destination)
  const wormholeGifUrl = 'https://media1.tenor.com/m/mny-6-XqV1kAAAAd/wormhole.gif'

  if (updateSuccessful) {
    const embed = new EmbedBuilder()
      .setTitle(`Wormhole Travel to ${bold(destination)}!`)
      .setDescription(`You have successfully traveled to ${bold(destination)}. Points fees deducted.`)
      .setImage(wormholeGifUrl)
    await interaction.update({
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton())],
    })
  } else {
    await interaction.update({
      content: `You do not have enough points to travel to ${bold(destination)}.`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton())],
    })
  }
}

async function updatePlayerTerritory(userId: string, currentPoints: number, newTerritory: string) {
  const gasFees: Record<string, number> = {
    [territories.CAMP_SATOSHI]: 0,
    [territories.MATS_FARMING_BASE]: 1000,
    [territories.MEZO_COMMAND]: 10000,
    [territories.BITCOINFI_FRONTIER]: 20000,
  }

  const fee = gasFees[newTerritory.toLowerCase()]
  if (currentPoints >= fee) {
    await insertOrUpdatePlayer({
      userId,
      points: currentPoints - fee,
      currentTerritory: newTerritory,
    })
    return true
  }

  return false
}
