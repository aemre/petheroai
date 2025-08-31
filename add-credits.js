const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getFunctions } = require('firebase-admin/functions');

// Initialize Firebase Admin SDK
initializeApp({
  projectId: 'pet-hero-ai'
});

const db = getFirestore();

async function listUsers() {
  try {
    console.log('🔍 Checking for existing users...');
    const usersSnapshot = await db.collection('users').limit(10).get();
    
    if (usersSnapshot.empty) {
      console.log('📝 No users found. Will create a test user.');
      return [];
    }
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        userId: doc.id,
        credits: userData.credits || 0,
        premium: userData.premium || false,
        createdAt: userData.createdAt || null,
      });
    });
    
    console.log('👥 Found users:');
    users.forEach(user => {
      console.log(`  - ${user.userId}: ${user.credits} credits`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error);
    return [];
  }
}

async function addCreditsToUser(userId, credits) {
  try {
    console.log(`💰 Adding ${credits} credits to user: ${userId}`);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user
      await userRef.set({
        credits: credits,
        premium: false,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created new user ${userId} with ${credits} credits`);
      return { totalCredits: credits, isNew: true };
    } else {
      // Add credits to existing user
      const currentData = userDoc.data();
      const currentCredits = currentData.credits || 0;
      const newTotal = currentCredits + credits;
      
      await userRef.update({
        credits: FieldValue.increment(credits),
        lastUpdated: FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Added ${credits} credits to ${userId}. New total: ${newTotal}`);
      return { totalCredits: newTotal, isNew: false };
    }
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    throw error;
  }
}

async function main() {
  try {
    // First, list existing users
    const users = await listUsers();
    
    // Use the first user if exists, otherwise create a test user
    let testUserId;
    if (users.length > 0) {
      testUserId = users[0].userId;
      console.log(`🎯 Using existing user: ${testUserId}`);
    } else {
      // Create a test user ID (you can replace this with your actual user ID)
      testUserId = 'test-user-' + Date.now();
      console.log(`🆕 Creating new test user: ${testUserId}`);
    }
    
    // Add 10 credits
    const result = await addCreditsToUser(testUserId, 10);
    
    console.log('\n🎉 Success!');
    console.log(`User ID: ${testUserId}`);
    console.log(`Total Credits: ${result.totalCredits}`);
    console.log(`User was ${result.isNew ? 'created' : 'updated'}`);
    
    // Verify the credits were added
    console.log('\n🔍 Verifying...');
    const userDoc = await db.collection('users').doc(testUserId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`✅ Verified: User ${testUserId} now has ${userData.credits} credits`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
