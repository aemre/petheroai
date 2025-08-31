#!/bin/bash

# Pet Hero AI - Step-by-Step Implementation Script
# Run this script to set up your development environment

echo "🦸‍♀️ Pet Hero AI Implementation Guide"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_step 1 "Checking Requirements"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check if Firebase CLI is installed
    if command -v firebase &> /dev/null; then
        FIREBASE_VERSION=$(firebase --version)
        print_success "Firebase CLI is installed: $FIREBASE_VERSION"
    else
        print_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    # Check if Expo CLI is installed
    if command -v expo &> /dev/null; then
        EXPO_VERSION=$(expo --version)
        print_success "Expo CLI is installed: $EXPO_VERSION"
    else
        print_warning "Expo CLI not found. Installing..."
        npm install -g @expo/cli
    fi
}

# Install project dependencies
install_dependencies() {
    print_step 2 "Installing Dependencies"
    
    echo "Installing main project dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Main dependencies installed"
    else
        print_error "Failed to install main dependencies"
        exit 1
    fi
    
    echo "Installing Firebase Functions dependencies..."
    cd functions
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Functions dependencies installed"
    else
        print_error "Failed to install functions dependencies"
        exit 1
    fi
    
    cd ..
}

# Configure Firebase
setup_firebase() {
    print_step 3 "Firebase Configuration"
    
    echo "Please complete the following Firebase setup steps:"
    echo ""
    echo "1. Go to https://console.firebase.google.com/"
    echo "2. Create a new project called 'pet-hero-ai'"
    echo "3. Enable Authentication → Anonymous"
    echo "4. Create Firestore Database"
    echo "5. Enable Storage"
    echo "6. Enable Cloud Functions"
    echo "7. Add iOS app with bundle ID: com.pethero.ai"
    echo "8. Add Android app with package: com.pethero.ai"
    echo ""
    
    read -p "Press Enter when you have completed Firebase project setup..."
    
    # Check if user is logged in to Firebase
    if firebase projects:list &> /dev/null; then
        print_success "Firebase CLI is authenticated"
    else
        print_warning "Please login to Firebase CLI"
        firebase login
    fi
    
    # Initialize Firebase project
    print_warning "Please run 'firebase init' and select:"
    print_warning "- Firestore (with default rules)"
    print_warning "- Storage (with default rules)" 
    print_warning "- Functions (TypeScript)"
    print_warning "- Use existing project: pet-hero-ai"
    echo ""
    read -p "Press Enter to continue with firebase init..."
    firebase init
}

# Set up environment variables
setup_environment() {
    print_step 4 "Environment Configuration"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
    else
        print_warning ".env file already exists"
    fi
    
    echo ""
    echo "Please edit the .env file and add your credentials:"
    echo "- Firebase configuration"
    echo "- Google Gemini API key"
    echo "- Other service credentials"
    echo ""
    
    read -p "Press Enter when you have updated .env file..."
}

# Set up AI services
setup_ai_services() {
    print_step 5 "AI Services Configuration"
    
    echo "To set up AI services, you need:"
    echo ""
    echo "1. Google Gemini API Key:"
    echo "   - Go to https://makersuite.google.com/"
    echo "   - Create account and get API key"
    echo "   - Add to .env file: GEMINI_API_KEY=your_key"
    echo ""
    echo "2. Image Generation Service (choose one):"
    echo "   - OpenAI DALL-E: https://platform.openai.com/"
    echo "   - Stability AI: https://platform.stability.ai/"
    echo "   - Custom implementation"
    echo ""
    
    read -p "Press Enter when you have set up AI services..."
    
    # Set Firebase Functions config
    read -p "Enter your Gemini API key: " GEMINI_KEY
    if [ ! -z "$GEMINI_KEY" ]; then
        firebase functions:config:set gemini.api_key="$GEMINI_KEY"
        print_success "Gemini API key configured in Firebase Functions"
    fi
}

# Set up in-app purchases
setup_iap() {
    print_step 6 "In-App Purchase Configuration"
    
    echo "For iOS App Store:"
    echo "1. Go to https://appstoreconnect.apple.com/"
    echo "2. Create your app with bundle ID: com.pethero.ai"
    echo "3. Set up in-app purchases:"
    echo "   - com.pethero.credits5 (5 Credits)"
    echo "   - com.pethero.credits10 (10 Credits)"  
    echo "   - com.pethero.credits20 (20 Credits)"
    echo ""
    echo "For Google Play:"
    echo "1. Go to https://play.google.com/console/"
    echo "2. Create your app with package: com.pethero.ai"
    echo "3. Set up the same in-app products"
    echo ""
    
    read -p "Press Enter when IAP setup is complete..."
}

# Deploy Firebase services
deploy_firebase() {
    print_step 7 "Deploying Firebase Services"
    
    echo "Building and deploying Firebase Functions..."
    cd functions
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Functions built successfully"
    else
        print_error "Functions build failed"
        exit 1
    fi
    
    cd ..
    
    # Deploy using the deploy script
    chmod +x deploy.sh
    ./deploy.sh
    
    if [ $? -eq 0 ]; then
        print_success "Firebase services deployed"
    else
        print_error "Firebase deployment failed"
    fi
}

# Test the app
test_app() {
    print_step 8 "Testing the Application"
    
    echo "Starting the development server..."
    echo "You can test on:"
    echo "- iOS Simulator"
    echo "- Android Emulator" 
    echo "- Physical device with Expo Go"
    echo ""
    
    read -p "Press Enter to start the development server..."
    npm start
}

# Main execution
main() {
    echo "Starting Pet Hero AI implementation..."
    echo ""
    
    check_requirements
    install_dependencies
    setup_firebase
    setup_environment
    setup_ai_services
    setup_iap
    deploy_firebase
    
    print_success "🎉 Pet Hero AI setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test the app on your device/simulator"
    echo "2. Configure push notifications"
    echo "3. Test in-app purchases"
    echo "4. Submit to app stores"
    echo ""
    
    read -p "Would you like to start the development server now? (y/n): " start_dev
    if [[ $start_dev =~ ^[Yy]$ ]]; then
        test_app
    fi
}

# Run main function
main