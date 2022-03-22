//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ERC2771Handler} from "../common/BaseWithStorage/ERC2771Handler.sol";

abstract contract AvatarBase is
    Initializable,
    ContextUpgradeable,
    AccessControlUpgradeable,
    ERC721Upgradeable,
    ERC2771Handler,
    PausableUpgradeable
{
    // Just in case.
    uint256[50] private __gap1;

    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    string public baseTokenURI;

    function __AvatarBase_init_unchained(address adminRole, string memory baseTokenURI_) internal initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, adminRole);
        baseTokenURI = baseTokenURI_;
    }

    /// @dev Change the address of the trusted forwarder for meta-TX
    /// @param trustedForwarder_ The new trustedForwarder
    function setTrustedForwarder(address trustedForwarder_) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        _trustedForwarder = trustedForwarder_;
    }

    /// @dev Change the base url for token metadata
    /// @param baseUri_ The new base Url.
    function setBaseUrl(string calldata baseUri_) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        baseTokenURI = baseUri_;
    }

    /// @dev Puse the contract operation
    function pause() external {
        require(hasRole(PAUSE_ROLE, _msgSender()), "must have pause role");
        _pause();
    }

    /// @dev unpause the contract operation
    function unpause() external {
        require(hasRole(PAUSE_ROLE, _msgSender()), "must have pause role");
        _unpause();
    }

    /// @dev See {IERC165-supportsInterface}.
    /// We must implement supportsInterface here because ERC721Upgradeable is not abstract.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable, ERC721Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _msgSender() internal view override(ContextUpgradeable, ERC2771Handler) returns (address sender) {
        return ERC2771Handler._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771Handler) returns (bytes calldata) {
        return ERC2771Handler._msgData();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    // Just in case.
    uint256[50] private __gap2;
}
