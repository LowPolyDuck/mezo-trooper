import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js'
import { getLabelByCustomId } from '../utilities'
import { goBackButton } from './common/buttons'

export async function handleAttackOptions(interaction: ButtonInteraction) {
    // Defer the interaction update to avoid expiration issues
    if (!interaction.deferred) {
      await interaction.deferUpdate();
    }
  const embed = new EmbedBuilder()
    .setTitle(`Select your BitcoinFi Weapon:`)
    .setDescription('Some weapons are more effective than others, choose wisely!')
    .setColor(0x00ff00)

  const daggerButton = new ButtonBuilder()
    .setCustomId('dagger')
    .setLabel(getLabelByCustomId('dagger'))
    .setEmoji('🦯')
    .setStyle(ButtonStyle.Success)

  const fistButton = new ButtonBuilder()
    .setCustomId('fist')
    .setLabel(getLabelByCustomId('fist'))
    .setEmoji('👊')
    .setStyle(ButtonStyle.Success)

  const blasterButton = new ButtonBuilder()
    .setCustomId('blaster')
    .setLabel(getLabelByCustomId('blaster'))
    .setEmoji('💥')
    .setStyle(ButtonStyle.Success)

  const cannonButton = new ButtonBuilder()
    .setCustomId('cannon')
    .setLabel(getLabelByCustomId('cannon'))
    .setEmoji('🔫')
    .setStyle(ButtonStyle.Success)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    fistButton,
    blasterButton,
    cannonButton,
    daggerButton,
    goBackButton(),
  )

  // Safely update the interaction
  try {
    await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });
  } catch (error) {
    console.error('Error in handleAttackOptions:', error);
    await interaction.followUp({
      content: 'Something went wrong while updating the attack options. Please try again.',
      ephemeral: true,
    });
  }
}