// SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-version
pragma solidity 0.8.2;
import "@openzeppelin/contracts-0.8/token/ERC20/IERC20.sol";

contract FeeColector {
    address internal _admin;
    address internal _feeBeneficiary;
    IERC20 internal _sand;

    constructor(
        EstateBaseToken estateTokenContract,
        address admin,
        address feeBeneficiary,
        IERC20 sand,
    ) {
        _admin = admin;
        _feeBeneficiary = feeBeneficiary;
        _sand = sand;
        }


    /// @dev Charge a fee in Sand if conditions are met.
    /// @param from The address responsible for paying the fee.
    /// @param sandFee The fee that applies to the current operation (create || update).
    function _chargeSand(address from, uint256 fee) internal {
        if (_feeBeneficiary != address(0) && sandFee != 0) {
            _sand.transferFrom(from, _feeBeneficiary, sandFee);
        }
    }

    function changeFeeBeneficiary(address newBeneficiary) external override {
        address msgSender = _msgSender();
        require(msgSender == _admin, "ADMIN_ONLY");
        _feeBeneficiary = newBeneficiary;
    }

    //FINISH THIS, SHOULD BE REUSED FOR ESTATE AND GAME
}
