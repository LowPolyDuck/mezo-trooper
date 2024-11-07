import { ActionRowBuilder, bold, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js'
import { getTrooper, insertOrUpdatePlayer } from '../../provider/mongodb'
import { Trooper } from '../../types'

export async function handleWormholeOptions(interaction: ButtonInteraction) {
  const options = [
    { label: 'Satoshi’s Camp', value: 'Satoshi’s Camp' },
    { label: 'Yield Farming Base', value: 'Yield Farming Base' },
    { label: 'Lending Command', value: 'Lending Command' },
    { label: 'Experimental Frontier', value: 'Experimental Frontier' },
  ]

  const buttons = options.map((option) =>
    new ButtonBuilder()
      .setCustomId(`wormhole_${option.value.toLowerCase().replace(/ /g, '_')}`)
      .setLabel(option.label)
      .setStyle(ButtonStyle.Primary),
  )

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)

  await interaction.update({
    content: 'Choose your wormhole destination:',
    embeds: [],
    components: [actionRow],
  })
}

export async function handleWormholeCommand(interaction: ButtonInteraction, destination: string) {
  await interaction.deferReply()
  const userId = interaction.user.id

  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: 'Satoshi’s Camp',
  }

  const updateSuccessful = await updatePlayerTerritory(userId, trooper.points, destination)

  // Define a GIF URL to include in the reply
  const wormholeGifUrl = 'https://media1.tenor.com/m/mny-6-XqV1kAAAAd/wormhole.gif'

  if (updateSuccessful) {
    const embed = new EmbedBuilder()
      .setTitle(`Wormhole Travel to ${destination}!`)
      .setDescription(`You have successfully traveled to ${bold(destination)}, gas fees deducted.`)
      .setImage(wormholeGifUrl)

    await interaction.editReply({ embeds: [embed] })
  } else {
    await interaction.editReply(`You do not have enough points to travel to ${bold(destination)}.`)
  }
}

async function updatePlayerTerritory(userId: string, currentPoints: number, newTerritory: string) {
  const gasFees: { [key: string]: number } = {
    "Satoshi's Camp": 0,
    'Yield Farming Base': 1000,
    NetworkNode: 5000,
    Mainframe: 10000,
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
