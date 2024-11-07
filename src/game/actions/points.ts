import { ButtonInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'
import { getTrooper } from '../../provider/mongodb'

export async function handlePoints(interaction: ButtonInteraction) {
  const userId = interaction.user.id
  const trooper = await getTrooper(userId)

  if (!trooper) {
    await interaction.reply({ content: "It seems you haven't started your journey yet!", ephemeral: true })
    return
  }

  const avatarUrl = interaction.user.displayAvatarURL()

  const pointsEmbed = new EmbedBuilder()
    .setTitle('Your Mezo Trooper Points')
    .setDescription(
      `
        **Points:** ${trooper.points}
        **Current Territory:** ${trooper.currentTerritory}
      `,
    )
    .setThumbnail(avatarUrl)
    .setColor(0xffd700)
  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton)
  await interaction.update({
    embeds: [pointsEmbed],
    components: [actionRow],
  })
}
