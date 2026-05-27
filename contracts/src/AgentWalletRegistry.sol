// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentWalletRegistry
/// @notice ERC-8004 style on-chain registry mapping agent identities
///         (telegram/discord/xmtp handles) to their Circle SCA wallets.
///         Each agent has one wallet; the registry enforces uniqueness
///         and emits events so off-chain indexers stay in sync.
contract AgentWalletRegistry is Ownable {
    /// @notice Emitted when an agent identity is linked to a wallet address.
    event AgentRegistered(
        string indexed agentId,
        address indexed wallet
    );

    /// @notice Emitted when a wallet is unlinked from an agent identity.
    event AgentDeregistered(
        string indexed agentId,
        address indexed wallet
    );

    /// @notice Emitted when an existing agent's wallet is updated.
    event AgentUpdated(
        string indexed agentId,
        address indexed oldWallet,
        address indexed newWallet
    );

    /// @notice agentId  →  wallet address  (0x0 when unregistered)
    mapping(string => address) public agentWallets;

    /// @notice wallet address  →  agentId  (empty when unknown)
    mapping(address => string) public walletAgents;

    /// @notice Constructor sets the contract owner.
    /// @param _owner Address that will be able to register/deregister agents.
    constructor(address _owner) Ownable(_owner) {}

    // ────────── Mutators (onlyOwner) ───────────────────────────────────

    /// @notice Register a new agent identity with a wallet.
    /// @param agentId Unique off-chain identity (e.g. "tg:alice", "xmtp:bob").
    /// @param wallet  The Circle SCA wallet address.
    function registerAgent(string calldata agentId, address wallet) external onlyOwner {
        require(wallet != address(0), "Wallet cannot be zero address");
        require(bytes(agentId).length > 0, "Agent ID cannot be empty");
        require(
            agentWallets[agentId] == address(0),
            "Agent ID already registered"
        );
        require(
            bytes(walletAgents[wallet]).length == 0,
            "Wallet already linked to an agent"
        );

        agentWallets[agentId] = wallet;
        walletAgents[wallet] = agentId;
        emit AgentRegistered(agentId, wallet);
    }

    /// @notice Update the wallet address for an existing agent.
    /// @param agentId   The agent identity to update.
    /// @param newWallet The replacement wallet address.
    function updateAgentWallet(string calldata agentId, address newWallet) external onlyOwner {
        require(newWallet != address(0), "Wallet cannot be zero address");
        require(
            bytes(walletAgents[newWallet]).length == 0,
            "New wallet already linked"
        );

        address oldWallet = agentWallets[agentId];
        require(oldWallet != address(0), "Agent ID not registered");

        agentWallets[agentId] = newWallet;
        walletAgents[newWallet] = agentId;
        delete walletAgents[oldWallet];

        emit AgentUpdated(agentId, oldWallet, newWallet);
    }

    /// @notice Remove an agent from the registry.
    /// @param agentId The agent identity to deregister.
    function deregisterAgent(string calldata agentId) external onlyOwner {
        address wallet = agentWallets[agentId];
        require(wallet != address(0), "Agent ID not registered");

        delete agentWallets[agentId];
        delete walletAgents[wallet];

        emit AgentDeregistered(agentId, wallet);
    }

    // ────────── Queries (public) ──────────────────────────────────────

    /// @notice Check whether an agent is registered.
    function isAgentRegistered(string calldata agentId) external view returns (bool) {
        return agentWallets[agentId] != address(0);
    }

    /// @notice Get all info for an agent.
    function getAgent(string calldata agentId) external view returns (address wallet, bool registered) {
        wallet = agentWallets[agentId];
        registered = wallet != address(0);
    }

    /// @notice Look up an agent by wallet address.
    function getAgentByWallet(address wallet) external view returns (string memory agentId, bool registered) {
        agentId = walletAgents[wallet];
        registered = bytes(agentId).length > 0;
    }

    /// @notice Batch query for multiple agent IDs.
    function batchGetAgents(string[] calldata agentIds)
        external
        view
        returns (address[] memory wallets, bool[] memory registered)
    {
        uint256 len = agentIds.length;
        wallets = new address[](len);
        registered = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            wallets[i] = agentWallets[agentIds[i]];
            registered[i] = wallets[i] != address(0);
        }
    }

    /// @notice Returns the total number of registered agents.
    /// @dev For tracking purposes only; not a cheap operation on-chain.
    function agentCount() external view returns (uint256 count) {
        // Not enumerable in this lightweight version.
        // Count is derivable off-chain from events.
        // Thid stub exists for interface completeness.
        count = 0; // Placeholder
    }
}
