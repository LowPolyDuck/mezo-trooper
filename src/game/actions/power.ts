import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js'
import { handleCombatCommand } from './combat'
import { CustomId, getLabelByCustomId } from '../utilities'
import { goBackButton } from './common/buttons'

export async function handlePowerLevelOptions(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle(`Select your Power Level:`)
    .setDescription(
      `You picked **${getLabelByCustomId(
        interaction.customId as any as CustomId,
      )}**. Remember, more Power equals higher risk, but more reward!`,
    )
    .setColor(0xff494a)

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
  // Store the userChoice in the content message so it can be retrieved later
  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}

export async function handlePowerLevelSelection(
  interaction: ButtonInteraction,
  cooldowns: Map<string, number> = new Map(),
) {
  const selectedPowerLevel = parseInt(interaction.customId)
  const userChoice = interaction.message.content.split(' ')[2]
  await handleCombatCommand(interaction, 'attack', userChoice, selectedPowerLevel, cooldowns)
}
