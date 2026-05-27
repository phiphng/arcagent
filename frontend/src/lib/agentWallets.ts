// Mock agent wallet data — in production this would come from the
// Circle CLI or the on-chain AgentWalletRegistry contract.
export interface AgentWallet {
  agentId: string;
  wallet: string;
  balanceUSDC: number;
  chainId: number;
  registered: boolean;
  lastActivity: string;
}

export const agentWallets: AgentWallet[] = [
  {
    agentId: "tg:alice",
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    balanceUSDC: 1250.42,
    chainId: 5042002,
    registered: true,
    lastActivity: "2026-05-27T18:30:00Z",
  },
  {
    agentId: "xmtp:bob",
    wallet: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
    balanceUSDC: 3400.0,
    chainId: 5042002,
    registered: true,
    lastActivity: "2026-05-27T17:45:00Z",
  },
  {
    agentId: "discord:charlie",
    wallet: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
    balanceUSDC: 75.0,
    chainId: 5042002,
    registered: true,
    lastActivity: "2026-05-27T16:12:00Z",
  },
  {
    agentId: "tg:dave",
    wallet: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    balanceUSDC: 0.0,
    chainId: 5042002,
    registered: false,
    lastActivity: "2026-05-26T09:00:00Z",
  },
];
