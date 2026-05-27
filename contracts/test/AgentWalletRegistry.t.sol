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

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AgentRegistered(string indexed agentId, address indexed wallet);
    event AgentUpdated(string indexed agentId, address indexed oldWallet, address indexed newWallet);
    event AgentDeactivated(string indexed agentId, address indexed previousWallet);

    function setUp() public {
        vm.prank(owner);
        registry = new AgentWalletRegistry(owner);
    }

    // ── Construction ───────────────────────────────────────────────────

    function test_Constructor() public {
        assertEq(registry.owner(), owner, "owner should be set correctly");
    }

    function test_RevertWhen_ConstructorZeroOwner() public {
        vm.expectRevert("Owner cannot be zero address");
        new AgentWalletRegistry(address(0));
    }

    function test_OwnershipTransfer() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        registry.transferOwnership(newOwner);
        assertEq(registry.owner(), newOwner);
    }

    function test_RevertWhen_TransferOwnershipNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert("Not owner");
        registry.transferOwnership(makeAddr("newOwner"));
    }

    // ── Register ──────────────────────────────────────────────────────

    function test_RegisterAgent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit AgentRegistered(AGENT_A, wallet1);
        registry.registerAgent(AGENT_A, wallet1);

        (address w, bool a) = registry.getAgent(AGENT_A);
        assertEq(w, wallet1, "wallet should match");
        assertTrue(a, "should be active");

        (string memory aid, bool a2) = registry.getAgentByWallet(wallet1);
        assertEq(aid, AGENT_A, "reverse lookup should match");
        assertTrue(a2, "reverse lookup should be active");
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

    function test_RevertWhen_RegisterNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert("Not owner");
        registry.registerAgent(AGENT_A, wallet1);
    }

    // ── Update ────────────────────────────────────────────────────────

    function test_UpdateAgent() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectEmit(true, true, true, false);
        emit AgentUpdated(AGENT_A, wallet1, wallet2);
        registry.updateAgent(AGENT_A, wallet2);

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
        registry.updateAgent(AGENT_A, wallet2);
    }

    function test_RevertWhen_UpdateToUsedWallet() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        registry.registerAgent(AGENT_B, wallet2);

        vm.expectRevert("New wallet already linked");
        registry.updateAgent(AGENT_A, wallet2);
        vm.stopPrank();
    }

    function test_RevertWhen_UpdateNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert("Not owner");
        registry.updateAgent(AGENT_A, wallet2);
    }

    // ── Deactivate ────────────────────────────────────────────────────

    function test_DeactivateAgent() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);

        vm.expectEmit(true, true, false, false);
        emit AgentDeactivated(AGENT_A, wallet1);
        registry.deactivateAgent(AGENT_A);

        (, bool active) = registry.getAgent(AGENT_A);
        assertFalse(active, "should no longer be active");

        // Wallet mapping should be cleared
        (string memory aid, bool a2) = registry.getAgentByWallet(wallet1);
        assertEq(aid, "", "wallet mapping should be cleared");
        assertFalse(a2, "wallet should not be active");
        vm.stopPrank();
    }

    function test_RevertWhen_DeactivateUnregistered() public {
        vm.prank(owner);
        vm.expectRevert("Agent ID not registered");
        registry.deactivateAgent("tg:nobody");
    }

    function test_RevertWhen_DeactivateNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert("Not owner");
        registry.deactivateAgent(AGENT_A);
    }

    // ── Queries ───────────────────────────────────────────────────────

    function test_IsAgentActive() public {
        assertFalse(registry.isAgentActive(AGENT_A));

        vm.prank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        assertTrue(registry.isAgentActive(AGENT_A));
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

        (address[] memory wallets, bool[] memory active) = registry.batchGetAgents(ids);

        assertEq(wallets.length, 3);
        assertEq(active.length, 3);
        assertEq(wallets[0], wallet1);
        assertEq(wallets[1], wallet2);
        assertEq(wallets[2], address(0));
        assertTrue(active[0]);
        assertTrue(active[1]);
        assertFalse(active[2]);
    }

    function test_GetAgentByWallet_Unknown() public {
        (string memory aid, bool active) = registry.getAgentByWallet(wallet1);
        assertEq(aid, "");
        assertFalse(active);
    }

    function test_DeactivateThenReactivate() public {
        vm.startPrank(owner);
        registry.registerAgent(AGENT_A, wallet1);
        registry.deactivateAgent(AGENT_A);

        // Can register again after deactivation
        registry.registerAgent(AGENT_A, wallet2);
        (address w, bool active) = registry.getAgent(AGENT_A);
        assertEq(w, wallet2);
        assertTrue(active);
        vm.stopPrank();
    }
}
