import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export function mainMenu(): ActionRowBuilder<ButtonBuilder> {
  const attackButton = new ButtonBuilder()
    .setCustomId('attack')
    .setLabel('Attack')
    .setEmoji('🔫')
    .setStyle(ButtonStyle.Success)

  const defendButton = new ButtonBuilder()
    .setCustomId('defend')
    .setLabel('Defend')
    .setEmoji('🛡️')
    .setStyle(ButtonStyle.Danger)

  const wormholeButton = new ButtonBuilder()
    .setCustomId('wormhole')
    .setLabel('Wormhole')
    .setEmoji('🪐')
    .setStyle(ButtonStyle.Primary)

  const helpButton = new ButtonBuilder().setCustomId('help').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary)

  const mainMenu = new ActionRowBuilder<ButtonBuilder>().addComponents(
    defendButton,
    attackButton,
    wormholeButton,
    helpButton,
  )
  return mainMenu
}

export function goBackButton() {
  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)
  return goBackButton
}

export function continueButton() {
  const continueButton = new ButtonBuilder().setCustomId('continue').setLabel('Continue').setStyle(ButtonStyle.Success)
  return continueButton
}
