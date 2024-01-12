import { expect} from "chai";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";
const initFee=BigNumber.from("100000000000000000");

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
			const protocol = "protocol";
			const tick = "ERC20";
			const maxSupply = 1000;
			const pageLimit = 10;
			
			await expect(mainContract.connect(addr1).deploy_mint(protocol,tick,10,1000,{value:100,from:addr1.address})).to.be.revertedWith("supply less than pageLimit");
			await expect(mainContract.connect(addr1).deploy_mint(protocol,tick,1000,10,{value:100,from:addr1.address})).to.be.revertedWith("payment not correct");
			let balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("before deploy balanceOfContract is:",balanceOfContract);
			let tx = await mainContract.connect(addr1).deploy_mint(protocol,tick,maxSupply,pageLimit,{value:initFee,from:addr1.address});
			let receipt = await tx.wait();
			//test the init deploy events
			const init_deploy_event = receipt.events?.filter((x)=>{return x.event=="Init_Deploy"});
			// console.log("init_deploy_event:",init_deploy_event);
			expect(init_deploy_event?.at(0)?.args?.at(0)).to.be.equals(addr1.address);
			expect(init_deploy_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(init_deploy_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(init_deploy_event?.at(0)?.args?.at(3)).to.be.equals(maxSupply);
			expect(init_deploy_event?.at(0)?.args?.at(4)).to.be.equals(pageLimit);
			expect(init_deploy_event?.at(0)?.address).to.be.equals(mainContract.address);

			//test the mint events
			const batchMintFee = await mainContract.batch_mint_fee();
			const deployFee = await mainContract.deploy_fee();
			const batch_page = deployFee.div(batchMintFee);
			const mint_event = receipt.events?.filter((x)=>{return x.event=="Mint"});
			// console.log("mint_event:",mint_event);
			expect(mint_event?.at(0)?.args?.at(0)).to.be.equals(addr1.address);
			expect(mint_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(mint_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(mint_event?.at(0)?.args?.at(3)).to.be.equals(batch_page);
			expect(mint_event?.at(0)?.address).to.be.equals(mainContract.address);
			expect(batch_page.mul(pageLimit)).to.be.equals(BigNumber.from(10*200));
			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("after deploy balanceOfContract is:",balanceOfContract);
			expect(balanceOfContract).to.be.equals(initFee);
			await expect(mainContract.deploy_mint(protocol,tick,1000,10,{value:initFee})).to.be.revertedWith("ticker has exist");
		});


	});

});