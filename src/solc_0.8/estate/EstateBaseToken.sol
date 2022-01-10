//SPDX-License-Identifier: MIT
// solhint-disable code-complexity
pragma solidity 0.8.2;

import "../common/BaseWithStorage/ImmutableERC721.sol";
import "../common/interfaces/ILandToken.sol";
import "../Game/GameBaseToken.sol";
import "../common/interfaces/IERC721MandatoryTokenReceiver.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../common/Libraries/UintToUintMap.sol";
import "../common/BaseWithStorage/WithMinter.sol";
import "@openzeppelin/contracts-0.8/utils/structs/EnumerableSet.sol";
import "hardhat/console.sol";

/// @dev An updated Estate Token contract using a simplified verison of LAND with no Quads

contract EstateBaseToken is ImmutableERC721, Initializable, WithMinter {
    using EnumerableMap for EnumerableMap.UintToUintMap;
    using EnumerableSet for EnumerableSet.UintSet;
    uint8 internal constant OWNER = 0;
    uint8 internal constant ADD = 1;
    uint8 internal constant BREAK = 2;
    uint8 internal constant WITHDRAWAL = 3;
    uint16 internal constant GRID_SIZE = 408;
    uint64 internal _nextId; // max uint64 = 18,446,744,073,709,551,615
    mapping(uint256 => bytes32) internal _metaData;

    // estates key = storageId
    // EnumerableMap.UintToUintMap keys = land ids
    // EnumerableMap.UintToUintMap values = game ids
    //map to a map
    mapping(uint256 => EnumerableMap.UintToUintMap) internal estates;

    // gamesToLands key = gameId, value = landIds
    mapping(uint256 => EnumerableSet.UintSet) internal gamesToLands;
    //yes we can have multiple lands per games
    //I wonder why use sets
    //what's the impact on gas

    LandToken internal _land;
    GameBaseToken internal _gameToken;

    /// @param landIds LAND tokenIds added, Games added, Games removed, uri
    /// @param gameId Games added
    /// @param uri ipfs hash (without the prefix, assume cidv1 folder)
    struct EstateCRUDData {
        uint256[] landIds;
        uint256[] gameIds;
        bytes32 uri;
    }
    struct EstateData {
        uint256[] landIds;
        uint256[] gameIds;
    }

    //this is a new struct that I was working for the update
    //landAndGameAssociations would be the landid and the corresponding gameId
    struct UpdateEstateData {
        uint256[][] landAndGameAssociationsToAdd;
        uint256[][] landAndGameAssociationsToRemove;
        uint256[] gameIdsToReuse;
        uint256[] landIdsToAdd;
        uint256[] landIdsToRemove;
        bytes32 uri;
    }

    /// @dev Emits when a estate is updated.
    /// @param oldId The id of the previous erc721 ESTATE token.
    /// @param newId The id of the newly minted token.
    /// @param update The changes made to the Estate.
    event EstateTokenUpdated(uint256 indexed oldId, uint256 indexed newId, EstateCRUDData update);

    /// @dev Emits when a estate is updated.
    /// @param oldId The id of the previous erc721 ESTATE token.
    /// @param newId The id of the newly minted token.
    /// @param update The changes made to the Estate.
    event EstateTokenUpdatedII(uint256 indexed oldId, uint256 indexed newId, UpdateEstateData update);

    function initV1(
        address trustedForwarder,
        LandToken land,
        GameBaseToken gameToken,
        uint8 chainIndex
    ) public initializer {
        _gameToken = gameToken;
        _land = land;
        ERC721BaseToken.__ERC721BaseToken_initialize(chainIndex);
    }

    // @todo Add access-control: minter-only? could inherit WithMinter.sol, the game token creator is minter only
    /// @notice Create a new estate token with lands.
    /// @param from The address of the one creating the estate.
    /// @param to The address that will own the estate.
    /// @param creation The data to use to create the estate.
    function createEstate(
        address from,
        address to,
        EstateCRUDData calldata creation
    ) external returns (uint256) {
        _check_authorized(from, ADD);
        (uint256 estateId, uint256 storageId) = _mintEstate(from, to, _nextId++, 1, true);
        _metaData[storageId] = creation.uri;
        _addLandsGames(from, storageId, creation.landIds, creation.gameIds);
        emit EstateTokenUpdated(0, estateId, creation);
        return estateId;
    }

    //this is the update function that I was working on, it is still incomplete
    /* function updateEstate(
        address from,
        address to,
        uint256 estateId,
        UpdateEstateData memory update
    ) external returns (uint256) {
        _check_hasOwnerRights(from, estateId);
        uint256 storageId = _storageId(estateId);
        _metaData[storageId] = update.uri;
        _check_authorized(from, ADD);

        if (update.landAndGameAssociations.length > 0) {
            uint256[] memory landsToAdd = new uint256[](update.landAndGameAssociations.length);
            // uint256[] memory gamesToAdd = new uint256[](update.landAndGameAssociations.length); //this shoukd be a =/= size
            (
                landsToAdd //, gamesToAdd
            ) = compareAndAdd(storageId, update.landAndGameAssociations);
            //need to implement this

            if (landsToAdd.length > 0) {
                _land.batchTransferFrom(from, address(this), landsToAdd, "");
            }
            if (update.gameIdsToAdd.length > 0) {
                //uint256[] memory filteredGames = filterArray(gamesToAdd);
                _gameToken.batchTransferFrom(from, address(this), update.gameIdsToAdd, "");
            }
        }

        if (update.gameIdsToRemove.length > 0) {
            _removeGamesAndLands(storageId, update.landIdsToRemove, update.gameIdsToRemove);
            //_gameToken.batchTransferFrom(address(this), from, update.gameIdsToRemove, "");
        }

        if (update.landIdsToRemove.length > 0) {
            //Verify that we're not leaving unlinked games

            //uint256[] memory gameIdsToRemove;
            //(gameIdsToRemove, ) = _setGamesOfLands(storageId, landsToRemove, new uint256[](landsToRemove.length), true);

            //if (!isBurned(estateId)) {
            //for (uint256 j = 0; j < gameIdsToRemove.length; j++) {
            //require(gamesToLands[gameIdsToRemove[j]].length() == 0, "GAME_IS_ATTACHED_TO_OTHER_LANDS");
            //}
            //}

            _gameToken.batchTransferFrom(from, address(this), update.gameIdsToAdd, "");
            _land.batchTransferFrom(address(this), from, update.landIdsToRemove, "");
        }

        uint256 newId = _incrementTokenVersion(to, estateId);
        console.log("what is old estate id here ");
        console.log(estateId);
        console.log("what is new estate id here ");
        console.log(newId);
        emit EstateTokenUpdatedII(estateId, newId, update);
        return newId;
    } */

    function updateEstateV2(
        address from,
        address to,
        uint256 estateId,
        UpdateEstateData memory update
    ) external returns (uint256) {
        _check_hasOwnerRights(from, estateId);
        uint256 storageId = _storageId(estateId);
        _metaData[storageId] = update.uri;
        _check_authorized(from, ADD);

        uint256 gameToAddLength = update.landAndGameAssociationsToAdd[1].length;
        uint256 gameToRemoveLength = update.landAndGameAssociationsToRemove[1].length;
        uint256 gameIdsToReuseLength = update.gameIdsToReuse.length;

        /** add lands */
        _addLands(storageId, from, update.landIdsToAdd);

        /** remove association*/
        if (gameToRemoveLength > 0) {
            require(
                gameToRemoveLength == update.landAndGameAssociationsToRemove[0].length,
                "DIFFERENT_LENGTH_LANDS_GAMES"
            );
            require(update.gameIdsToReuse.length < gameToAddLength, "GAMES_TO_REUSE_MUST_BE_PRESENT_IN_GAMES_TO_ADD");
            require(
                update.gameIdsToReuse.length < gameToRemoveLength,
                "GAMES_TO_REUSE_MUST_BE_PRESENT_IN_GAMES_TO_REMOVE"
            );
            for (uint256 i = 0; i < gameIdsToReuseLength; i++) {
                require(
                    update.gameIdsToReuse[i] == update.landAndGameAssociationsToAdd[1][i],
                    "GAMES_TO_REUSE_MUST_BE_PRESENT_IN_GAMES_TO_ADD"
                );
            }
            uint256 newLength = gameToRemoveLength - gameIdsToReuseLength;
            uint256[] memory gamesToTransfer = new uint256[](newLength);
            for (uint256 i = gameIdsToReuseLength; i < gameToRemoveLength; i++) {
                gamesToTransfer[i - gameIdsToReuseLength] = update.landAndGameAssociationsToRemove[1][i];
            }

            _removeGamesOfLands(from, storageId, update.landAndGameAssociationsToRemove[1], gamesToTransfer);
        }

        /** add association*/
        if (gameToAddLength > 0) {
            require(gameToAddLength == update.landAndGameAssociationsToAdd[0].length, "DIFFERENT_LENGTH_LANDS_GAMES");
            _addLandsGamesAssociation(
                from,
                storageId,
                update.landAndGameAssociationsToAdd[0],
                update.landAndGameAssociationsToAdd[1]
            );
        }

        /** remove lands */
        _removeLands(storageId, from, update.landIdsToRemove);

        uint256 newId = _incrementTokenVersion(to, estateId);
        emit EstateTokenUpdatedII(estateId, newId, update);
    }

    function _addLandsGames(
        address sender,
        uint256 storageId,
        uint256[] memory landIdsToAdd,
        uint256[] memory gameIds
    ) internal {
        require(landIdsToAdd.length > 0, "EMPTY_LAND_IDS_ARRAY");

        (uint256[] memory sizes, uint256[] memory xs, uint256[] memory ys) = _separateId(landIdsToAdd);
        _land.batchTransferQuad(sender, address(this), sizes, xs, ys, "");
        _addLandsGamesAssociation(sender, storageId, landIdsToAdd, gameIds);
    }

    function _addLandsGamesAssociation(
        address sender,
        uint256 storageId,
        uint256[] memory landIds,
        uint256[] memory gameIds
    ) internal {
        for (uint256 i = 0; i < landIds.length; i++) {
            uint256 gameId = gameIds[i];
            if (gameId != 0) {
                (bool occupied, ) = estates[storageId].tryGet(landIds[i]);
                require(!occupied, "LAND_ALREADY_OCCUPIED");
                estates[storageId].set(landIds[i], gameId);
                gamesToLands[gameId].add(landIds[i]);
            }
        }
        _gameToken.batchTransferFrom(sender, address(this), gameIds, "");
    }

    function _removeGamesOfLands(
        address from,
        uint256 storageId,
        uint256[] memory gameAssociationsToRemove,
        uint256[] memory gameIdsToRemove
    ) internal {
        uint256[] memory landsFromGames;
        for (uint256 i = 0; i < gameAssociationsToRemove.length; i++) {
            landsFromGames = getLandsForGame(gameAssociationsToRemove[i]);
            delete (gamesToLands[gameAssociationsToRemove[i]]);
            for (uint256 j = 0; j < landsFromGames.length; j++) {
                estates[storageId].set(landsFromGames[j], 0);
            }
        }
        _gameToken.batchTransferFrom(address(this), from, gameIdsToRemove, "");
    }

    function _addLands(
        uint256 storageId,
        address from,
        uint256[] memory landIdsToAdd
    ) internal {
        uint256 len = landIdsToAdd.length;
        for (uint256 i = 0; i < len; i++) {
            estates[storageId].set(landIdsToAdd[i], 0);
        }
        _land.batchTransferFrom(from, address(this), landIdsToAdd, "");
    }

    function _removeLands(
        uint256 storageId,
        address from,
        uint256[] memory landIdsToRemove
    ) internal {
        uint256 len = landIdsToRemove.length;
        for (uint256 i = 0; i < len; i++) {
            (bool occupied, ) = estates[storageId].tryGet(landIdsToRemove[i]);
            require(!occupied, "GAME_STILL_HOLDS_A_LAND");
            require(estates[storageId].remove(landIdsToRemove[i]), "LAND_DOES_NOT_EXIST");
        }
        _land.batchTransferFrom(address(this), from, landIdsToRemove, "");
    }

    /// @notice Burns token `id`.
    /// @param id The token which will be burnt.
    function burn(uint256 id) public override {
        address sender = _msgSender();
        _check_authorized(sender, BREAK);
        _check_hasOwnerRights(sender, id);
        _burn(sender, _ownerOf(id), id);
    }

    /// @notice Burn token`id` from `from`.
    /// @param from address whose token is to be burnt.
    /// @param id The token which will be burnt.
    function burnFrom(address from, uint256 id) external override {
        require(from != address(uint160(0)), "NOT_FROM_ZERO_ADDRESS");

        (address owner, bool operatorEnabled) = _ownerAndOperatorEnabledOf(id);

        require(owner != address(uint160(0)), "NONEXISTENT_TOKEN");

        address msgSender = _msgSender();

        require(
            msgSender == from ||
                (operatorEnabled && _operators[id] == msgSender) ||
                _superOperators[msgSender] ||
                _operatorsForAll[from][msgSender],
            "UNAUTHORIZED_BURN"
        );

        _burn(from, owner, id);
    }

    function getEstateData(uint256 estateId) public view returns (EstateData memory) {
        uint256 storageId = _storageId(estateId);
        uint256 length = estates[storageId].length();
        uint256[] memory landIds = new uint256[](length);
        uint256[] memory gameIds = new uint256[](length);
        if (!isBurned(estateId)) {
            //console.log("do we enter the burned part for estate? ");
            for (uint256 i = 0; i < length; i++) {
                (uint256 landId, uint256 gameId) = estates[storageId].at(i);
                landIds[i] = landId;
                gameIds[i] = gameId;
            }
        }
        return EstateData({landIds: landIds, gameIds: gameIds});
    }

    function getLandsForGame(uint256 gameId) public view returns (uint256[] memory) {
        uint256[] memory landIds = new uint256[](gamesToLands[gameId].length());
        for (uint256 i = 0; i < gamesToLands[gameId].length(); i++) {
            landIds[i] = gamesToLands[gameId].at(i);
        }

        return landIds; //gamesToLands[gameId].values();
    }

    /// @notice Return the name of the token contract.
    /// @return The name of the token contract.
    function name() external pure returns (string memory) {
        return "The Sandbox: ESTATE token";
    }

    /// @notice Get the symbol of the token contract.
    /// @return the symbol of the token contract.
    function symbol() external pure returns (string memory) {
        return "ESTATE";
    }

    /// @notice Return the URI of a specific token.
    /// @param id The id of the token.
    /// @return uri The URI of the token metadata.
    function tokenURI(uint256 id) public view returns (string memory uri) {
        require(_ownerOf(id) != address(0), "BURNED_OR_NEVER_MINTED");
        uint256 immutableId = _storageId(id);
        return _toFullURI(_metaData[immutableId]);
    }

    function onERC721BatchReceived(
        address, // operator,
        address, // from,
        uint256[] calldata, // ids,
        bytes calldata // data
    ) external pure returns (bytes4) {
        revert("please call createEstate or updateEstate functions");
    }

    function onERC721Received(
        address, // operator,
        address, // from,
        uint256, // tokenId,
        bytes calldata // data
    ) external pure returns (bytes4) {
        revert("please call createEstate or updateEstate functions");
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////////

    //this is a function to separate land ids into its x and y coordianates
    function _separateId(
        uint256[] memory landIds //sizes are always 1
    )
        internal
        returns (
            uint256[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        uint256 numLds = landIds.length;
        uint256[] memory sizes = new uint256[](numLds);
        uint256[] memory xs = new uint256[](numLds);
        uint256[] memory ys = new uint256[](numLds);

        for (uint256 i = 0; i < numLds; i++) {
            sizes[i] = 1;
            xs[i] = _land.x(landIds[i]);
            ys[i] = _land.y(landIds[i]);
        }
        return (sizes, xs, ys);
    }

    /// @dev used to increment the version in a tokenId by burning the original and reminting a new token. Mappings to token-specific data are preserved via the storageId mechanism.
    /// @param from The address of the token owner.
    /// @param estateId The tokenId to increment.
    /// @return the version-incremented tokenId.
    function _incrementTokenVersion(address from, uint256 estateId) internal returns (uint256) {
        address originalCreator = address(uint160(estateId / CREATOR_OFFSET_MULTIPLIER));

        uint64 subId = uint64(estateId / SUBID_MULTIPLIER);

        uint16 version = uint16(estateId);

        version++;

        address owner = _ownerOf(estateId);

        if (from == owner) {
            _burn(from, owner, estateId);
        }

        (uint256 newId, ) = _mintEstate(originalCreator, owner, subId, version, false);

        address newOwner = _ownerOf(newId);

        require(owner == newOwner, "NOT_OWNER");

        return newId;
    }

    /// @dev Create a new (or incremented) estateId and associate it with an owner.
    /// @param from The address of one creating the Estate.
    /// @param to The address of the Estate owner.
    /// @param subId The id to use when generating the new estateId.
    /// @param version The version number part of the estateId.
    /// @param isCreation Whether this is a brand new Estate (as opposed to an update).
    /// @return id The newly created estateId.
    /// @return storageId The staorage Id for the token.
    function _mintEstate(
        address from,
        address to,
        uint64 subId,
        uint16 version,
        bool isCreation
    ) internal returns (uint256, uint256 storageId) {
        require(to != address(uint160(0)), "CAN'T_SEND_TO_ZERO_ADDRESS");
        uint16 idVersion;
        uint256 estateId;

        uint256 strgId;

        if (isCreation) {
            idVersion = 1;
            estateId = _generateTokenId(from, subId, _chainIndex, idVersion);
            strgId = _storageId(estateId);
            require(_owners[strgId] == 0, "STORAGE_ID_REUSE_FORBIDDEN");
        } else {
            idVersion = version;
            estateId = _generateTokenId(from, subId, _chainIndex, idVersion);
            strgId = _storageId(estateId);
        }

        _owners[strgId] = (uint256(idVersion) << 200) + uint256(uint160(to));
        _numNFTPerAddress[to]++;
        emit Transfer(address(0), to, estateId);
        return (estateId, strgId);
    }

    function _check_authorized(address sender, uint8 action) internal view {
        require(sender != address(uint160(0)), "SENDER_IS_ZERO_ADDRESS");
        address msgSender = _msgSender();
        if (action == ADD) {
            address minter = _minter;
            require(msgSender == minter || msgSender == sender, "UNAUTHORIZED_ADD");
        } else {
            require(msgSender == sender, "NOT_AUTHORIZED");
        }
    }

    function _check_hasOwnerRights(address sender, uint256 estateId) internal view {
        (address owner, bool operatorEnabled) = _ownerAndOperatorEnabledOf(estateId);

        require(owner != address(uint160(0)), "TOKEN_DOES_NOT_EXIST");

        address msgSender = _msgSender();

        require(
            owner == sender ||
                _superOperators[msgSender] ||
                _operatorsForAll[sender][msgSender] ||
                (operatorEnabled && _operators[estateId] == msgSender),
            "NOT_APPROVED"
        );
    }

    function _encode(
        uint16 x,
        uint16 y,
        uint8 size
    ) internal pure returns (uint24) {
        return uint24(size) * uint24(2**18) + (uint24(x) + uint24(y) * GRID_SIZE);
    }

    function _decode(uint24 data)
        internal
        pure
        returns (
            uint16 x,
            uint16 y,
            uint8 size
        )
    {
        size = uint8(data / (2**18));
        y = uint16((data % (2**18)) / GRID_SIZE);
        x = uint16(data % GRID_SIZE);
    }

    /// @dev Get the a full URI string for a given hash + gameId.
    /// @param hash The 32 byte IPFS hash.
    /// @return The URI string.
    function _toFullURI(bytes32 hash) internal pure override returns (string memory) {
        return string(abi.encodePacked("ipfs://bafybei", hash2base32(hash), "/", "estate.json"));
    }

    function isItInArray(uint256 id, uint256[] memory landIds) public pure returns (bool) {
        uint256 size = landIds.length;
        bool flag = false;

        for (uint256 i = 0; i < size; i++) {
            if (landIds[i] == id) {
                flag = true;
                break;
            }
        }

        return flag;
    }

    // solhint-enable code-complexity
}
