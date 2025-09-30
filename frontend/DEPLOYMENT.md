# OmniLendZ Frontend Deployment Guide

This guide will help you deploy the OmniLendZ frontend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your OmniLendZ contract deployed and its address
3. A WalletConnect Project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com))
4. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is committed and pushed to your Git repository:

```bash
cd frontend
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the frontend directory:
```bash
cd frontend
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No** (for first deployment)
   - Project name: **omnilendz-frontend** (or your preferred name)
   - Directory: **./** (current directory)
   - Override settings? **No**

#### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_OMNI_ADDRESS` | Your deployed contract address | Production, Preview, Development |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your WalletConnect Project ID | Production, Preview, Development |

Example:
```
VITE_OMNI_ADDRESS=0x1234567890123456789012345678901234567890
VITE_WALLETCONNECT_PROJECT_ID=abc123def456ghi789jkl012mno345pqr678
```

### 4. Redeploy

After setting environment variables, trigger a new deployment:

- **Via CLI**: `vercel --prod`
- **Via Dashboard**: Go to Deployments tab and click "Redeploy"

## Configuration Files

The following files have been created for Vercel deployment:

- `vercel.json` - Vercel configuration
- `env.example` - Environment variables template

## Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all dependencies are in `package.json`
2. Ensure TypeScript compilation passes: `npm run build`
3. Check Vercel build logs in the dashboard

### Solidity Warnings

If you see Solidity warnings about unused parameters:

1. The warnings are automatically suppressed during Vercel builds
2. For local development, use: `npm run build:silent`
3. Warnings don't affect the frontend build process
4. To suppress specific warnings, update `.solhint.json`

### Environment Variables Not Working

1. Verify variables are set in Vercel dashboard
2. Ensure variable names start with `VITE_`
3. Redeploy after adding variables

### Contract Connection Issues

1. Verify `VITE_OMNI_ADDRESS` is correct
2. Check that the contract is deployed on the correct network
3. Ensure your wallet is connected to the right network

## Development

For local development:

1. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

2. Update `.env.local` with your values:
```
VITE_OMNI_ADDRESS=0xYourContractAddress
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

3. Start development server:
```bash
npm run dev
```

## Production Checklist

Before deploying to production:

- [ ] Contract is deployed and verified
- [ ] Environment variables are set
- [ ] All tests pass
- [ ] Build completes successfully
- [ ] UI loads without errors
- [ ] Wallet connection works
- [ ] Contract interactions work (if applicable)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first
4. Check contract deployment status

For more help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Wagmi Documentation](https://wagmi.sh/)
