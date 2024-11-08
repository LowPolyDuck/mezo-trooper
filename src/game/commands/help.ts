import { ButtonInteraction, CommandInteraction } from 'discord.js'

export async function handleHelpCommand(interaction: CommandInteraction | ButtonInteraction) {
  interaction.reply({
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
  })
}
