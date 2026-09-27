# ChainGov Deployment Guide

## Local
1. Set `VITE_API_URL=http://localhost:3001` and `VITE_CHAIN_ID=31337` in frontend `.env`
2. Set `DATABASE_URL` (SQLite or local PostgreSQL) in backend `.env`
3. Run `npm install` and `npx prisma generate` in `apps/api`
4. Run `npx hardhat node`
5. Run `npm run dev` in both `apps/api` and `apps/web`

## LAN
1. Run `ipconfig` to get your LAN IP (e.g. 192.168.1.10)
2. In `apps/web/.env`, set `VITE_API_URL=http://192.168.1.10:3001`
3. Start backend: `npm run dev -- --host 0.0.0.0` or ensure `PORT` and `HOST` bind to `0.0.0.0`
4. Start frontend: `npm run dev -- --host 0.0.0.0`
5. On your phone, connect to same Wi-Fi and open `http://192.168.1.10:5173`

## Testnet
1. Add `VITE_CHAIN_ID=11155111` (Sepolia) and update `VITE_RPC_URL` in frontend `.env`
2. Update backend `RPC_URL`, `CHAIN_ID` and contract addresses in backend `.env`
3. Deploy contracts: `npx hardhat run scripts/deploy.ts --network sepolia`
4. Ensure your MetaMask wallet is connected to Sepolia

## Cloud
1. Deploy `apps/api` to a service like Render/Railway with a Managed PostgreSQL `DATABASE_URL`
2. Set `CORS_ORIGIN=https://your-frontend.vercel.app` in backend
3. Set `VITE_API_URL=https://your-backend.onrender.com` in frontend before deploying to Vercel/Netlify
4. Connect frontend and backend to identical Testnet configuration and smart contracts.
