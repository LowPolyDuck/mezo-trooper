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
  const userChoice = interaction.customId; // Save the user’s weapon choice

  const embed = new EmbedBuilder()
    .setTitle(`Select your Power Level:`)
    .setDescription(
      `You picked **${getLabelByCustomId(
        interaction.customId as any as CustomId,
      )}**. Remember, more Power equals higher risk, but more reward!`,
    )
    .setColor(0xff494a)
    .addFields({ name: 'Weapon Choice', value: userChoice, inline: true }); // Add the choice as a hidden field



  const risk1 = new ButtonBuilder()
  .setCustomId('1')
  .setLabel('Safe 1x')
  .setEmoji('😐')
  .setStyle(ButtonStyle.Secondary)

  const risk2 = new ButtonBuilder()
  .setCustomId('5')
  .setLabel('Risky 5x')
  .setEmoji('🤔')
  .setStyle(ButtonStyle.Primary)

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
  const selectedPowerLevel = parseInt(interaction.customId);

  // Retrieve the userChoice from the embed field
  const userChoiceField = interaction.message.embeds[0]?.fields.find(field => field.name === 'Weapon Choice');
  const userChoice = userChoiceField ? userChoiceField.value : undefined;

  if (!userChoice) {
    console.error("Error: 'userChoice' is undefined. Check if it's properly set in handlePowerLevelOptions.");
    await interaction.reply({ content: "An error occurred. Please try again.", ephemeral: true });
    return;
  }

  await handleCombatCommand(interaction, 'attack', userChoice, selectedPowerLevel, cooldowns);
}
