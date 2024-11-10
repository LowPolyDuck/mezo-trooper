import { ButtonInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function handleHelp(interaction: ButtonInteraction) {
  const helpEmbed = new EmbedBuilder()
    .setTitle('Mezo Troopers - Help')
    .setDescription(
      `Welcome to the Mezo Troopers game! Here's a quick guide:\n\n` +
        `**Gameplay:**\n` +
        `- **Attack:** Engage the fiat bugs to earn points.\n` +
        `- **Defend:** Fortify your current territory.\n` +
        `- **Wormhole:** Travel to different territories.\n\n` +
        `**Territories:**\n` +
        `- **Camp Satoshi:** Moderate rewards, low risk.\n` +
        `- **Mats Farming Base:** Intermediate zone for higher rewards.\n` +
        `- **Mezo Command:** High-risk zone with greater rewards.\n` +
        `- **BitcoinFi Frontier:** Ultimate zone with maximum points, high risk.\n\n` +
        `**Pro Tips:**\n` +
        `- Start in lower-risk areas to understand the mechanics.\n` +
        `- Keep an eye on the leaderboard to track your rank!\n\n` +
        `Good luck, trooper!`,
    )
    .setColor(0x00ae86)

  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton)
  await interaction.update({
    embeds: [helpEmbed],
    components: [actionRow],
  })
}
