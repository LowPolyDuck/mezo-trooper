import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Partials,
  CommandInteraction,
  userMention,
  bold,
  time,
  TextChannel,
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  ButtonInteraction,
  StringSelectMenuBuilder, 
  StringSelectMenuInteraction
} from 'discord.js'
import { SetUpDiscord } from './discord'
import { TOKEN, BOT_CHANNEL_ID, LEADERBOARD_CHANNEL_ID, MESSAGE_ID } from './config/config'
import {
  getLeaderBoard,
  insertOrUpdatePlayer,
  updateAndFetchRanks,
  getTrooper,
  // updatePlayerTerritory,
} from './provider/mongodb'
import { Trooper, Outcome } from './types/index'
import { pointsManager } from './dripApi/pointsManager';  // Adding DripApi functionality from example

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.User, Partials.Message],
})

const cooldowns: Map<string, number> = new Map()

// Constants for mats awards
const MATS_AWARDS = [1000, 500, 200];
let roundEndTime: Date = getNextRoundEndTime();
const pastLeaderboards: Array<{ date: string, leaderboard: string }> = [];


// All Weapon options to choose from
const weaponOptions = ['Blaster', 'Cannon', 'Fist', 'Stick']
const defenceOptions = ['BuildWall', 'SetTrap', 'SupplyRun', 'Snacking']
const quotes = [
  "Everybody Fights, No One Quits. If You Don't Do Your Job, I'll Kill You Myself.",
  "Stay true to Bitcoin or become obsolete.",
  "The only thing that kills Fiat is Mezo Troopers!",
  'Every Trooper protects Bitcoin like their own private key.',
  'Is decentralization your destiny, Trooper?',
  'Come On, You Mezo Apes, You Wanna Live Forever?',
  'The Only Good Fiat Bug Is A Dead Fiat Bug.',
]

