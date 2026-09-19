require('dotenv').config();
const { MongoClient } = require('mongodb');

async function cleanNotes() {
  const uri = process.env.MONGOURI;
  if (!uri) return;
  const client = await MongoClient.connect(uri);
  const db = client.db();
  
  const orders = await db.collection('orders').find({}).toArray();
  for (const order of orders) {
    if (order.notes && order.notes.includes('[WhatsApp Event:')) {
      // Keep only text before the first WhatsApp log
      const cleanNotes = order.notes.split('[WhatsApp Event:')[0].trim();
      await db.collection('orders').updateOne(
        { _id: order._id },
        { $set: { notes: cleanNotes } }
      );
      console.log(`Cleaned notes for order: ${order.id}`);
    }
  }
  
  await client.close();
  console.log('Cleanup complete');
}

cleanNotes().catch(console.error);
