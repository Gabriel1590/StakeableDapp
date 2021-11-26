// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

contract Stakeable {

  uint256 internal rewardPerHour = 1000;

  /**
  * @notice
  * A stake struct is used to represent the way we store stakes, 
  * A Stake will contain the users address, the amount staked and a timestamp, 
  * Since which is when the stake was made
  */
  struct Stake {
    address user;
    uint256 amount;
    uint256 since;
    uint256 claimable;
  }

  /**
  * @notice Stakeholder is a staker that has active stakes
  */
  struct Stakeholder {
    address user;
    Stake[] address_stakes;
  }

  /**
  * @notice
  * StakingSummary is a struct that is used to contain all stakes performed by a certain account
  */ 
  struct StakingSummary{
    uint256 total_amount;
    Stake[] stakes;
  }

  /**
  * @notice 
  *   This is a array where we store all Stakes that are performed on the Contract
  *   The stakes for each address are stored at a certain index, the index can be found using the stakes mapping
  */
  Stakeholder[] internal stakeholders;

  /**
  * @notice 
  * stakes is used to keep track of the INDEX for the stakers in the stakes array
  */
  mapping(address => uint256) internal stakes;

  /**
  * @notice Staked event is triggered whenever a user stakes tokens, address is indexed to make it filterable
  */
  event Staked(address indexed user, uint256 amount, uint256 index, uint256 timestamp);
  
  constructor() {
    stakeholders.push();
  }

  function _stake(uint256 _amount) internal {
    require(_amount > 0, 'Stakeable: Cannot stake nothing');

    uint256 index = stakes[msg.sender];
    uint256 timestamp = block.timestamp;
    
    if (index == 0) {
      index = _addStakeholder(msg.sender);
    }

    stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp, 0));

    emit Staked(msg.sender, _amount, index, timestamp);
  }

  function _addStakeholder(address staker) internal returns (uint256) {
    stakeholders.push();
    uint256 userIndex = stakeholders.length - 1;
    stakeholders[userIndex].user = staker;
    stakes[staker] = userIndex;
    return userIndex;
  }

  function _withdrawStake(uint256 amount, uint256 index) internal returns (uint256) {
    uint256 user_index = stakes[msg.sender];
    Stake memory current_stake = stakeholders[user_index].address_stakes[index];

    require(current_stake.user == msg.sender, 'Stakeable: Cannot withdraw stake that is not yours');
    require(current_stake.amount >= amount, 'Stakeable: Cannot withdraw more tokens than you have staked');

    uint256 reward = calculateStakeReward(current_stake);
    current_stake.amount -= amount;

    if (current_stake.amount == 0) {
      delete stakeholders[user_index].address_stakes[index];
    } else {
      stakeholders[user_index].address_stakes[index].amount = current_stake.amount;
      stakeholders[user_index].address_stakes[index].since = block.timestamp;
    }

    return amount + reward;
  }

  function calculateStakeReward(Stake memory _current_stake) internal view returns (uint256) {
    // First calculate how long the stake has been active
    uint256 time_active = block.timestamp - _current_stake.since;
    uint256 time_active_hours = time_active / 1 hours;

    // we then multiply each token by the hours staked , then divide by the rewardPerHour rate 
    uint256 reward = (time_active_hours * _current_stake.amount) / rewardPerHour;
    return reward;
  }

  function hasStake(address _staker) external view returns (StakingSummary memory) {
    uint256 totalStakeAmount;

    StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);

    for (uint256 i = 0; i < summary.stakes.length; i++) {
      uint256 availableReward = calculateStakeReward(summary.stakes[i]);
      summary.stakes[i].claimable = availableReward;
      totalStakeAmount += summary.stakes[i].amount;
    }

    summary.total_amount = totalStakeAmount;
    return summary;
  }
}