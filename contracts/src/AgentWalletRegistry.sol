// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentWalletRegistry
/// @notice On-chain registry mapping agent identities (e.g. tg:alice, xmtp:bob)
///         to their Circle SCA wallet addresses. Each agent has one wallet;
///         the registry enforces uniqueness and emits events for off-chain sync.
contract AgentWalletRegistry {
    /// @notice Emitted when the owner is transferred.
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @notice Emitted when a new agent identity is linked to a wallet address.
    event AgentRegistered(
        string indexed agentId,
        address indexed wallet
    );

    /// @notice Emitted when an existing agent's wallet is updated.
    event AgentUpdated(
        string indexed agentId,
        address indexed oldWallet,
        address indexed newWallet
    );

    /// @notice Emitted when an agent is deactivated (set to zero address).
    event AgentDeactivated(
        string indexed agentId,
        address indexed previousWallet
    );

    /// @notice Contract owner address.
    address public owner;

    /// @notice agentId → wallet address (0x0 when unregistered/deactivated).
    mapping(string => address) public agentWallets;

    /// @notice wallet address → agentId (empty when unknown).
    mapping(address => string) public walletAgents;

    /// @notice Throws if called by any account other than the owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Constructor sets the contract owner.
    /// @param _owner Address that will be able to manage agents.
    constructor(address _owner) {
        require(_owner != address(0), "Owner cannot be zero address");
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    /// @notice Transfer ownership to a new address.
    /// @param newOwner The address to transfer ownership to.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

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
    function updateAgent(string calldata agentId, address newWallet) external onlyOwner {
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

    /// @notice Deactivate an agent by setting its wallet to address(0).
    /// @param agentId The agent identity to deactivate.
    function deactivateAgent(string calldata agentId) external onlyOwner {
        address wallet = agentWallets[agentId];
        require(wallet != address(0), "Agent ID not registered");

        delete agentWallets[agentId];
        delete walletAgents[wallet];

        emit AgentDeactivated(agentId, wallet);
    }

    // ────────── Queries (public) ──────────────────────────────────────

    /// @notice Check whether an agent is registered/active.
    function isAgentActive(string calldata agentId) external view returns (bool) {
        return agentWallets[agentId] != address(0);
    }

    /// @notice Get all info for an agent.
    function getAgent(string calldata agentId) external view returns (address wallet, bool active) {
        wallet = agentWallets[agentId];
        active = wallet != address(0);
    }

    /// @notice Look up an agent by wallet address.
    function getAgentByWallet(address wallet) external view returns (string memory agentId, bool active) {
        agentId = walletAgents[wallet];
        active = bytes(agentId).length > 0;
    }

    /// @notice Batch query for multiple agent IDs.
    function batchGetAgents(string[] calldata agentIds)
        external
        view
        returns (address[] memory wallets, bool[] memory active)
    {
        uint256 len = agentIds.length;
        wallets = new address[](len);
        active = new bool[](len);
        for (uint256 i = 0; i < len; i++) {
            wallets[i] = agentWallets[agentIds[i]];
            active[i] = wallets[i] != address(0);
        }
    }
}
