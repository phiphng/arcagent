# ArcAgent — Circle Agent Wallet Telegram Bot

Telegram bot wrapping the [Circle CLI](https://circle.com) for Agent Wallets on **Arc Network** (testnet).

- SCA smart wallets, USDC-only, gas-abstracted
- Chain ID: `5042002`, RPC: `https://rpc.testnet.arc.network`

## Commands

| Command      | Action                                          |
| ------------ | ----------------------------------------------- |
| `/start`     | Intro + command list                            |
| `/wallet`    | Create (or show existing) SCA wallet            |
| `/balance`   | Show USDC balance                               |
| `/fund`      | Request testnet USDC from faucet                |
| `/pay`       | Pay another address: `/pay <to> <amount_usdc>` |
| `/services`  | Search Circle services (optional keyword)       |

## Setup

### 1. Prerequisites

- Node.js ≥ 18
- npm
- [Circle CLI](https://www.npmjs.com/package/@circle-fin/cli) installed globally (`npm i -g @circle-fin/cli`)
- Circle account configured (run `circle login`)

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
