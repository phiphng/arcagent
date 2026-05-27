// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {AgentWalletRegistry} from "../src/AgentWalletRegistry.sol";

contract AgentWalletRegistryTest is Test {
    AgentWalletRegistry public registry;

    address public owner = makeAddr("owner");
    address public stranger = makeAddr("stranger");
    address public wallet1 = makeAddr("wallet1");
    address public wallet2 = makeAddr("wallet2");
    address public wallet3 = makeAddr("wallet3");

    string constant AGENT_A = "tg:alice";
    string constant AGENT_B = "xmtp:bob";
    string constant AGENT_C = "discord:charlie";

    event AgentRegistered(string indexed agentId, address indexed wallet);
    event AgentUpdated(string indexed agentId, address indexed oldWallet, address indexed newWallet);
    event AgentDeregistered(string indexed agentId, address indexed wallet);

    function setUp() public {
        vm.prank(owner);
        registry = new AgentWalletRegistry(owner);
    }

    // ── Construction ───────────────────────────────────────────────────

    function test_Constructor() public {
        assertEq(registry.owner(), owner, "owner should be set correctly");
    }

    // ── Register ──────────────────────────────────────────────────────

    function test_RegisterAgent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit AgentRegistered(AGENT_A, wallet1);
        registry.registerAgent(AGENT_A, wallet1);

        (address w, bool r) = registry.getAgent(AGENT_A);
        assertEq(w, wallet1, "wallet should match");
        assertTrue(r, "should be registered");

        (string memory aid, bool r2) = registry.getAgentByWallet(wallet1);
        assertEq(aid, AGENT_A, "reverse lookup should match");
        assertTrue(r2, "reverse lookup should be registered");
    }

    function test_RevertWhen_DuplicateAgentId() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectRevert("Agent ID already registered");
        registry.registerAgent(AGENT_A, wallet2);
        vm.stopPrank();
    }

    function test_RevertWhen_DuplicateWallet() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectRevert("Wallet already linked to an agent");
        registry.registerAgent(AGENT_B, wallet1);
        vm.stopPrank();
    }

    function test_RevertWhen_ZeroWallet() public {
        vm.prank(owner);
        vm.expectRevert("Wallet cannot be zero address");
        registry.registerAgent(AGENT_A, address(0));
    }

    function test_RevertWhen_EmptyAgentId() public {
        vm.prank(owner);
        vm.expectRevert("Agent ID cannot be empty");
        registry.registerAgent("", wallet1);
    }

    function test_RevertWhen_NotOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        registry.registerAgent(AGENT_A, wallet1);
    }

    // ── Update ────────────────────────────────────────────────────────

    function test_UpdateAgentWallet() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectEmit(true, true, true, false);
        emit AgentUpdated(AGENT_A, wallet1, wallet2);
        registry.updateAgentWallet(AGENT_A, wallet2);

        (address w,) = registry.getAgent(AGENT_A);
        assertEq(w, wallet2, "wallet should be updated");

        // Old wallet should be freed
        (string memory aid,) = registry.getAgentByWallet(wallet1);
        assertEq(aid, "", "old wallet should be free");
        vm.stopPrank();
    }

    function test_RevertWhen_UpdateUnregistered() public {
        vm.prank(owner);
        vm.expectRevert("Agent ID not registered");
        registry.updateAgentWallet(AGENT_A, wallet2);
    }

    function test_RevertWhen_UpdateToUsedWallet() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        registry.registerAgent(AGENT_B, wallet2);

        vm.expectRevert("New wallet already linked");
        registry.updateAgentWallet(AGENT_A, wallet2);
        vm.stopPrank();
    }

    // ── Deregister ────────────────────────────────────────────────────

    function test_DeregisterAgent() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectEmit(true, true, false, false);
        emit AgentDeregistered(AGENT_A, wallet1);
        registry.deregisterAgent(AGENT_A);

        (, bool r) = registry.getAgent(AGENT_A);
        assertFalse(r, "should no longer be registered");

        // Wallet mapping should be cleared
        (string memory aid, bool r2) = registry.getAgentByWallet(wallet1);
        assertEq(aid, "", "wallet mapping should be cleared");
        assertFalse(r2, "wallet should not be registered");
        vm.stopPrank();
    }

    function test_RevertWhen_DeregisterUnregistered() public {
        vm.prank(owner);
        vm.expectRevert("Agent ID not registered");
        registry.deregisterAgent("tg:nobody");
    }

    // ── Queries ───────────────────────────────────────────────────────

    function test_IsAgentRegistered() public {
        assertFalse(registry.isAgentRegistered(AGENT_A));

        vm.prank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        assertTrue(registry.isAgentRegistered(AGENT_A));
    }

    function test_BatchGetAgents() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        registry.registerAgent(AGENT_B, wallet2);
        // AGENT_C left unregistered
        vm.stopPrank();

        string[] memory ids = new string[](3);
        ids[0] = AGENT_A;
        ids[1] = AGENT_B;
        ids[2] = AGENT_C;

        (address[] memory wallets, bool[] memory registered) = registry.batchGetAgents(ids);

        assertEq(wallets.length, 3);
        assertEq(registered.length, 3);
        assertEq(wallets[0], wallet1);
        assertEq(wallets[1], wallet2);
        assertEq(wallets[2], address(0));
        assertTrue(registered[0]);
        assertTrue(registered[1]);
        assertFalse(registered[2]);
    }

    function test_GetAgentByWallet_Unknown() public {
        (string memory aid, bool registered) = registry.getAgentByWallet(wallet1);
        assertEq(aid, "");
        assertFalse(registered);
    }
}