// ################################################# Start the Bot #################################################
export async function Run(): Promise<void> {
  try {
    console.log('Running Bot')

    discordClient.once('ready', () => {
      console.log(`Logged in as ${discordClient.user?.tag}`);
    
      // Schedule leaderboard updates every minute to dynamically update time
      setInterval(async () => {
        await updateLeaderboardMessage(discordClient);
      }, 60 * 1000); // Update every 1 minute
    });

    discordClient.on('debug', (info) => {
      console.log('Info', info)
    })

    discordClient.on('warn', (warning) => {
      console.warn(warning)
    })

    discordClient.on('error', (error) => {
      console.error('Discord client error:', error)
    })

    discordClient.on('interactionCreate', async (interaction) => {
      if (interaction.isCommand() && interaction.guildId) {
        const { commandName } = interaction

        if (interaction.channelId !== BOT_CHANNEL_ID) return;


      switch (commandName) {
        case 'mezo_trooper':
            await handleMezoTrooperCommand(interaction);
            break;
        case 'help':
          await interaction.reply({
            content: `
          **Commands:**
          \n- \`/attack\`: Launch an attack against the Fiat bugs to earn points. Your success and the points you earn depend on your chosen power level and your current territory.
          \n-  \`/defend\`: Defend your current territory from incoming Fiat bugs. Like attacks, your success depends on your power level and territory.
          \n-  \`/leaderboard\`: Displays the top Mezo Troopers, their points, and territories.
          \n-  \`/wormhole\`: Travel to another territory for a fee in points.
          \n- \`/points\`: Check your current points, territory, and rank.
          \n-  \`/howtoplay\`: View gameplay instructions and tips.`,
            ephemeral: true,
          })
          break
        case 'howtoplay':
          await interaction.reply({
            content: `
          **How to play:**
          \nWelcome to Mezo Troopers!
          \nIn a universe where Fiat money battles for supremacy against decentralized coins and tokens, you are a Mezo Trooper, your mission is to protect Bitcoin from the invasion of fiat bugs and centralized systems, preserving Bitcoin’s decentralized future.
          \n**Territories Explained:**
          \n- **Satoshi’s Camp**: Training zone with moderate rewards and minimal risk.
          \n- **Yield Farming Base**: Intermediate zone with higher rewards for defending BitcoinFi.
          \n- **Lending Command**: High-risk zone linked to BitcoinFi lending activities. Losing here costs all points and results in a territory drop.
          \n- **Experimental Frontier**: The ultimate zone for testing BitcoinFi assets against Fiat bugs. Maximum points on offer, but losses will send you back to a lower territory.
          \n\n**Moving Between Territories:**
          \n- Use \`/wormhole\` to travel between territories. Each move requires paying gas fees in points, with higher territories costing more (Satoshi’s Camp: 0, Yield Farming Base: 1000, Lending Command: 10000, Experimental Frontier: 100000).
          \n- Success in a higher territory earns you more points, but failure could mean falling back to a lower territory or losing all of your points.
          \n\n**Gameplay Tips:**
          \n- Start in Satoshi’s Camp to get the hang of the game with lower risk.
          \n- Consider the risk vs. reward of moving to a higher territory. Higher territories offer more points but come with a greater risk of falling back.
          \n- Keep an eye on the leaderboard to see how you stack up against other players.
          \n- Join the battle, protect the blockchain, and may the best Trooper win!`,
            ephemeral: true,
          });
          break;
          
        // case 'attack':
        // case 'defend':
        //   await handleCombatCommand(interaction, commandName)
        //   break
        case 'leaderboard':
          await handleLeaderboardCommand(interaction)
          break;
        case 'points':
          await handlePointsCommand(interaction)
          break;
        // case 'wormhole':
        //   await handleWormholeCommand(interaction)
        //   break
        default:
          await interaction.reply({
            content: 'Unknown command. Use `/help` to see all commands.',
            ephemeral: true,
          });
          break;
      }
      // Update the leaderboard in the leaderboard channel
      await updateLeaderboardMessage(discordClient)
    }
  
      // Button interaction handler
      if (interaction.isButton()) {
        switch (interaction.customId) {
          case 'attack':
            await handleAttackOptions(interaction);
            break;
          case 'defend':
            await handleDefendOptions(interaction);
            break;
          case 'wormhole':
            await handleWormholeOptions(interaction);
            break;
          case 'blaster':
          case 'cannon':
          case 'fist':
          case 'stick':
            // await handleCombatCommand(interaction, 'attack', interaction.customId, 1);
            // break;
            // Store the selected weapon and move to power level selection
            await handlePowerLevelOptions(interaction, interaction.customId);
            break;
          case 'build_wall':
          case 'set_trap':
          case 'supply_run':
          case 'snacking':
            
            // Store the selected weapon and move to power level selection
            await handlePowerLevelOptions(interaction, interaction.customId);
            break;
          // Add similar cases for wormhole destinations if needed
        }
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'power_level_select') {
          // Call handlePowerLevelSelection with the selected power level and stored weapon choice
          const selectedPowerLevel = parseInt(interaction.values[0]);
          const userChoice = interaction.message.content.split(' ')[2]; // Retrieve weapon from message content
          await handlePowerLevelSelection(interaction, userChoice, selectedPowerLevel);
        }
      }
    });

    

    await SetUpDiscord(discordClient, TOKEN)
    console.log(`Bot status: ${discordClient.user?.presence?.status}`)
  } catch (error) {
    console.error('Error during bot execution:', error)
  }
}


// ################################################# Mezo Trooper Command #################################################
async function handleMezoTrooperCommand(interaction: CommandInteraction) {
  const attackButton = new ButtonBuilder()
    .setCustomId('attack')
    .setLabel('Attack')
    .setEmoji('🔫') // Pistol emoji
    .setStyle(ButtonStyle.Primary);

  const defendButton = new ButtonBuilder()
    .setCustomId('defend')
    .setLabel('Defend')
    .setEmoji('🛡️') // Shield emoji
    .setStyle(ButtonStyle.Success);

  const wormholeButton = new ButtonBuilder()
    .setCustomId('wormhole')
    .setLabel('Wormhole')
    .setStyle(ButtonStyle.Secondary);

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    attackButton,
    defendButton,
    wormholeButton
  );

  await interaction.reply({
    content: 'Soilder stalling is not allowed, what are you going to do?!:',
    components: [actionRow],
  });
}

