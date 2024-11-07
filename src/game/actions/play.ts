import { ButtonInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function handleHowToPlay(interaction: ButtonInteraction) {
  const howToPlayEmbed = new EmbedBuilder()
    .setTitle('How to Play Mezo Troopers')
    .setDescription(
      `
        Welcome to the Mezo Troopers game! Here's a quick guide:
  
        **Gameplay:**
        - **Attack:** Engage the fiat bugs to earn points.
        - **Defend:** Fortify your current territory.
        - **Wormhole:** Travel to different territories.
  
        **Territories:**
        - **Satoshi’s Camp:** Moderate rewards, low risk.
        - **Yield Farming Base:** Intermediate zone for higher rewards.
        - **Lending Command:** High-risk zone with greater rewards.
        - **Experimental Frontier:** Ultimate zone with maximum points, high risk.
  
        **Pro Tips:**
        - Start in lower-risk areas to understand the mechanics.
        - Keep an eye on the leaderboard to track your rank!
        
        Good luck, trooper!
      `,
    )
    .setColor(0x00ae86)

  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(goBackButton)

  await interaction.update({
    embeds: [howToPlayEmbed],
    components: [actionRow],
  })
}
