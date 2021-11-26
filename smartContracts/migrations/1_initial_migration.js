const GabrielToken = artifacts.require("GabrielToken");

module.exports = async function (deployer, network, accounts) {
  // await while we deploy the DevToken
  await deployer.deploy(
    GabrielToken,
    'GabrielToken',
    'GAB',
    18,
    '500000000000',
  );
  const gabrielToken = await GabrielToken.deployed()
};