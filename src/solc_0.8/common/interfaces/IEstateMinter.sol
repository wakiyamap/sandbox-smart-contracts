//SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import "./IEstateToken.sol";

interface IEstateMinter {
    function createEstate(
        IEstateToken.EstateCRUDData calldata creation,
        bytes calldata signature /* , uint256 timeStamp */
    ) external returns (uint256);

    function updateEstate(
        uint256 estateId,
        IEstateToken.UpdateEstateData calldata update,
        bytes calldata signature
    ) external returns (uint256);

    function changeFeeBeneficiary(address newBeneficiary) external;

    function updateFees(uint256 newMintingFee, uint256 newUpdateFee) external;
}
