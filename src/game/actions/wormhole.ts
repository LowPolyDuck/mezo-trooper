import { ActionRowBuilder, bold, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { Trooper } from '../../types'
import { continueButton, goBackButton } from './common/buttons'
import { territories } from '../constants'

export async function handleWormholeOptions(interaction: ButtonInteraction) {
  if (!interaction.deferred) {
    await interaction.deferUpdate()
  }
  const userId = interaction.user.id
  console.log(`User ID: ${userId}`)

  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: territories.CAMP_SATOSHI,
  }

  const options = [
    { label: `🌱 ${territories.CAMP_SATOSHI}`, value: territories.CAMP_SATOSHI, cost: '0 points' },
    { label: `🌾 ${territories.MATS_FARMING_BASE}`, value: territories.MATS_FARMING_BASE, cost: '1,000 points' },
    { label: `🏦 ${territories.MEZO_COMMAND}`, value: territories.MEZO_COMMAND, cost: '10,000 points' },
    { label: `🌌 ${territories.BITCOINFI_FRONTIER}`, value: territories.BITCOINFI_FRONTIER, cost: '20,000 points' },
  ]

  console.log('Wormhole options:', options)

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
      `Explore the territories in the Mezo Troopers universe. Each territory has unique challenges and rewards. Moving to higher territories costs points.\n\n **Current Points ✨ ${trooper.points}**\n\n Choose a destination:`,
    )
    .setColor(0x00ae86)
    .addFields(
      options.map((option) => ({
        name: option.label,
        value: `> Cost: ${option.cost}`,
      })),
    )

  console.log('Sending wormhole options to user')

  try {
    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    })
  } catch (error) {
    console.error('Error in wormhole:', error)
    await interaction.followUp({
      content: 'Something went wrong while updating the wormhole options. Please try again.',
      ephemeral: true,
    })
  }
}

export async function handleWormholeCommand(interaction: ButtonInteraction, destination: string) {
  if (!interaction.deferred) {
    await interaction.deferUpdate()
  }
  console.log(`handleWormholeCommand called with destination: ${destination}`)

  const userId = interaction.user.id
  console.log(`User ID: ${userId}`)

  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: territories.CAMP_SATOSHI,
  }

  console.log('Current trooper data:', trooper)

  if (trooper.currentTerritory === destination) {
    await interaction.editReply({
      content: `You are already in ${bold(destination)} territory!`,
    })
    return
  }

  const updateSuccessful = await updatePlayerTerritory(userId, trooper.points, destination)
  console.log(`Territory update successful: ${updateSuccessful}`)

  const wormholeGifUrl = 'https://media1.tenor.com/m/mny-6-XqV1kAAAAd/wormhole.gif'

  if (updateSuccessful) {
    const embed = new EmbedBuilder()
      .setTitle(`Wormhole Travel to ${bold(destination)}!`)
      .setDescription(`You have successfully traveled to ${bold(destination)}. Points fees deducted.`)
      .setImage(wormholeGifUrl)
    console.log('Sending successful travel message')

    try {
      await interaction.editReply({
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton())],
      })
    } catch (error) {
      console.error('Error in wormhole:', error)
      await interaction.followUp({
        content: 'Something went wrong while updating the wormhole options. Please try again.',
        ephemeral: true,
      })
    }
  } else {
    console.log(`Insufficient points for user to travel to ${destination}`)

    await interaction.editReply({
      content: `You do not have enough points to travel to ${bold(destination)}.`,
    })
  }
}

async function updatePlayerTerritory(userId: string, currentPoints: number, newTerritory: string) {
  console.log(
    `updatePlayerTerritory called with userId: ${userId}, currentPoints: ${currentPoints}, newTerritory: ${newTerritory}`,
  )

  if (newTerritory == 'Bitcoinfi Frontier') {
    newTerritory = 'BitcoinFi Frontier'
  }

  const gasFees: Record<string, number> = {
    [territories.CAMP_SATOSHI]: 0,
    [territories.MATS_FARMING_BASE]: 1000,
    [territories.MEZO_COMMAND]: 10000,
    [territories.BITCOINFI_FRONTIER]: 20000,
  }

  const fee = gasFees[newTerritory]
  console.log(`Calculated fee for ${newTerritory}: ${fee}`)

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
