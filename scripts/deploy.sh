#!/bin/bash

# Fluent Bit Parser Tester - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🚀 Fluent Bit Parser Tester - Vercel Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if this is the parser-library project
if ! grep -q '"name": "parser-library"' package.json; then
    print_error "This doesn't appear to be the parser-library project."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 2: Run tests
print_status "Running tests..."
if npm run test:unit > /dev/null 2>&1; then
    print_success "Unit tests passed"
else
    print_warning "Unit tests failed or not available, continuing..."
fi

# Step 3: Type check
print_status "Running type check..."
if npm run type-check > /dev/null 2>&1; then
    print_success "Type check passed"
else
    print_warning "Type check failed, but continuing with deployment..."
fi

# Step 4: Build for production
print_status "Building for production..."
npm run build
print_success "Production build completed"

# Step 5: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing globally..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Step 6: Deploy to Vercel
print_status "Deploying to Vercel..."
echo ""
echo "🔐 You may need to login to Vercel if this is your first deployment."
echo "📝 Follow the prompts to configure your project."
echo ""

# Deploy with production flag
vercel --prod

print_success "Deployment completed!"
echo ""
echo "🎉 Your Fluent Bit Parser Tester is now live on Vercel!"
echo ""
echo "📋 Next steps:"
echo "   1. Update your README.md with the live URL"
echo "   2. Test the deployed application"
echo "   3. Share with your team!"
echo ""
echo "🔧 Useful commands:"
echo "   - vercel --prod    (redeploy to production)"
echo "   - vercel           (deploy to preview)"
echo "   - vercel logs      (view deployment logs)"
echo "   - vercel domains   (manage custom domains)"
echo "" 