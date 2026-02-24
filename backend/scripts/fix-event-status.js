import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';

dotenv.config();

async function fixEventStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all Draft events
    const draftEvents = await Event.find({ status: 'Draft' });
    console.log(`\n📋 Found ${draftEvents.length} Draft events:`);
    
    draftEvents.forEach(event => {
      console.log(`  - ${event.name} (ID: ${event._id})`);
    });

    // Find all Published events
    const publishedEvents = await Event.find({ status: 'Published' });
    console.log(`\n📋 Found ${publishedEvents.length} Published events:`);
    
    publishedEvents.forEach(event => {
      console.log(`  - ${event.name} (ID: ${event._id})`);
    });

    // List all events with their status
    const allEvents = await Event.find({}, 'name status type createdAt');
    console.log(`\n📊 All Events Summary:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allEvents.forEach(event => {
      const statusIcon = event.status === 'Draft' ? '🔴' : event.status === 'Published' ? '🟢' : '🟡';
      console.log(`${statusIcon} ${event.name.padEnd(30)} | ${event.status.padEnd(12)} | ${event.type || 'Normal'}`);
    });

    console.log('\n💡 To publish a Draft event, the organizer must click the "Publish" button');
    console.log('   in their Organizer Dashboard');

    await mongoose.connection.close();
    console.log('\n✅ Closed database connection');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixEventStatus();
