const { assert } = require("chai");

const Ownable = artifacts.require('GabrielToken');

contract('Ownable', async (accounts) => {
  it('Transfer ownership', async () => {
    ownable = await Ownable.deployed();

    let owner = await ownable.owner();

    // make sure accounts[0] is the owner
    assert.equal(owner, accounts[0], 'The owner was not properly assigned');

    // transfer ownership to accounts[1]
    await ownable.transferOwnership(accounts[1]);

    // check that accounts[1] is the new owner
    owner = await ownable.owner();
    assert.equal(owner, accounts[1], 'The owner was not transferred correctly');
  })

  it('onlyOwner modifier', async () => {
    ownable = await Ownable.deployed();

    try {
      await ownable.transferOwnership(accounts[2], {from: accounts[2]});
    } catch (error) {
      assert.equal(error.reason, 'Ownable: Only owner can call this function.', 'Failed to stop non-owner from calling onlyOwner protected function');
    }
  })

  it('Renounce ownership', async () => {
    ownable = await Ownable.deployed();

    await ownable.renounceOwnership({ from: accounts[1] });

    let owner = await ownable.owner();
    
    assert.equal(owner, '0x0000000000000000000000000000000000000000', 'Renouncing owner was not correctly done');
  })
});