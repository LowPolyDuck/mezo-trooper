import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function handleDefendOptions(interaction: ButtonInteraction) {
  const buildWallButton = new ButtonBuilder()
    .setCustomId('build_wall')
    .setLabel('Build Wall')
    .setEmoji('🧱')
    .setStyle(ButtonStyle.Primary)

  const setTrapButton = new ButtonBuilder()
    .setCustomId('set_trap')
    .setLabel('Set Trap')
    .setEmoji('🪤')
    .setStyle(ButtonStyle.Primary)

  const supplyRunButton = new ButtonBuilder()
    .setCustomId('supply_run')
    .setLabel('Supply Run')
    .setEmoji('🏃🏻‍♂️')
    .setStyle(ButtonStyle.Primary)

  const snackingButton = new ButtonBuilder()
    .setCustomId('snacking')
    .setLabel('Snacking')
    .setEmoji('🍿')
    .setStyle(ButtonStyle.Primary)

  const goBackButton = new ButtonBuilder().setCustomId('go_back').setLabel('Go Back').setStyle(ButtonStyle.Secondary)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buildWallButton,
    setTrapButton,
    supplyRunButton,
    snackingButton,
    goBackButton,
  )

  await interaction.update({
    content: 'Choose your defense option:',
    embeds: [],
    components: [actionRow],
  })
}
