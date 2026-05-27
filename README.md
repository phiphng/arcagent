# ArcAgent — Circle Agent Wallet Telegram Bot

Telegram bot wrapping the [Circle CLI](https://circle.com) for Agent Wallets on **Arc Network** (testnet).

- SCA smart wallets, USDC-only, gas-abstracted
- Chain ID: `5042002`, RPC: `https://rpc.testnet.arc.network`

## Project Structure

```
arcagent/
├── bot.js                      # Telegram bot (grammy + Circle CLI)
├── package.json                # Bot dependencies
├── contracts/                  # Foundry Solidity project
│   ├── foundry.toml
│   ├── src/AgentWalletRegistry.sol   # ERC-8004 agent identity ↔ wallet
│   └── test/AgentWalletRegistry.t.sol # Foundry tests (15 tests)
├── frontend/                   # Next.js dashboard
│   └── src/
│       ├── app/                # Dashboard page + layout
│       ├── components/         # WalletGrid, WalletCard
│       └── lib/                # Agent wallet data types
└── test/                       # Jest tests for bot.js (26 tests)
    └── bot.test.js
```

## Commands

| Command      | Action                                          |
| ------------ | ----------------------------------------------- |
| `/start`     | Intro + command list                            |
| `/wallet`    | Create (or show existing) SCA wallet            |
| `/balance`   | Show USDC balance                               |
| `/fund`      | Request testnet USDC from faucet                |
| `/pay`       | Pay another address: `/pay <to> <amount_usdc>` |
| `/services`  | Search Circle services (optional keyword)       |

## Smart Contracts

The `contracts/` directory contains a Foundry project with an **AgentWalletRegistry** contract (ERC-8004 style) that maps agent identities (e.g., `tg:alice`, `xmtp:bob`) to their Circle SCA wallet addresses.

```bash
cd contracts
forge build     # compile
forge test      # run 15 tests
```

## Frontend Dashboard

The `frontend/` directory is a Next.js app showing agent wallet stats.

```bash
cd frontend
npm install
npm run dev     # start dev server at http://localhost:3000
```

## Bot Tests

```bash
cd test
npm install
npm test        # run 26 Jest tests
```

## Setup

### 1. Prerequisites

- Node.js ≥ 18
- npm
- [Circle CLI](https://www.npmjs.com/package/@circle-fin/cli) installed globally (`npm i -g @circle-fin/cli`)
- Circle account configured (run `circle login`)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)

### 2. Clone & install

```bash
git clone git@github.com-phiphng:phiphng/arcagent.git
cd arcagent
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your bot token from @BotFather
```

### 4. Run

```bash
npm start       # production
npm run dev     # watch mode (auto-reload)
```

## Security

- `.env` is git-ignored — never commit secrets
- The bot runs CLI commands server-side; no private keys are exposed in chat
