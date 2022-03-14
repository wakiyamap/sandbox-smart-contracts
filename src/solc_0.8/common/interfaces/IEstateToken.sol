//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

/// @title Interface for the Estate token

interface IEstateToken {
    struct EstateCRUDData {
        uint256[] landIds;
        uint256[] gameIds;
        bytes32 uri;
    }

    struct EstateData {
        uint256[] landIds;
        uint256[] gameIds;
    }

    struct UpdateEstateData {
        uint256[][] landAndGameAssociationsToAdd;
        uint256[][] landAndGameAssociationsToRemove;
        //uint256[] gameIdsToRemain;
        uint256[] landIdsToAdd;
        uint256[] landIdsToRemove;
        uint256[] gameIdsToAdd;
        uint256[] gameIdsToRemove;
        bytes32 uri;
    }

    /* function initV1(
        address trustedForwarder,
        address admin,
        //address minter,
        LandToken land,
        GameBaseToken gameToken,
        uint8 chainIndex
    ) public initializer; */

    function createEstate(
        address from,
        /* address to, */
        EstateCRUDData calldata creation,
        bytes calldata signature /* , uint256 timeStamp */
    ) external returns (uint256);

    function updateEstate(
        address from,
        uint256 estateId,
        UpdateEstateData memory update,
        bytes calldata signature
    ) external returns (uint256);
    /*
    function burnFrom(address from, uint256 id) external;

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);
 */
    /* function onERC721Received(

    ) external pure returns (bytes4);

    function onERC721BatchReceived(

    ) external pure returns (bytes4); */
}