// ################################################# Attack/Defense Options #################################################
async function handleAttackOptions(interaction: ButtonInteraction) {
  const blasterButton = new ButtonBuilder()
    .setCustomId('blaster')
    .setLabel('Bitcoin Blaster')
    .setEmoji('💥') 
    .setStyle(ButtonStyle.Primary);

  const cannonButton = new ButtonBuilder()
    .setCustomId('cannon')
    .setLabel('Decentralizer Cannon')
    .setEmoji('💣') 
    .setStyle(ButtonStyle.Primary);

  const fistButton = new ButtonBuilder()
    .setCustomId('fist')
    .setLabel('Freedom Fist')
    .setEmoji('👊')
    .setStyle(ButtonStyle.Primary);

  const stickButton = new ButtonBuilder()
    .setCustomId('stick')
    .setLabel('Stick')
    .setEmoji('🦯')
    .setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    blasterButton,
    cannonButton,
    fistButton,
    stickButton
  );

  await interaction.update({
    content: 'Choose your weapon:',
    components: [actionRow],
  });
}

async function handleDefendOptions(interaction: ButtonInteraction) {
  const buildWallButton = new ButtonBuilder()
    .setCustomId('build_wall')
    .setLabel('Build Wall')
    .setEmoji('🧱')
    .setStyle(ButtonStyle.Primary);

  const setTrapButton = new ButtonBuilder()
    .setCustomId('set_trap')
    .setLabel('Set Trap')
    .setEmoji('🪤')
    .setStyle(ButtonStyle.Primary);

  const supplyRunButton = new ButtonBuilder()
    .setCustomId('supply_run')
    .setLabel('Supply Run')
    .setEmoji('🏃🏻‍♂️')
    .setStyle(ButtonStyle.Primary);

  const snackingButton = new ButtonBuilder()
    .setCustomId('snacking')
    .setLabel('Snacking')
    .setEmoji('🍿')
    .setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buildWallButton,
    setTrapButton,
    supplyRunButton,
    snackingButton
  );

  await interaction.update({
    content: 'Choose your defense option:',
    components: [actionRow],
  });
}

// ################################################# Power Level Options #################################################
async function handlePowerLevelOptions(interaction: ButtonInteraction, userChoice: string) {
  const powerLevelSelect = new StringSelectMenuBuilder()
    .setCustomId('power_level_select')
    .setPlaceholder('Choose Power Level')
    .addOptions([
      { label: '1x', value: '1' },
      { label: '5x', value: '5' },
      { label: '10x', value: '10' },
      { label: '100x', value: '100' },
    ]);

  const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(powerLevelSelect);

  // Store the userChoice in the content message so it can be retrieved later
  await interaction.update({
    content: `You chose ${userChoice}. Now, select your power level:`,
    components: [actionRow],
  });
}

// ################################################# Handle Power Level Selection #################################################
async function handlePowerLevelSelection(
  interaction: StringSelectMenuInteraction,
  userChoice: string,
  selectedPowerLevel: number
) {
  // Call handleCombatCommand to execute the main combat logic
  await handleCombatCommand(interaction, 'attack', userChoice, selectedPowerLevel);
}

