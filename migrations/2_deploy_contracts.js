// Our AaveDeFI Contract
const AaveDeFi  = artifacts.require("AaveDeF")

module.exports = async (deployer) => {  

  await deployer.deploy(AaveDeFi)
    
}