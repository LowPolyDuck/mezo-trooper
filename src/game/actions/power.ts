import { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuInteraction } from 'discord.js'
import { handleCombatCommand } from './combat'

export async function handlePowerLevelOptions(interaction: ButtonInteraction, userChoice: string) {
  const powerLevelSelect = new StringSelectMenuBuilder()
    .setCustomId('power_level_select')
    .setPlaceholder('Choose Power Level')
    .addOptions([
      { label: '1x', value: '1' },
      { label: '5x', value: '5' },
      { label: '10x', value: '10' },
      { label: '100x', value: '100' },
    ])

  const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(powerLevelSelect)

  // Store the userChoice in the content message so it can be retrieved later
  await interaction.update({
    content: `You chose ${userChoice}. Now, select your power level:`,
    embeds: [],
    components: [actionRow],
  })
}

export async function handlePowerLevelSelection(
  interaction: StringSelectMenuInteraction,
  cooldowns: Map<string, number> = new Map(),
) {
  const selectedPowerLevel = parseInt(interaction.values[0])
  const userChoice = interaction.message.content.split(' ')[2]
  await handleCombatCommand(interaction, 'attack', userChoice, selectedPowerLevel, cooldowns)
}
