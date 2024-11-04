import { REST, Routes } from "discord.js";
import { CLIENT_ID, GUILD_ID, TOKEN } from "./src/config/config";

const commands = [
  {
    name: "attack",
    description: "Attack the Fiat bugs and destroy their hive.",
    options: [
      {
        name: "choose_action",
        description: "Choose one to kill these fiat bugs",
        type: 3, // STRING type
        required: true,
        choices: [
          { name: "Bitcoin Blaster", value: "Blaster" },
          { name: "Decentralizer Cannon", value: "Cannon" },
          { name: "Freedom Fist", value: "Fist" },
          { name: "Stick", value: "Stick" },
        ],
      },
      {
        name: "power-level",
        description: "Set the power level for your attack.",
        type: 4, // INTEGER type
        required: true,
        choices: [
          { name: "1x", value: 1 },
          { name: "5x", value: 5 },
          { name: "10x", value: 10 },
          { name: "100x", value: 100 },
        ],
      },
    ],
  },
  {
    name: "defend",
    description: "Defend Mezo Base from Fiat bugs.",
    options: [
      {
        name: "choose_action",
        description: "Choose your defense method",
        type: 3, // STRING type
        required: true,
        choices: [
          { name: "Build Wall", value: "BuildWall" },
          { name: "Set Trap", value: "SetTrap" },
          { name: "Supply Run", value: "SupplyRun" },
          { name: "Snacking", value: "Snacking" },
        ],
      },
      {
        name: "power-level",
        description: "Set the power level for your defense.",
        type: 4, // INTEGER type
        required: true,
        choices: [
          { name: "1x", value: 1 },
          { name: "5x", value: 5 },
          { name: "10x", value: 10 },
          { name: "100x", value: 100 },
        ],
      },
    ],
  },
  {
    name: "leaderboard",
    description: "Display the leaderboard of top Mezo Troopers.",
  },
  {
    name: "help",
    description: "Shows the training manual and bot instructions.",
  },
  {
    name: "howtoplay",
    description: "How to play the game and more information.",
  },
  {
    name: "points",
    description: "Displays your current points and territory.",
  },
  {
    name: "wormhole",
    description: "Travel through a wormhole to another territory.",
    options: [
      {
        name: "destination",
        description: "The destination territory",
        type: 3, // STRING type
        required: true,
        choices: [
          { name: "Satoshi's Camp (easy)", value: "Satoshi’s Camp" },
          { name: "Yield Farming Base (medium)", value: "Yield Farming Base" },
          { name: "Lending Command (hard)", value: "Lending Command" },
          { name: "Experimental Frontier (death)", value: "Experimental Frontier" },
        ],
      },
    ],
  },
];

const rest = new REST({ version: "9" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
