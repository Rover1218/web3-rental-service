const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Deploying RentalService...");

    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    console.log("Deploying with account:", deployer.address);
    console.log("Deploying to network:", network);

    const RentalService = await hre.ethers.getContractFactory("RentalService");
    const rentalService = await RentalService.deploy();

    console.log("RentalService deployment in progress...");
    await rentalService.waitForDeployment();

    const contractAddress = await rentalService.getAddress();
    console.log("RentalService deployed to:", contractAddress);

    // Save the contract artifacts for frontend use
    saveFrontendFiles(rentalService);
}

function saveFrontendFiles(contract) {
    const contractsDir = path.join(__dirname, '../frontend');

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    // Save contract address
    fs.writeFileSync(
        path.join(contractsDir, 'contractAddress.json'),
        JSON.stringify({ address: contract.address }, null, 2)
    );

    console.log('Contract artifacts saved to frontend directory.');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });