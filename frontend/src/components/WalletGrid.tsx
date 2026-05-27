"use client";

import { type AgentWallet } from "@/lib/agentWallets";

function WalletCard({ wallet }: { wallet: AgentWallet }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
          {wallet.agentId}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            wallet.registered
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {wallet.registered ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between">
          <span>Wallet</span>
          <span className="font-mono text-xs text-zinc-900 dark:text-zinc-200 truncate max-w-[200px]">
            {wallet.wallet}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Balance</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
            ${wallet.balanceUSDC.toLocaleString()} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span>Chain ID</span>
          <span className="font-mono text-zinc-900 dark:text-zinc-200">
            {wallet.chainId}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Last Active</span>
          <span className="text-zinc-900 dark:text-zinc-200">
            {new Date(wallet.lastActivity).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function WalletGrid({ wallets }: { wallets: AgentWallet[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {wallets.map((w) => (
        <WalletCard key={w.agentId} wallet={w} />
      ))}
    </div>
  );
}
