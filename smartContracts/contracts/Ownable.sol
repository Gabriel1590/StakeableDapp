// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Ownable {
  address private _owner;
  
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  modifier onlyOwner {
    require(_owner == msg.sender, 'Ownable: Only owner can call this function.');
    _;
  }

  constructor() {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  function owner() public view returns(address) {
    return _owner;
  }

  function renounceOwnership() external onlyOwner {
    _owner = address(0);
    emit OwnershipTransferred(_owner, address(0));
  }

  function transferOwnership(address newOwner) external onlyOwner {
    _transferOwnership(newOwner);
  }

  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0), "Ownable: new owner is the zero address");
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }

}