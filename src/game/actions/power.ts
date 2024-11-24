import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { handleCombatCommand } from './combat'
import { CustomId, getLabelByCustomId } from '../utilities'
import { goBackButton } from './common/buttons'
import { THUMBNAIL_MAPPING } from '../constants'

export async function handlePowerLevelOptions(interaction: ButtonInteraction) {
  const userChoice = interaction.customId

  if (!interaction.deferred) {
    await interaction.deferUpdate()
  }

  // Get the thumbnail URL for the selected weapon
  const thumbnailUrl = THUMBNAIL_MAPPING[userChoice] || ''

  const embed = new EmbedBuilder()
    .setTitle(`Select your Power Level:`)
    .setDescription(
      `You picked **${getLabelByCustomId(
        interaction.customId as any as CustomId,
      )}**. Remember, more Power equals higher risk, but more reward!`,
    )
    .setColor(0xff494a)
    .addFields({ name: 'Weapon Choice', value: userChoice, inline: true }) // Add the choice as a hidden field
    .setImage(thumbnailUrl)

  const risk1 = new ButtonBuilder().setCustomId('1').setLabel('Safe 1x').setEmoji('😐').setStyle(ButtonStyle.Secondary)
  const risk2 = new ButtonBuilder().setCustomId('5').setLabel('Risky 5x').setEmoji('🤔').setStyle(ButtonStyle.Primary)
  const risk3 = new ButtonBuilder()
    .setCustomId('10')
    .setLabel('Dangerous 10x')
    .setEmoji('😱')
    .setStyle(ButtonStyle.Success)
  const risk4 = new ButtonBuilder()
    .setCustomId('100')
    .setLabel('Insane 100x')
    .setEmoji('💀')
    .setStyle(ButtonStyle.Danger)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(risk1, risk2, risk3, risk4, goBackButton())
  try {
    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    })
  } catch (error) {
    console.error('Error in handlePowerLevelOptions:', error)
    if (!interaction.replied) {
      await interaction.followUp({
        content: 'An error occurred while updating power level options. Please try again.',
        ephemeral: true,
      })
    }
  }
}
export async function handlePowerLevelSelection(
  interaction: ButtonInteraction,
  cooldowns: Map<string, number> = new Map(),
) {
  console.log('--- handlePowerLevelSelection START ---')

  try {
    //console.log('User ID:', interaction.user.id)
    //console.log('Interaction Custom ID:', interaction.customId)
    //console.log('Interaction Message ID:', interaction.message.id)
    //console.log('Interaction Guild ID:', interaction.guildId)

    // Parse the selected power level
    const selectedPowerLevel = parseInt(interaction.customId)
    console.log('Parsed Selected Power Level:', selectedPowerLevel)

    // Retrieve the userChoice from the embed field
    const userChoiceField = interaction.message.embeds[0]?.fields.find((field) => field.name === 'Weapon Choice')
    const userChoice = userChoiceField ? userChoiceField.value : undefined
    console.log('Retrieved User Choice from Embed:', userChoice)

    if (!userChoice) {
      console.error("Error: 'userChoice' is undefined. Check if it's properly set in handlePowerLevelOptions.")
      await interaction.reply({ content: 'An error occurred. Please try again.', ephemeral: true })
      return
    }

    // Log before calling handleCombatCommand
    console.log('Calling handleCombatCommand with parameters:', {
      interaction: interaction.id,
      action: 'attack',
      userChoice,
      selectedPowerLevel,
      cooldowns: Array.from(cooldowns.entries()),
    })

    // Call the combat command
    await handleCombatCommand(interaction, userChoice, selectedPowerLevel, cooldowns)

    console.log('--- handlePowerLevelSelection END ---')
  } catch (error) {
    console.error('Error in handlePowerLevelSelection:', error)
    await interaction.reply({ content: 'An unexpected error occurred. Please contact support.', ephemeral: true })
  }
}
