---
breaks: false

description: ERC-721 Extended contract description

---

# [ERC-721 Extended](https://github.com/thesandboxgame/sandbox-smart-contracts/blob/master/src/solc_0.8/common/BaseWithStorage/ERC721ExtendedBaseToken.sol)

## Introduction

This contract is an Extension on ERC-721.
It brings a new feature that is missing on ERC-721:
- The ability to approve the transfer of multiple tokens from one address to another.

This standard is used in Sandbox to represents Land and GameToken.


## Participants

- User: The user that approve multiple *ERC-721 token* transfer.
- Operator: The deployer and owner of the contract.

## Process

## Batch approval for ERC-721

### Step 1

Ensure that user address is not null address:
```
  address(0)
```

### Step 2

Ensure that all tokens belongs to user.

### Step 3

Approve transfer for all token from user's address to operator' address.

## Class diagram

```plantuml
@startuml
ERC721 <|-- ERC721BaseToken
ERC721BaseToken <|-- ERC721ExtendedBaseToken
class ERC721 {
    + uint256 balanceOf(address _owner)
    + address ownerOf(uint256 _tokenId)
    + void safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data)
    + void safeTransferFrom(address _from, address _to, uint256 _tokenId)
    + void transferFrom(address _from, address _to, uint256 _tokenId)
    + void approve(address _approved, uint256 _tokenId)
    + void setApprovalForAll(address _operator, bool _approved)
    + adress getApproved(uint256 _tokenId)
    + bool isApprovedForAll(address _owner, address _operator)
}
class ERC721BaseToken {
    + batchTransferFrom(address from, address to, uint256[] calldata ids, bytes calldata data)
    + void burn(uint256 id)
    + void burnFrom(address from, uint256 id)
}
class ERC721ExtendedBaseToken {
  + void batchApprove(address operator, uint256[] ids)
}
@enduml
```
## Sequence diagram

```plantuml
@startuml
  actor User
  participant ERC721ExtendedBaseToken
  participant Reject
  "User" -> "ERC721ExtendedBaseToken" : Call batchApprove with operator addresses, token ids
  "ERC721ExtendedBaseToken" -> "Reject" : user address is null
  "ERC721ExtendedBaseToken" -> "Reject" : not all taken belong to user
  "ERC721ExtendedBaseToken" -> "ERC721ExtendedBaseToken" : generate approval event for all token
  "ERC721ExtendedBaseToken" -> "ERC721ExtendedBaseToken" : approve transfer from owner address to operator address
@enduml
```
