# Deployment Guide - Vercel

This guide will help you deploy the Fluent Bit Parser Tester to Vercel in just a few minutes.

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Run the automated deployment script
./scripts/deploy.sh
```

This script will:
- ✅ Install dependencies
- ✅ Run tests and type checking
- ✅ Build for production
- ✅ Install Vercel CLI (if needed)
- ✅ Deploy to Vercel

### Option 2: Manual Deployment

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Build and Deploy
```bash
npm run build
vercel --prod
```

## 🔧 Configuration Files

The following files are already configured for Vercel deployment:

### `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://core.calyptia.com/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### `.vercelignore`
Excludes unnecessary files from deployment:
- Test files and coverage reports
- Development dependencies
- Documentation files
- Build artifacts

## 🌐 GitHub Integration (Alternative)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite configuration
5. Click "Deploy"

### Build Settings (Auto-detected)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔍 Verification

After deployment, verify these features work:

### ✅ Core Functionality
- [ ] Application loads without errors
- [ ] Parser library sidebar displays all categories
- [ ] Selecting a parser loads the pattern correctly
- [ ] "Test Parser" button works and returns results
- [ ] Field extraction displays properly
- [ ] Time parsing works for supported formats

### ✅ API Integration
- [ ] API calls to `/api/parser` work (proxied to Calyptia)
- [ ] No CORS errors in browser console
- [ ] Error handling works for invalid patterns
- [ ] Timeout handling works for slow responses

### ✅ UI/UX
- [ ] Responsive design works on mobile/tablet
- [ ] VSCode-style editor styling displays correctly
- [ ] Loading states show properly
- [ ] Error messages are clear and helpful

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check for TypeScript errors
npm run type-check

# Check for linting issues
npm run lint

# Test build locally
npm run build
```

#### 2. API Proxy Issues
- Verify `vercel.json` rewrites configuration
- Check browser network tab for failed API calls
- Ensure Calyptia API is accessible

#### 3. Environment Variables
No environment variables are required for basic functionality.

#### 4. Custom Domain
```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.61
```

## 📊 Performance Optimization

### Already Implemented
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Gzip compression (Vercel automatic)

### Additional Optimizations
```bash
# Analyze bundle size
npm run build -- --analyze

# Check lighthouse scores
npx lighthouse https://your-app.vercel.app
```

## 🔄 Continuous Deployment

### Automatic Deployments
Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run build checks before deployment

### Manual Deployments
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployment logs
vercel logs

# List deployments
vercel ls
```

## 📈 Monitoring

### Vercel Analytics
Enable analytics in your Vercel dashboard to track:
- Page views and user sessions
- Performance metrics
- Error rates
- Geographic distribution

### Custom Monitoring
Consider adding:
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics (Google Analytics)

## 🔐 Security

### Already Configured
- ✅ HTTPS by default
- ✅ CORS headers configured
- ✅ No sensitive data in client code
- ✅ API proxy for external calls

### Additional Security
- Enable Vercel's security headers
- Configure Content Security Policy
- Set up rate limiting if needed

## 📞 Support

### Vercel Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### Project Resources
- Check `README.md` for project-specific information
- Review `package.json` scripts
- Examine `vite.config.ts` for build configuration

---

🎉 **Congratulations!** Your Fluent Bit Parser Tester is now live on Vercel and ready to help teams validate their log parsing patterns! 