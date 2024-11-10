import { MongoClient } from "mongodb";
import {
  MONGO_SECRET,
  MONGO_URL,
  MONGO_USER,
  MONGO_DB,
  MONGO_COLLECTION,
} from "../config/config";
import { Trooper } from "../types/index";

const mongoUri = `mongodb+srv://${MONGO_USER}:${MONGO_SECRET}${MONGO_URL}`;


export async function clearAllPoints() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
    await collection.updateMany({}, { $set: { points: 0 } });
    console.log('All player points have been reset to zero.');
  } catch (error) {
    console.error('Failed to reset player points:', error);
  } finally {
    await client.close(); 
  }
}

export async function getLeaderBoard(): Promise<Trooper[]> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
  const documents = await collection.find().sort({ points: -1 }).toArray();
  await client.close();
  return documents.map((doc) => ({
    userId: doc.userId,
    points: doc.points,
    currentTerritory: doc.currentTerritory, // Include currentTerritory in the mapping
  })) as Trooper[];
}

export async function getTrooper(userId: string): Promise<Trooper | undefined> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
  const document = await collection.findOne({ userId: userId });
  await client.close();
  if (!document) return undefined;
  return {
    userId: document.userId,
    points: document.points,
    currentTerritory: document.currentTerritory, // Include currentTerritory
    matsEarnedInGame: document.matsEarnedInGame || 0,
  } as Trooper;
}

export async function upsertTrooper(data: Trooper): Promise<void> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
  await collection.updateOne(
    { userId: data.userId },
    { $set: data },
    { upsert: true }
  );
  console.log(`Trooper updated: ${data.userId}`);
  await client.close();
}

export async function incrementMatsInGame(userId: string, mats: number): Promise<void> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
  await collection.updateOne(
    { userId: userId },
    { $inc: { matsEarnedInGame: mats } },
    { upsert: true }
  );
  await client.close();
  console.log(`Incremented ${mats} Mats for user ${userId} in the game.`);
}

// New function to update a trooper's current territory
// export async function updatePlayerTerritory(userId: string, territory: string): Promise<void> {
//   const client = new MongoClient(mongoUri);
//   await client.connect();
//   const collection = client.db(db).collection(collectionName);
//   await collection.updateOne({ userId: userId }, { $set: { currentTerritory: territory } }, { upsert: true });
//   console.log(`Trooper territory updated: ${userId} to ${territory}`);
//   await client.close();
// }

export async function updateAndFetchRanks(): Promise<Trooper[]> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);

  // Fetch all troopers and sort them by points in descending order
  const troopers = (await collection
    .find()
    .sort({ points: -1 })
    .toArray()) as unknown as Trooper[];

  // Prepare bulk operations for rank updates
  const bulkOps = troopers.map((trooper, index) => ({
    updateOne: {
      filter: { userId: trooper.userId },
      update: { $set: { rank: index + 1 } },
    },
  }));

  // Execute bulk operations if there are any
  if (bulkOps.length > 0) {
    await collection.bulkWrite(bulkOps);
  }

  await client.close();
  return troopers; 
}

export async function insertOrUpdatePlayer(trooper: Trooper): Promise<void> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const collection = client.db(MONGO_DB).collection(MONGO_COLLECTION);
  await collection.updateOne(
    { userId: trooper.userId },
    { $set: trooper },
    { upsert: true }
  );
  await client.close();
}
