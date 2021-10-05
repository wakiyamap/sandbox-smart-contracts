//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC2771Handler} from "../common/BaseWithStorage/ERC2771Handler.sol";
import {IAvatarMinter} from "../common/interfaces/IAvatarMinter.sol";

/// @dev Storage layout for the Avatar contract.
abstract contract AvatarBase is
    Initializable,
    ContextUpgradeable,
    AccessControlUpgradeable,
    ERC721Upgradeable,
    ERC2771Handler,
    IAvatarMinter
{
    string public baseTokenURI;

    function __AvatarBase_init(address adminRole, string memory baseTokenURI_) internal initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AvatarBase_init_unchained(adminRole, baseTokenURI_);
    }

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
    uint256[50] private __gap;
}
