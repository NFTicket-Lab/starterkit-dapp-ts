import { expect, use } from "chai";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";

describe("Main contract init and test", () => {

	async function deployInitFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, addr1] = await ethers.getSigners();
	
		const Main = await ethers.getContractFactory("Main");
		const main = await Main.deploy();
		await main.initialize();
		return { main, owner, addr1 };
	  }


	describe.only("deploy main test", () => {

		it("deploy and mint token", async () => {
			const {
				main:mainContract, owner, addr1
			} = await deployInitFixture();
			await mainContract.init_deploy("protocol","ERC20",1000,10);
		});


	});

});