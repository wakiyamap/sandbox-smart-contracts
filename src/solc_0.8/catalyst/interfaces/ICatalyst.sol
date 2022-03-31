pragma solidity 0.8.2;

import "../../common/interfaces/IAssetAttributesRegistry.sol";
//import "../common/BaseWithStorage/ERC20/ERC20Token.sol";
//import "../../common/BaseWithStorage/ERC20/ERC20UpgradableBaseToken.sol";
import "../../common/interfaces/IAttributes.sol";
import "../../common/interfaces/IERC20Extended.sol";

interface ICatalyst is IERC20Extended, IAttributes {
    function catalystId() external returns (uint16);

    function changeAttributes(IAttributes attributes) external;

    function getMaxGems() external view returns (uint8);

    function approveFor(
        address owner,
        address spender,
        uint256 amount
    ) external override returns (bool success);

    //function getAttributes(uint256 assetId, IAssetAttributesRegistry.GemEvent[] calldata events) external;
}
