import { ButtonInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function handleHelp(interaction: ButtonInteraction) {
  const helpEmbed = new EmbedBuilder()
    .setTitle('Mezo Troopers - Help')
    .setDescription(
      `
        **Commands:**
          - **Attack**: Launch an attack against the Fiat bugs to earn points. Your success and the points you earn depend on your chosen power level and your current territory.
          - **Defend**: Defend your current territory from incoming Fiat bugs. Like attacks, your success depends on your power level and territory.
          - **Wormhole**: Travel to another territory for a fee in points.
          - **MyPoints**: Check your current points, territory, and rank.
          - **howtoplay**: View gameplay instructions and tips.
      `,
    )
    .setColor(0x00ae86)

  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton)
  await interaction.update({
    embeds: [helpEmbed],
    components: [actionRow],
  })
}
