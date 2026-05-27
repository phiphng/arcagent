import { agentWallets, type AgentWallet } from "@/lib/agentWallets";
import { WalletGrid } from "@/components/WalletGrid";

export default function Home() {
  const totalBalance = agentWallets
    .filter((w) => w.registered)
    .reduce((sum, w) => sum + w.balanceUSDC, 0);

  const activeCount = agentWallets.filter((w) => w.registered).length;

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              🤖 ArcAgent Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Circle Agent Wallet Registry — Arc Network
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalBalance.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Total USDC ({activeCount} active agents)
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 py-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Agents" value={agentWallets.length} />
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Inactive" value={agentWallets.length - activeCount} />
          <StatCard label="Total USDC" value={`$${totalBalance.toLocaleString()}`} />
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Agent Wallets
        </h2>
        <WalletGrid wallets={agentWallets} />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-3 text-center text-xs text-zinc-400">
          ArcAgent · Circle Programmable Wallets · Arc Network Testnet (Chain ID: 5042002)
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}
