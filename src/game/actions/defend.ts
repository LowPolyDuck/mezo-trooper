import { ButtonInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js'
import { goBackButton } from './common/buttons'
import { activeGames } from '../constants';

export async function handleDefendOptions(interaction: ButtonInteraction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const userGameKey = `${guildId}-${userId}`;
  const gameStarterId = (activeGames.get(userGameKey) || "") as string;

  // Check if this user is the one who started the game
  if (gameStarterId !== userId) {
    await interaction.reply({
      content: 'Only the user who started the game can interact with it.',
      ephemeral: true,
    });
    return;
  }
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
