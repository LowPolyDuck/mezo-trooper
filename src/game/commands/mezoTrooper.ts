import {
  CommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js'

export async function handleMezoTrooperCommand(interaction: CommandInteraction | ButtonInteraction) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle('Welcome to Mezo Troopers')
    .setDescription(
      'The battle for BitcoinFi begins, ' +
        'Choose your actions wisely to protect the Mezo ecosystem from the Fiat Bug Empire.',
    )
    .setThumbnail(
      'https://styles.redditmedia.com/t5_2u091/styles/communityIcon_ry3hant7cfq61.jpg?format=pjpg&s=8e91bf21dd61485a8544614621364c320f952602',
    )
    .setColor(0xff494a)

  const attackButton = new ButtonBuilder()
    .setCustomId('attack')
    .setLabel('Attack')
    .setEmoji('🔫')
    .setStyle(ButtonStyle.Danger)

  const defendButton = new ButtonBuilder()
    .setCustomId('defend')
    .setLabel('Defend')
    .setEmoji('🛡️')
    .setStyle(ButtonStyle.Success)

  const wormholeButton = new ButtonBuilder()
    .setCustomId('wormhole')
    .setLabel('Wormhole')
    .setEmoji('🪐')
    .setStyle(ButtonStyle.Primary)

  const helpButton = new ButtonBuilder().setCustomId('help').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary)

  const attackDefendRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    attackButton,
    defendButton,
    wormholeButton,
    helpButton,
  )

  await interaction.reply({
    embeds: [welcomeEmbed],
    content: '',
    components: [attackDefendRow],
  })
}