// ################################################# Attack/Defense Logic #################################################
async function handleCombatCommand(
  interaction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction,
  commandName: string,
  userChoice: string,
  powerLevel: number
) {

  // Immediately defer the reply to buy time for processing ## Good to know
  await interaction.deferReply()
  const userId = interaction.user.id

  // Cooldown logic for all commands
  const lastCommandTime = cooldowns.get(userId) || 0
  const now = Date.now()
  const timeLeft = now - lastCommandTime
  const isOnCooldown = timeLeft < 0

  if (isOnCooldown) {
    const waitUntil = addMillisecondsToDate(new Date(now), timeLeft)
    await interaction.editReply(`You are on cooldown. Try again later. Wait ${time(waitUntil, 'R')}`)
    return
  }

  // Game logic
  // Fetch the current trooper's status, including territory
  const trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: 'Satoshi’s Camp',
  }
  // const powerLevel = (interaction.options.get('power-level')?.value as number) || 1
  // const userChoice = (interaction.options.get('choose_action')?.value as string) || 'Blaster'
  // console.log(userChoice)
  // const powerLevel = 1 
  // Special outcomes for "Stick" or "Snacking"
  if (interaction.isButton() && (userChoice === 'Stick' || userChoice === 'Snacking')) {
    await handleSpecialOutcome(interaction, userChoice, trooper, userId);
    return; // Exit the function early for special cases
  }

  // Determine if the selected weapon is boosted
  const boosted = randomBoostedItem()
  console.log('boosted item:')
  console.log(boosted)
  const isBoosted = userChoice === boosted

  // Adjusting success chance and points change based on the territory and power level
  const successChance = getSuccessChance(powerLevel, trooper.currentTerritory)
  const isSuccessful = Math.random() < successChance
  let pointsChange = isSuccessful ? calculatePoints(powerLevel, trooper.currentTerritory) : 0
  if (isBoosted) pointsChange *= 5 // 5 times the points for boosted weapon

  let messageContent = ''
  let gifUrl = ''

  if (isSuccessful) {
    trooper.points += pointsChange
    console.log(commandName)
    messageContent = `Your ${commandName === 'attack' ? 'attack' : 'defence'} was ${bold(
      'successful',
    )}, you earned ${bold(pointsChange + ' points')}.\nNew total: ${bold(trooper.points.toString())} points.`

    // Transfer mats based on the pointsChange (Example usage of mats distribution for commands)
    // const matsToTransfer = Math.floor(pointsChange * 0.1); // Example calculation 10% of points earned the player receives in mats 
    // await pointsManager.addPoints(interaction.user.id, matsToTransfer);

    // messageContent += `\nYou also earned ${matsToTransfer} mats!`;

    if (isBoosted) {
      const boosts = ['airdrop', 'teamwork', 'grenade']
      const randomIndex = Math.floor(Math.random() * boosts.length)
      const boost = boosts[randomIndex]

      switch (boost) {
        case 'airdrop':
          messageContent = `\nThe latest sharding BitcoinFi Assault Rifle was airdropped 🪂 from Mezo, Fiat hive was ${bold(
            'OBLITERATED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl =
            'https://media1.tenor.com/m/C0vINUKPPtUAAAAC/dizzy-flores-isabel-flores-isabelle-flores-dina-meyer-starship-troopers.gif'
          break
        case 'grenade':
          messageContent = `\nTactical Mezo Decentralization Grenade Deployed, Fiat hive was ${bold(
            'NUKED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl = 'https://i.gifer.com/IcYx.gif'
          break
        default:
        case 'teamwork': {
          messageContent = `\n Squad ${bold('Mezo G6')} joins your postion, Fiat hive was ${bold(
            'DESTROYED',
          )}!\n You earned ${bold(pointsChange + ' points')}, Hurray! \nNew total: ${bold(
            trooper.points.toString(),
          )} points.`
          gifUrl = 'https://c.tenor.com/41agPzUN8gAAAAAd/tenor.gif'
          break
        }
      }
    }
  } else {
    // If user dies, handle defeat based on their current territory
    if (trooper.currentTerritory !== 'Satoshi’s Camp') {
      trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
      trooper.points = 0 // Reset points to 0
      messageContent = `You have been ${bold(
        'DEFEATED',
      )} and lost all your points. 💀💀💀 \nBitcoinFi recovery ship deployed, falling back to the ${bold(
        trooper.currentTerritory,
      )} territory.`
      gifUrl = 'https://media1.tenor.com/m/0uCuBpDbYVYAAAAd/dizzy-death.gif'
    } else {
      trooper.points = 0 // Lose all points in Satoshi’s Camp as well
      //Different message when you die in the Satoshi’s Camp realm
      messageContent = ` You were ${bold('DEFEATED')} and lost all your points! 💀💀💀`
      gifUrl = 'https://media1.tenor.com/m/iWJOxKk1s84AAAAd/bug-attack-starship-troopers.gif'

      messageContent += getQuote()
    }

    cooldowns.set(userId, Date.now() + 1000) // Apply 4-hour cooldown 4 * 60 * 60 * 1000
  }

  function getQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return `\n\n${quotes[randomIndex]}\n`
  }

  // Update player data
  await insertOrUpdatePlayer(trooper)

  // Construct and send the reply
  // const commandNameCapitalized = interaction.commandName.charAt(0).toUpperCase() + interaction.commandName.slice(1)
  const embed = new EmbedBuilder().setDescription(messageContent)

  // Conditionally add an image if the URL is not empty
  if (gifUrl !== '') {
    console.log(gifUrl)
    embed.setImage(gifUrl)
  }

  await interaction.editReply({ embeds: [embed] })
}

