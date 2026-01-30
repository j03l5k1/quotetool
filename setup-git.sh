#!/bin/bash

# Initialize git repository
cd /home/claude/quotetool
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Phase 1: ServiceM8 integration

Features:
- ServiceM8 job lookup by job number
- Auto-fetch client and job details
- Dark theme UI matching CIPP calculator
- Ready for Vercel deployment

Next: Phase 2 - Quote details form"

# Add remote (you'll need to run this with your GitHub repo URL)
echo ""
echo "✅ Git repository initialized!"
echo ""
echo "Next steps:"
echo "1. Go to GitHub and create the 'quotetool' repository"
echo "2. Run these commands:"
echo "   cd quotetool"
echo "   git remote add origin https://github.com/j03l5k1/quotetool.git"
echo "   git branch -M main"
echo "   git push -u origin main"
