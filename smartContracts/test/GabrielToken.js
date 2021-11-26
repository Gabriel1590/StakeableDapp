const { assert } = require("chai");

const GabrielToken = artifacts.require('GabrielToken');

contract('GabrielToken', async accounts => {
  it('Initial Supply', async () => {
    gabrielToken = await GabrielToken.deployed();

    let supply = await gabrielToken.totalSupply();

    assert.equal(supply.toNumber(), 500000000000, 'Initial supply was not the same as in migration');
  });

  it('Minting', async () => {
    gabrielToken = await GabrielToken.deployed();

    // Verify account 1 balance
    let initial_balance = await gabrielToken.balanceOf(accounts[1]);
    assert.equal(initial_balance.toNumber(), 0, 'Initial balance for account 1 should be 0');

    // Mint 100 tokens to account 1
    let totalSupply = await gabrielToken.totalSupply();
    await gabrielToken.mint(accounts[1], 100);

    let after_mint_balance = await gabrielToken.balanceOf(accounts[1]);
    let after_mint_totalSupply = await gabrielToken.totalSupply();

    assert.equal(after_mint_balance.toNumber(), 100, 'Balance for account 1 should be 100');
    assert.equal(after_mint_totalSupply.toNumber(), totalSupply.toNumber() + 100, 'Total supply should add the 100 minted tokens');

    try {
      await gabrielToken.mint('0x0000000000000000000000000000000000000000', 100);
      assert.fail('Minting should fail');
    } catch (error) {
      assert.equal(error.reason, 'GabrielToken: Cannot mint to zero address', 'Failed to stop minting on zero address');
    }
  });

  it('Burning', async () => {
    gabrielToken = await GabrielToken.deployed();

    // Get initial balance for account 1
    let initial_balance = await gabrielToken.balanceOf(accounts[1]);

    // Burn to address 0
    try {
      await gabrielToken.burn('0x0000000000000000000000000000000000000000', 100);
    } catch (error) {
      assert.equal(error.reason, 'GabrielToken: Cannot burn from zero address', 'Failed to notice burning on 0 address');
    }

    // Burn more than balance
    try {
      await gabrielToken.burn(accounts[1], initial_balance.toNumber() + 1);
    } catch (error) {
      assert.equal(error.reason, 'GabrielToken: Cannot burn more than balance', 'Failed to notice burning more than balance');
    }

    let totalSupply = await gabrielToken.totalSupply();
    try {
      await gabrielToken.burn(accounts[1], initial_balance - 50);
    } catch (error) {
      assert.fail(error);
    }

    let after_burn_balance = await gabrielToken.balanceOf(accounts[1]);

    // Make sure balance was reduced and total supply was reduced
    assert.equal(after_burn_balance.toNumber(), initial_balance.toNumber() - 50, 'Balance for account 1 should be 50 less than initial');

    let after_burn_totalSupply = await gabrielToken.totalSupply();
    assert.equal(after_burn_totalSupply.toNumber(), totalSupply.toNumber() - 50, 'Total supply should be 50 less than initial');
  });

  it('Transfering', async() => {
    gabrielToken = await GabrielToken.deployed();

    // Get initial balance for account 1
    let initial_balance = await gabrielToken.balanceOf(accounts[1]);

    // Transfer from address 0 to 1
    await gabrielToken.transfer(accounts[1], 100);

    let after_transfer_balance = await gabrielToken.balanceOf(accounts[1]);

    // Make sure balance was added 
    assert.equal(after_transfer_balance.toNumber(), initial_balance.toNumber() + 100, 'Balance for account 1 should be 100 more than initial');

    let account2_initial_balance = await gabrielToken.balanceOf(accounts[2]);

    await gabrielToken.transfer(accounts[2], 20, { from: accounts[1] });
    
    let account2_after_transfer_balance = await gabrielToken.balanceOf(accounts[2]);
    let account1_after_transfer_balance = await gabrielToken.balanceOf(accounts[1]);

    assert.equal(account2_after_transfer_balance.toNumber(), account2_initial_balance.toNumber() + 20, 'Balance for account 2 should be 20 more than initial');
    assert.equal(account1_after_transfer_balance.toNumber(), after_transfer_balance.toNumber() - 20, 'Balance for account 1 should be 20 less than initial');

    try {
      await gabrielToken.transfer(accounts[2], 2000000000, { from: accounts[1] });
    } catch (error) {
      assert.equal(error.reason, 'GabrielToken: Insufficient funds', 'Failed to notice transfer amount exceeding balance');
    }
  });

  it ("allow account some allowance", async() => {
    gabrielToken = await GabrielToken.deployed();

    
    try{
      // Give account(0) access too 100 tokens on creator
      await gabrielToken.approve('0x0000000000000000000000000000000000000000', 100);    
    }catch(error){
      assert.equal(error.reason, 'GabrielToken: approve cannot be done to zero address', "Should be able to approve zero address");
    }

    try{
      // Give account 1 access too 100 tokens on zero account
      await gabrielToken.approve(accounts[1], 100);    
    }catch(error){
      assert.fail(error); // shold not fail
    }

    // Verify by checking allowance
    let allowance = await gabrielToken.allowance(accounts[0], accounts[1]);

    assert.equal(allowance.toNumber(), 100, "Allowance was not correctly inserted");
  });

  it("transfering with allowance", async() => {
    gabrielToken = await GabrielToken.deployed();

    try{
      // Account 1 should have 100 tokens by now to use on account 0 
      // lets try using more 
      await gabrielToken.transferFrom(accounts[0], accounts[2], 200, { from: accounts[1] } );
    }catch(error){
      assert.equal(error.reason, "GabrielToken: not enough allowance", "Failed to detect overspending")
    }

    try{
      // Account 1 should have 100 tokens by now to use on account 0 
      // lets try using more 
      let worked = await gabrielToken.transferFrom(accounts[0], accounts[2], 50, {from:accounts[1]});
    }catch(error){
      assert.fail(error);
    }

    // Make sure allowance was changed
    let allowance = await gabrielToken.allowance(accounts[0], accounts[1]);
    assert.equal(allowance.toNumber(), 50, "The allowance should have been decreased by 50")  
  });
});