// ################################################# Special Outcome Logic #################################################
async function handleSpecialOutcome(
  interaction: ButtonInteraction, // Accept both types
  userChoice: string,
  trooper: Trooper,
  userId: string
) {
  const outcomes: Record<string, Outcome> = {
    Stick: {
      message: `A stick? where's your ${bold('Mezo')} BitcoinFi-Assault Rifle trooper? you ${bold('DIED')}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/pvgQeEnepkQAAAAd/killer-bugs-starship-troopers.gif', // Replace with actual URL
    },
    Snacking: {
      message: `Eating soldier? ${bold(
        'Mezo',
      )} troopers run on adrenline & decentralized weaponry only. Fiat bugs ambush you, you ${bold(
        'DIED',
      )}. 💀💀💀`,
      gifUrl: 'https://media1.tenor.com/m/e-Ngztd2-lYAAAAC/starship-troopers-burn.gif',
    },
  }

  if (!(userChoice in outcomes)) {
    console.error(`Invalid userChoice: ${userChoice}`)
    return // Or handle this case appropriately
  }

  const outcome = outcomes[userChoice]

  trooper.points = 0
  if (trooper.currentTerritory !== 'Satoshi’s Camp') {
    trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
    cooldowns.set(userId, Date.now() + 1000) // 4-hour cooldown
  } else {
    cooldowns.set(userId, Date.now() + 1000) // 4-hour cooldown in Satoshi’s Camp as well
  }

  await insertOrUpdatePlayer(trooper) // Update player data

  // embed with special outcome message and GIF
  const specialOutcomeEmbed = new EmbedBuilder()
    .setTitle("You're the worst Mezo Trooper ever!") //
    .setDescription(outcome.message)
    .setImage(outcome.gifUrl)

  await interaction.followUp({ embeds: [specialOutcomeEmbed] })
}

// ################################################# Leaderboard command Mats #################################################
async function handleLeaderboardCommand(interaction: CommandInteraction) {
  try {
    await interaction.deferReply();
    const rankedPlayers = await updateAndFetchRanks();
    const roundEndTimestamp = Math.floor(roundEndTime.getTime() / 1000); // Unix timestamp for countdown
    let leaderboardMessage = `Leaderboard:\nTime until next round: <t:${roundEndTimestamp}:R>\n`;
    for (const [index, player] of rankedPlayers.slice(0, 10).entries()) {
      try {
        const userBalance = await pointsManager.getBalance(player.userId);
        leaderboardMessage += `${index + 1}. Mezo Trooper <@${player.userId}> - Points: ${player.points}  \n`;
        
        // Add mats awards for top 3 players
        if (index < MATS_AWARDS.length) {
          leaderboardMessage += `    🏆 Reward: ${MATS_AWARDS[index]} mats if position holds 🏆\n`;
        }
      } catch (error) {
        leaderboardMessage += `${index + 1}. Mezo Trooper <@${player.userId}> - Points: ${player.points}\n`;
      }
    }
    await interaction.editReply(leaderboardMessage);
  } catch (error) {
    console.error('Error handling leaderboard command:', error);
    await interaction
      .followUp({
        content: 'There was an error processing the leaderboard command.',
        ephemeral: true,
      })
      .catch(console.error);
  }
}




// ################################################# Leaderboard command old #################################################
// async function handleLeaderboardCommand(interaction: CommandInteraction) {
//   try {
//     await interaction.deferReply()
//     const rankedPlayers = await updateAndFetchRanks()
//     let leaderboardMessage = 'Leaderboard:\n'
//     for (const [index, player] of rankedPlayers.slice(0, 10).entries()) {
//       // Top 10 players
//       try {
//         const user = await interaction.client.users.fetch(player.userId) // Fetch user object
//         leaderboardMessage += `${index + 1}. Mezo Trooper <@${player.userId}> - Points: ${player.points}\n`
//       } catch {
//         // If there's an issue fetching the user (e.g., user not found), fallback to showing the ID
//         leaderboardMessage += `${index + 1}. User ID: ${player.userId} - Points: ${player.points}\n`
//       }
//     }
//     // Use editReply because we used deferReply initially (deferReply to give time to process command)
//     await interaction.editReply(leaderboardMessage)
//   } catch (error) {
//     console.error('Error handling leaderboard command:', error)
//     //Error Handling
//     await interaction
//       .followUp({
//         content: 'There was an error processing the leaderboard command.',
//         ephemeral: true,
//       })
//       .catch(console.error)
//   }
// }

// ################################################# Leaderboard Channel Update Logic #################################################
async function updateLeaderboardMessage(client: Client) {
  const leaderboard = await getLeaderBoard()
  const roundEndTimestamp = Math.floor(roundEndTime.getTime() / 1000); // Unix timestamp for countdown

  if (!leaderboard) {
    console.log('No leaderboard data available.')
    return
  }

  // const timeRemainingString = getTimeRemainingString();
  const leaderboardStrings = await Promise.all(
    leaderboard.map(async (entry, index) => {
      // const userBalance = await pointsManager.getBalance(entry.userId); // In case you want to show mats here uncomment this
      let leaderboardEntry = `#${index + 1}. ${userMention(entry.userId)}: ${entry.points} points, current territory: ${entry.currentTerritory} `;
      
      // Add mats awards for top 3 players
      if (index < MATS_AWARDS.length) {
        leaderboardEntry += `    🏆 Reward: ${MATS_AWARDS[index]} mats if position holds 🏆`;
      }
      
      return leaderboardEntry;
    })
  );

  const leaderboardMessage = `**Mezo Trooper - Leaderboard**\nTime until next round: <t:${roundEndTimestamp}:R>\n${leaderboardStrings.join('\n')}`;
 
  const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);

  if (channel?.isTextBased()) {
    const textChannel = channel as TextChannel;

    try {
      // Try to fetch the existing leaderboard message
      const message = await textChannel.messages.fetch(MESSAGE_ID);
      // If found, edit the existing message
      await message.edit(`\n${leaderboardMessage}`);
    } catch (error) {
      // If the message is not found or another error occurs, send a new message
      console.log('Existing leaderboard message not found. Sending a new message.');
      await textChannel.send(`\n${leaderboardMessage}`);
    }
  } else {
    console.log('Leaderboard channel is not text-based or could not be found.');
  }
}

