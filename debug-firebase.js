// Debug script to check Firebase configuration
const admin = require('firebase-admin');

// Initialize with your service account
// This is just for debugging - don't use in production
async function checkFirebaseConfig() {
  try {
    console.log('🔍 Checking Firebase project configuration...');
    
    // Check if we can list storage buckets
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    
    console.log('📂 Attempting to list storage buckets...');
    const [buckets] = await storage.getBuckets();
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name}`);
    });
    
    // Check the default bucket
    console.log('\n🏗️ Checking default bucket: pet-hero-ai.appspot.com');
    const defaultBucket = storage.bucket('pet-hero-ai.appspot.com');
    const [exists] = await defaultBucket.exists();
    
    if (exists) {
      console.log('✅ Default bucket exists');
      
      // Check permissions
      try {
        const [metadata] = await defaultBucket.getMetadata();
        console.log('📋 Bucket metadata:', {
          name: metadata.name,
          location: metadata.location,
          storageClass: metadata.storageClass,
          timeCreated: metadata.timeCreated,
        });
      } catch (metaError) {
        console.error('❌ Error getting bucket metadata:', metaError.message);
      }
      
    } else {
      console.error('❌ Default bucket does not exist!');
      console.log('💡 You may need to create it manually');
    }
    
  } catch (error) {
    console.error('❌ Error checking Firebase config:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if Firebase Storage is enabled in console');
    console.log('2. Verify storage bucket exists: pet-hero-ai.appspot.com');
    console.log('3. Check if project has proper billing setup');
    console.log('4. Verify service account has storage permissions');
  }
}

// Run if executed directly
if (require.main === module) {
  checkFirebaseConfig();
}

module.exports = { checkFirebaseConfig };
