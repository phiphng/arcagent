import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────

interface AgentEntry {
  agentId: string;
  wallet: string;
  active: boolean;
}

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  deactivatedAgents: number;
}

// ── Mock data hook (replace with actual contract reads) ─────────────────

function useAgentData() {
  const [agents, setAgents] = useState<AgentEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    deactivatedAgents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, replace with contract reads via ethers/viem + RPC
    const mockAgents: AgentEntry[] = [
      { agentId: "tg:alice", wallet: "0x1111111111111111111111111111111111111111", active: true },
      { agentId: "xmtp:bob", wallet: "0x2222222222222222222222222222222222222222", active: true },
      { agentId: "discord:charlie", wallet: "0x3333333333333333333333333333333333333333", active: false },
      { agentId: "tg:dave", wallet: "0x4444444444444444444444444444444444444444", active: true },
    ];

    setAgents(mockAgents);
    setStats({
      totalAgents: mockAgents.length,
      activeAgents: mockAgents.filter((a) => a.active).length,
      deactivatedAgents: mockAgents.filter((a) => !a.active).length,
    });
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  return { agents, stats, loading, refresh };
}

// ── Components ─────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.statCard, borderTopColor: color }}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function AgentRow({ agent, index }: { agent: AgentEntry; index: number }) {
  return (
    <tr style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
      <td style={styles.cell}>
        <code style={styles.agentCode}>{agent.agentId}</code>
      </td>
      <td style={styles.cell}>
        <code style={styles.walletCode}>
          {agent.wallet.slice(0, 6)}…{agent.wallet.slice(-4)}
        </code>
      </td>
      <td style={styles.cell}>
        <span
          style={{
            ...styles.badge,
            backgroundColor: agent.active ? "#dcfce7" : "#fee2e2",
            color: agent.active ? "#166534" : "#991b1b",
          }}
        >
          {agent.active ? "Active" : "Deactivated"}
        </span>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { agents, stats, loading, refresh } = useAgentData();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ArcAgent Dashboard</h1>
          <p style={styles.subtitle}>
            Agent Wallet Registry — Circle SCA on Arc Network
          </p>
        </div>
        <button onClick={refresh} style={styles.refreshBtn} disabled={loading}>
          {loading ? "Loading…" : "🔄 Refresh"}
        </button>
      </header>

      {/* Stats */}
      <section style={styles.statsGrid}>
        <StatCard label="Total Agents" value={stats.totalAgents} color="#3b82f6" />
        <StatCard label="Active" value={stats.activeAgents} color="#22c55e" />
        <StatCard label="Deactivated" value={stats.deactivatedAgents} color="#ef4444" />
      </section>

      {/* Agent Table */}
      <section style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>Registered Agents</h2>
        {loading ? (
          <div style={styles.loading}>Loading agent data…</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.headerCell}>Agent ID</th>
                <th style={styles.headerCell}>Wallet Address</th>
                <th style={styles.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={3} style={styles.emptyCell}>
                    No agents registered yet.
                  </td>
                </tr>
              ) : (
                agents.map((agent, i) => (
                  <AgentRow key={agent.agentId} agent={agent} index={i} />
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Contract Info */}
      <section style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>Contract Info</h2>
        <div style={styles.infoCard}>
          <p>
            <strong>Contract:</strong> AgentWalletRegistry
          </p>
          <p>
            <strong>Network:</strong> Arc Testnet (Chain ID: 5042002)
          </p>
          <p>
            <strong>RPC:</strong> https://rpc.testnet.arc.network
          </p>
          <p>
            <strong>Solc:</strong> 0.8.20 · <strong>EVM:</strong> Paris
          </p>
        </div>
      </section>
    </div>
  );
}

// ── Inline Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
    borderTopWidth: 4,
    borderTopStyle: "solid",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  tableSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 12,
    color: "#0f172a",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  headerRow: {
    backgroundColor: "#f1f5f9",
  },
  headerCell: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
    color: "#475569",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  rowEven: {
    backgroundColor: "#ffffff",
  },
  rowOdd: {
    backgroundColor: "#f8fafc",
  },
  cell: {
    padding: "12px 16px",
    fontSize: 14,
    borderTop: "1px solid #f1f5f9",
  },
  agentCode: {
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 13,
  },
  walletCode: {
    fontSize: 13,
    color: "#64748b",
  },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
  },
  emptyCell: {
    padding: "32px 16px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  loading: {
    padding: "32px 16px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    fontSize: 14,
    lineHeight: 2,
  },
};
