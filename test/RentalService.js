const { expect } = require("chai");
const { ethers } = require("hardhat");  // Add this line
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RentalService", function () {
    async function deployRentalServiceFixture() {
        const [owner, renter] = await ethers.getSigners();
        const RentalService = await ethers.getContractFactory("RentalService");
        const rentalService = await RentalService.deploy();

        return { rentalService, owner, renter };
    }

    describe("Item Management", function () {
        it("Should add a new item correctly", async function () {
            const { rentalService, owner } = await loadFixture(deployRentalServiceFixture);

            await expect(rentalService.addItem("Test Item", ethers.parseEther("0.1")))
                .to.emit(rentalService, "ItemAdded")
                .withArgs(0, "Test Item", ethers.parseEther("0.1"), owner.address);

            const item = await rentalService.getItem(0);
            expect(item.name).to.equal("Test Item");
            expect(item.pricePerDay).to.equal(ethers.parseEther("0.1"));
            expect(item.owner).to.equal(owner.address);
        });
    });

    describe("Rental Management", function () {
        it("Should rent an item correctly", async function () {
            const { rentalService, renter } = await loadFixture(deployRentalServiceFixture);

            await rentalService.addItem("Test Item", ethers.parseEther("0.1"));
            await expect(
                rentalService.connect(renter).rentItem(0, { value: ethers.parseEther("0.1") })
            ).to.emit(rentalService, "ItemRented")
                .withArgs(0, renter.address);

            const item = await rentalService.getItem(0);
            expect(item.isRented).to.be.true;
            expect(await rentalService.renters(0)).to.equal(renter.address);
        });

        it("Should return an item correctly", async function () {
            const { rentalService, renter } = await loadFixture(deployRentalServiceFixture);

            await rentalService.addItem("Test Item", ethers.parseEther("0.1"));
            await rentalService.connect(renter).rentItem(0, { value: ethers.parseEther("0.1") });
            await expect(rentalService.connect(renter).returnItem(0))
                .to.emit(rentalService, "ItemReturned")
                .withArgs(0, renter.address);

            const item = await rentalService.getItem(0);
            expect(item.isRented).to.be.false;
            expect(await rentalService.renters(0)).to.equal(ethers.ZeroAddress);  // Use ethers.ZeroAddress
        });
    });
});
