//SPDX-License-Identifier: MIT
/* solhint-disable func-order, code-complexity */
pragma solidity 0.8.2;

import "../common/BaseWithStorage/ERC721BaseToken.sol";

contract SimplifiedLandBaseToken is ERC721BaseToken {
    // Our grid is 408 x 408 lands
    uint256 internal constant GRID_SIZE = 408;
    // set ChildChainManager as only minter for Polygon, but keep flexibility for other L2s
    mapping(address => bool) internal _minters;

    constructor(
        address trustedForwarder,
        uint8 chainIndex,
        address admin
    ) {
        _admin = admin;
        ERC721BaseToken.__ERC721BaseToken_initialize(chainIndex);
        ERC2771Handler.__ERC2771Handler_initialize(trustedForwarder);
    }

    // @todo implement land minting.
    // consider seperating into _mintLand & _mintLandBatch...
    // It is likeky that existing L1 estates(with quads) will be migrated to L2. make it easy for them to be reminted on L2.
    /**
    /// @notice Mint one or more lands
    /// @param to The recipient of the new quad
    /// @param x An array of x coordinates for the top left corner of lands to mint
    /// @param y An array of y coordinates for the top left corner of lands to mint
    /// @param data extra data to pass to the transfer
    function _mintLand(
        address to,
        uint256[] memory x,
        uint256[] memory y,
        bytes calldata // data
    ) internal {


        require(to != address(0), "to is zero address");
        require(isMinter(msg.sender), "Only a minter can mint");
        require(x % size == 0 && y % size == 0, "Invalid coordinates");
        require(x <= GRID_SIZE - size && y <= GRID_SIZE - size, "Out of bounds");

        uint256 quadId;
        uint256 id = x + y * GRID_SIZE;

        if (size == 1) {
            quadId = id;
        } else if (size == 3) {
            quadId = LAYER_3x3 + id;
        } else if (size == 6) {
            quadId = LAYER_6x6 + id;
        } else if (size == 12) {
            quadId = LAYER_12x12 + id;
        } else if (size == 24) {
            quadId = LAYER_24x24 + id;
        } else {
            require(false, "Invalid size");
        }

        require(_owners[LAYER_24x24 + (x / 24) * 24 + ((y / 24) * 24) * GRID_SIZE] == 0, "Already minted as 24x24");

        uint256 toX = x + size;
        uint256 toY = y + size;
        if (size <= 12) {
            require(_owners[LAYER_12x12 + (x / 12) * 12 + ((y / 12) * 12) * GRID_SIZE] == 0, "Already minted as 12x12");
        } else {
            for (uint256 x12i = x; x12i < toX; x12i += 12) {
                for (uint256 y12i = y; y12i < toY; y12i += 12) {
                    uint256 id12x12 = LAYER_12x12 + x12i + y12i * GRID_SIZE;
                    require(_owners[id12x12] == 0, "Already minted as 12x12");
                }
            }
        }

        if (size <= 6) {
            require(_owners[LAYER_6x6 + (x / 6) * 6 + ((y / 6) * 6) * GRID_SIZE] == 0, "Already minted as 6x6");
        } else {
            for (uint256 x6i = x; x6i < toX; x6i += 6) {
                for (uint256 y6i = y; y6i < toY; y6i += 6) {
                    uint256 id6x6 = LAYER_6x6 + x6i + y6i * GRID_SIZE;
                    require(_owners[id6x6] == 0, "Already minted as 6x6");
                }
            }
        }

        if (size <= 3) {
            require(_owners[LAYER_3x3 + (x / 3) * 3 + ((y / 3) * 3) * GRID_SIZE] == 0, "Already minted as 3x3");
        } else {
            for (uint256 x3i = x; x3i < toX; x3i += 3) {
                for (uint256 y3i = y; y3i < toY; y3i += 3) {
                    uint256 id3x3 = LAYER_3x3 + x3i + y3i * GRID_SIZE;
                    require(_owners[id3x3] == 0, "Already minted as 3x3");
                }
            }
        }

        for (uint256 i = 0; i < landIds.length; i++) {
            uint256 id = _idInPath(i, landIds.length, x, y);
            require(_owners[id] == 0, "Already minted");
            emit Transfer(address(0), to, id);
        }

        // _owners[quadId] = uint256(to);
        _numNFTPerAddress[to] += landIds.length;
        //@review
        // _checkBatchReceiverAcceptQuad(msg.sender, address(0), to, size, x, y, data);
    }
*/

    /// @notice check whether address `who` is given minter rights.
    /// @param who The address to query.
    /// @return whether the address has minter rights.
    function isMinter(address who) public view returns (bool) {
        return _minters[who];
    }

    /// @notice x coordinate of Land token
    /// @param id tokenId
    /// @return the x coordinates
    function x(uint256 id) external view returns (uint256) {
        require(_ownerOf(id) != address(0), "token does not exist");
        return id % GRID_SIZE;
    }

    /// @notice y coordinate of Land token
    /// @param id tokenId
    /// @return the y coordinates
    function y(uint256 id) external view returns (uint256) {
        require(_ownerOf(id) != address(0), "token does not exist");
        return id / GRID_SIZE;
    }

    /// @notice total width of the map
    /// @return width
    function width() external pure returns (uint256) {
        return GRID_SIZE;
    }

    /// @notice total height of the map
    /// @return height
    function height() external pure returns (uint256) {
        return GRID_SIZE;
    }

    function _idInPath(
        uint256 i,
        uint256 size,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256) {
        uint256 row = i / size;
        if (row % 2 == 0) {
            // alow ids to follow a path in a quad
            return (x + (i % size)) + ((y + row) * GRID_SIZE);
        } else {
            return ((x + size) - (1 + (i % size))) + ((y + row) * GRID_SIZE);
        }
    }
}
