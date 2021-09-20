/* solhint-disable func-order, code-complexity */
pragma solidity 0.5.9;

import "./ERC721BaseToken.sol";

contract ERC721ExtendedBaseToken is ERC721BaseToken {

    /// @notice Approve an operator to spend tokens on the senders behalf.
    /// @param operator The address receiving the approval.
    /// @param ids Ids of tokens.
    function batchApprove(address operator, uint256[] memory ids) public view {

    }

}
