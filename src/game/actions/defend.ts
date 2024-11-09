import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js'
import { goBackButton } from './common/buttons'

export async function handleDefendOptions(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle(`Select your Mezo Defi Defense:`)
    .setDescription('Some defenses are more effective than others, choose wisely!')
    .setColor(0xff494a)

  const buildWallButton = new ButtonBuilder()
    .setCustomId('build_wall')
    .setLabel('BTCFi Wall')
    .setEmoji('🧱')
    .setStyle(ButtonStyle.Danger)

  const setTrapButton = new ButtonBuilder()
    .setCustomId('set_trap')
    .setLabel('Mezo Trap')
    .setEmoji('🪤')
    .setStyle(ButtonStyle.Danger)

  const supplyRunButton = new ButtonBuilder()
    .setCustomId('supply_run')
    .setLabel('Drip Supplies')
    .setEmoji('🏃🏻‍♂️')
    .setStyle(ButtonStyle.Danger)

  const snackingButton = new ButtonBuilder()
    .setCustomId('snacking')
    .setLabel('Mats Snack')
    .setEmoji('🍿')
    .setStyle(ButtonStyle.Danger)

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buildWallButton,
    setTrapButton,
    supplyRunButton,
    snackingButton,
    goBackButton(),
  )

  await interaction.update({
    embeds: [embed],
    components: [actionRow],
  })
}