// ################################################# Wormhole Options #################################################
async function handleWormholeOptions(interaction: ButtonInteraction) {
  const options = ['Satoshi’s Camp', 'Yield Farming Base', 'Lending Command', 'Experimental Frontier'];
  const buttons = options.map((option, index) =>
    new ButtonBuilder()
      .setCustomId(option.toLowerCase().replace(/ /g, '_'))
      .setLabel(option)
      .setStyle(ButtonStyle.Primary)
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

  await interaction.update({
    content: 'Choose your wormhole destination:',
    components: [actionRow],
  });
}

// ################################################# Wormhole Logic #################################################
async function handleWormholeCommand(interaction: CommandInteraction) {
  await interaction.deferReply()
  const userId = interaction.user.id
  const newTerritory = interaction.options.get('destination')?.value as string
  const trooper: Trooper = (await getTrooper(userId)) || {
    userId,
    points: 0,
    currentTerritory: 'Satoshi’s Camp',
  } // Assuming getTrooper returns a trooper object

  const updateSuccessful = await updatePlayerTerritory(userId, trooper.points, newTerritory)

  // Define a GIF URL to include in the reply
  const wormholeGifUrl = 'https://media1.tenor.com/m/mny-6-XqV1kAAAAd/wormhole.gif' // Replace with your actual GIF URL

  if (updateSuccessful) {
    const embed = new EmbedBuilder()
      .setTitle(`Wormhole Travel to ${newTerritory}!`)
      .setDescription(`You have successfully traveled to ${bold(newTerritory)}, gas fees deducted.`)
      .setImage(wormholeGifUrl) // Include the GIF in the embed

    await interaction.editReply({ embeds: [embed] })
  } else {
    await interaction.editReply(`You do not have enough points to travel to ${bold(newTerritory)}.`)
  }
}

// ################################################# Update Territory #################################################
async function updatePlayerTerritory(userId: string, currentPoints: number, newTerritory: string) {
  // Gas fees to switch territories:
  const gasFees: { [key: string]: number } = {
    "Satoshi's Camp": 0,
    "Yield Farming Base": 1000,
    "NetworkNode": 5000,
    "Mainframe": 10000,
  };
  const fee = gasFees[newTerritory] // Now TypeScript knows newTerritory is a valid key
  console.log(newTerritory)
  console.log(gasFees)
  if (currentPoints >= fee) {
    await insertOrUpdatePlayer({
      userId,
      points: currentPoints - fee,
      currentTerritory: newTerritory,
    })
    return true // Territory update was successful
  } else {
    return false // Not enough points for the territory change
  }
}

// ################################################# Points Command Logic #################################################
async function handlePointsCommand(interaction: CommandInteraction) {
  await interaction.deferReply();
  const userId = interaction.user.id;
  const trooper = await getTrooper(userId);
  const timeRemainingString = getTimeRemainingString();

  if (!trooper) {
    await interaction.editReply("It seems you haven't started your journey yet!");
    return;
  }

  const replyMessage = `**Your Mezo Trooper:**\n- Points: ${trooper.points}\n- Current Territory: ${trooper.currentTerritory}\n- Time until next round: ${timeRemainingString}`;
  await interaction.editReply(replyMessage);
}


Run()

// ################################################# Helper functions #################################################

function addMillisecondsToDate(inputDate: Date, millisecondsToAdd: number): Date {
  const currentTimestamp = inputDate.getTime() // Get the current timestamp in milliseconds
  const newTimestamp = currentTimestamp + millisecondsToAdd // Add the desired milliseconds
  const newDate = new Date(newTimestamp) // Create a new Date object with the updated timestamp
  return newDate
}

//Defeat function TODO: implement when ready!
function handleDefeat(trooper: Trooper, userId: string) {
  // Reset points and set cooldown
  trooper.points = 0
  cooldowns.set(userId, Date.now() + 1000) // 4 hours cooldown <- changing cooldown TODO: what would be a good timeframe?

  // Downgrade territory if applicable
  trooper.currentTerritory = getFallbackTerritory(trooper.currentTerritory)
}

function randomBoostedItem() {
  const allOptions = [...weaponOptions, ...defenceOptions] // Include "Snacking" if it's a defense option
  const randomIndex = Math.floor(Math.random() * allOptions.length)
  return allOptions[randomIndex]
}

// Logic to determine the fallback territory if a user "dies"
function getFallbackTerritory(currentTerritory: string): string {
  const territoryOrder = ['Satoshi’s Camp', 'Yield Farming Base', 'Lending Command', 'Experimental Frontier']
  const currentIndex = territoryOrder.indexOf(currentTerritory)
  return currentIndex > 0 ? territoryOrder[currentIndex - 1] : 'Satoshi’s Camp'
}

// Calculates the success change with the choosen powerLevel
function getSuccessChance(powerLevel: number, territory: string): number {
  let successChance: number
  switch (territory) {
    case 'Satoshi’s Camp':
      successChance = powerLevel === 100 ? 0.5 : powerLevel === 10 ? 0.75 : 0.95
      break
    case 'Yield Farming Base':
      successChance = powerLevel === 100 ? 0.45 : powerLevel === 10 ? 0.7 : 0.9
      break
    case 'Lending Command':
      successChance = powerLevel === 100 ? 0.4 : powerLevel === 10 ? 0.65 : 0.85
      break
    case 'Experimental Frontier':
      successChance = powerLevel === 100 ? 0.3 : powerLevel === 10 ? 0.5 : 0.8
      break
    default:
      successChance = 0.95
  }
  return successChance
}

function calculatePoints(powerLevel: number, territory: string): number {
  let basePoints: number;

  // Set base points based on territory
  switch (territory) {
    case 'Satoshi’s Camp':
      basePoints = 100;
      break;
    case 'Yield Farming Base':
      basePoints = 300;
      break;
    case 'Lending Command':
      basePoints = 600;
      break;
    case 'Experimental Frontier':
      basePoints = 1200;
      break;
    default:
      basePoints = 100; // Default for unlisted territories
  }

  // Scale points based on power level
  switch (powerLevel) {
    case 1:
      return basePoints; // 1x
    case 5:
      return basePoints * 2; // 5x (200% of base points)
    case 10:
      return basePoints * 4; // 10x (400% of base points)
    case 100:
      return basePoints * 10; // Maximum level (1000% of base points)
    default:
      return basePoints; // Default to base if unknown level
  }
}

function getNextRoundEndTime(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  now.setUTCDate(now.getUTCDate() + 1); // Next UTC midnight
  return now;
}

// Schedule game reset every 24 hours at midnight UTC
setInterval(async () => {
  await endRound();
  roundEndTime = getNextRoundEndTime(); // Reset round timer
}, 24 * 60 * 60 * 1000); // 24 hours in milliseconds


// Helper function to calculate time remaining as a string
function getTimeRemainingString(): string {
  const now = new Date();
  const timeRemaining = Math.max(roundEndTime.getTime() - now.getTime(), 0);
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hours, ${minutes} minutes`;
}

async function endRound() {
  // Placeholder function to handle end of round operations
  console.log('Round ended, awarding mats...');
  const leaderboard = await getLeaderBoard();
  if (leaderboard.length > 0) {
    const topPlayers = leaderboard.slice(0, 3);
    for (const [index, player] of topPlayers.entries()) {
      await pointsManager.addPoints(player.userId, MATS_AWARDS[index]);
    }
    // Store past leaderboard
    pastLeaderboards.unshift({
      date: new Date().toISOString(),
      leaderboard: leaderboard.map((entry, index) => `#${index + 1} ${userMention(entry.userId)} - ${entry.points} points`).join('\n')
    });
    if (pastLeaderboards.length > 3) pastLeaderboards.pop(); // Keep only last 3 days
  }
}
