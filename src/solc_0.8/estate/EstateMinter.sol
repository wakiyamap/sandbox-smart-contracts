// SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;

import "./EstateBaseToken.sol";
import "../common/interfaces/IEstateMinter.sol";
import "../common/BaseWithStorage/ERC721BaseToken.sol";
import "@openzeppelin/contracts-0.8/token/ERC721/IERC721.sol";
import "../common/BaseWithStorage/ERC2771Handler.sol";
import "../common/FeeColector.sol"
import "@openzeppelin/contracts-0.8/token/ERC20/IERC20.sol";

contract EstateMinter is ERC2771Handler, IEstateMinter {
    EstateBaseToken internal _estateToken;
    address internal _backAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address internal _admin;
    uint256 internal _estateMintingFee;
    uint256 internal _estateUpdateFee;
    address internal _feeBeneficiary;
    IERC20 internal _sand;

    constructor(
        EstateBaseToken estateTokenContract,
        address trustedForwarder,
        address admin,
        uint256 estateMintingFee,
        uint256 estateUpdateFee,
        address feeBeneficiary,
        IERC20 sand,
        uint8 chainIndex
    ) {
        _estateToken = estateTokenContract;
        _admin = admin;
        _estateMintingFee = estateMintingFee;
        _estateUpdateFee = estateUpdateFee;
        _feeBeneficiary = feeBeneficiary;
        _sand = sand;
        ERC2771Handler.__ERC2771Handler_initialize(trustedForwarder);
    }

    function createEstate(
        EstateBaseToken.EstateCRUDData calldata creation,
        bytes calldata signature /* ,uint256 timeStamp */
    ) external override returns (uint256) {
        address msgSender = _msgSender();
        _chargeSand(msgSender, _estateMintingFee);
        _verifyAdjacencyCreate(
            creation,
            signature /* , timeStamp */
        );
        return
            _estateToken.createEstate(
                msgSender,
                creation,
                signature /* , timeStamp */
            );
        //return 12;
    }

    function updateEstate(
        uint256 estateId,
        EstateBaseToken.UpdateEstateData calldata update,
        bytes calldata signature
    ) external override returns (uint256) {
        address msgSender = _msgSender();
        _verifyAdjacencyUpdate(estateId, update, signature);
        _chargeSand(msgSender, _estateUpdateFee);
        return _estateToken.updateEstate(msgSender, estateId, update, signature);
    }

    function _verifyAdjacencyCreate(IEstateToken.EstateCRUDData memory creation, bytes memory signature) internal view {
        bytes32 hashedData = keccak256(abi.encodePacked(creation.landIds, creation.gameIds));
        address signer =
            SigUtil.recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hashedData)), signature);

        require(signer == _backAddress, "INVALID SIGNATURE");
    }

    function _verifyAdjacencyUpdate(
        uint256 estateId,
        IEstateToken.UpdateEstateData memory update,
        bytes memory signature
    ) internal view {
        bytes32 hashedData =
            keccak256(
                abi.encodePacked(
                    estateId,
                    update.landAndGameAssociationsToAdd[0],
                    update.landAndGameAssociationsToAdd[1],
                    update.landAndGameAssociationsToRemove[0],
                    update.landAndGameAssociationsToRemove[1]
                )
            );
        address signer =
            SigUtil.recover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hashedData)), signature);

        require(signer == _backAddress, "INVALID SIGNATURE");
    }

    /// @dev Charge a fee in Sand if conditions are met.
    /// @param from The address responsible for paying the fee.
    /// @param sandFee The fee that applies to the current operation (create || update).
    function _chargeSand(address from, uint256 sandFee) internal {
        if (_feeBeneficiary != address(0) && sandFee != 0) {
            _sand.transferFrom(from, _feeBeneficiary, sandFee);
        }
    }

    function changeFeeBeneficiary(address newBeneficiary) external override {
        address msgSender = _msgSender();
        require(msgSender == _admin, "ADMIN_ONLY");
        _feeBeneficiary = newBeneficiary;
    }

    function updateFees(uint256 newMintingFee, uint256 newUpdateFee) external override {
        address msgSender = _msgSender();
        require(msgSender == _admin, "ADMIN_ONLY");
        _estateMintingFee = newMintingFee;
        _estateUpdateFee = newUpdateFee;
    }

    function updateSand(IERC20 newSand) external {
        _sand = newSand;
    }
}
