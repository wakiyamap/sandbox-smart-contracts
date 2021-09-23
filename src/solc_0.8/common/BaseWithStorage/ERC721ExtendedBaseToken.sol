//SPDX-License-Identifier: MIT
/* solhint-disable func-order, code-complexity */
pragma solidity 0.8.2;

import "./ERC721BaseToken.sol";

contract ERC721ExtendedBaseToken is ERC721BaseToken {
    /// @notice Approve an operator to spend tokens on the senders behalf.
    /// @param operator The address receiving the approval.
    /// @param ids Ids of tokens.
    function batchApprove(address operator, uint256[] memory ids) public {
        address msgSender = _msgSender();
        batchApproveFor(msgSender, operator, ids);
    }

    /// @notice Approve an operator to spend tokens on the sender behalf.
    /// @param sender The address giving the approval.
    /// @param operator The address receiving the approval.
    /// @param ids The ids of tokens.
    function batchApproveFor(
        address sender,
        address operator,
        uint256[] memory ids
    ) public {
        address msgSender = _msgSender();
        require(sender != address(0), "ZERO_ADDRESS_SENDER");

        require(
            msgSender == sender || _superOperators[msgSender] || _operatorsForAll[sender][msgSender],
            "UNAUTHORIZED_APPROVAL"
        );

        bool sameOwner = true;
        bool ownerDataSetted = false;
        uint256 ownerData = 0;
        uint256 length = ids.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 ow = _owners[_storageId(ids[i])];
            if (ownerDataSetted && ownerData != ow) {
                sameOwner = false;
                ownerDataSetted = true;
                break;
            }
            ownerData = ow;
        }
        require(sameOwner, "OWNER_NOT_SENDER");

        require(address(uint160(ownerData)) == sender, "OWNER_NOT_SENDER");
        _batchApproveFor(ownerData, operator, ids);
    }

    /// @dev See approveFor.
    function _batchApproveFor(
        uint256 ownerData,
        address operator,
        uint256[] memory ids
    ) internal {
        uint256 flag = 0;
        address owner = address(uint160(ownerData));

        bool hasOperator = false;
        if (operator == address(0)) {
            flag = ((ownerData & NOT_ADDRESS) & NOT_OPERATOR_FLAG) | uint256(uint160(owner));
        } else {
            flag = (ownerData & NOT_ADDRESS) | OPERATOR_FLAG | uint256(uint160(owner));
            hasOperator = true;
        }

        uint256 length = ids.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 id = ids[i];
            _owners[_storageId(id)] = flag;
            if (hasOperator) {
                _operators[id] = operator;
            }
            emit Approval(owner, operator, id);
        }
    }
}
