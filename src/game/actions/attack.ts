import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function handleAttackOptions(interaction: ButtonInteraction) {
  const blasterButton = new ButtonBuilder()
    .setCustomId('blaster')
    .setLabel('Bitcoin Blaster')
    .setEmoji('💥')
    .setStyle(ButtonStyle.Primary)

  const cannonButton = new ButtonBuilder()
    .setCustomId('cannon')
    .setLabel('Decentralizer Cannon')
    .setEmoji('💣')
    .setStyle(ButtonStyle.Primary)

  const fistButton = new ButtonBuilder()
    .setCustomId('fist')
    .setLabel('Freedom Fist')
    .setEmoji('👊')
    .setStyle(ButtonStyle.Primary)

  const stickButton = new ButtonBuilder()
    .setCustomId('stick')
    .setLabel('Stick')
    .setEmoji('🦯')
    .setStyle(ButtonStyle.Primary)

  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    blasterButton,
    cannonButton,
    fistButton,
    stickButton,
    goBackButton,
  )

  await interaction.update({
    content: 'Choose your weapon:',
    embeds: [],
    components: [actionRow],
  })
}
