import { expect} from "chai";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";
const initFee=BigNumber.from("100000000000000000");

describe("Main contract init and test", () => {

	async function deployInitFixture() {
		// Contracts are deployed using the first signer/account by default
		const [owner, alice,bob] = await ethers.getSigners();
	
		const Main = await ethers.getContractFactory("Main");
		const main = await Main.deploy();
		await main.initialize();
		return { main, owner, alice,bob };
	  }


	describe.only("deploy main test", () => {

		it("deploy and mint token", async () => {
			const {
				main:mainContract, owner, alice,bob
			} = await deployInitFixture();
			const protocol = "protocol";
			const tick = "ERC20";
			const maxSupply = 1000;
			const pageLimit = 10;
			
			await expect(mainContract.connect(alice).deploy_mint(protocol,tick,10,1000,{value:100,from:alice.address})).to.be.revertedWith("supply less than pageLimit");
			await expect(mainContract.connect(alice).deploy_mint(protocol,tick,1000,10,{value:100,from:alice.address})).to.be.revertedWith("payment not enough");
			let balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("before deploy balanceOfContract is:",balanceOfContract);
			let tx = await mainContract.connect(alice).deploy_mint(protocol,tick,maxSupply,pageLimit,{value:initFee,from:alice.address});
			let receipt = await tx.wait();
			//test the init deploy events
			const init_deploy_event = receipt.events?.filter((x)=>{return x.event=="Init_Deploy"});
			// console.log("init_deploy_event:",init_deploy_event);
			expect(init_deploy_event?.at(0)?.args?.at(0)).to.be.equals(alice.address);
			expect(init_deploy_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(init_deploy_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(init_deploy_event?.at(0)?.args?.at(3)).to.be.equals(maxSupply);
			expect(init_deploy_event?.at(0)?.args?.at(4)).to.be.equals(pageLimit);
			expect(init_deploy_event?.at(0)?.address).to.be.equals(mainContract.address);

			let token = await mainContract.tokenMap(protocol,tick);
			expect(token.maxSupply).to.be.equals(maxSupply);
			expect(token.pageLimit).to.be.equals(pageLimit);

			//test the mint events
			const pageMintFee = await mainContract.page_mint_fee();
			const deployFee = await mainContract.deploy_fee();
			const batch_page = deployFee.div(pageMintFee);
			console.log("batch_page is:",batch_page);
			const batch_amt = batch_page.mul(pageLimit);
			const mint_event = receipt.events?.filter((x)=>{return x.event=="Mint"});
			// console.log("mint_event:",mint_event);
			expect(mint_event?.at(0)?.args?.at(0)).to.be.equals(alice.address);
			expect(mint_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(mint_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(mint_event?.at(0)?.args?.at(3)).to.be.equals(batch_amt);
			expect(mint_event?.at(0)?.address).to.be.equals(mainContract.address);
			expect(batch_page.mul(pageLimit)).to.be.equals(BigNumber.from(10*200));
			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("after deploy balanceOfContract is:",balanceOfContract);
			expect(balanceOfContract).to.be.equals(initFee);
			await expect(mainContract.deploy_mint(protocol,tick,1000,10,{value:initFee})).to.be.revertedWith("ticker has exist");

			// test with draw 
			await expect(mainContract.connect(alice).withdraw(balanceOfContract,{from:alice.address})).to.be.revertedWith("Not manager");
			await mainContract.connect(owner).withdraw(balanceOfContract,{from:owner.address});
			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(0);
		});

		it("mint token", async () => {
			const {
				main:mainContract, owner, alice,bob
			} = await deployInitFixture();
			const protocol = "protocol";
			const tick = "ERC20";
			const maxSupply = 1000;
			const pageLimit = 10;
			let batchPage = 5
			let batch_amt = batchPage*pageLimit;
			
			let balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(0);
			console.log("before deploy balanceOfContract is:",balanceOfContract);
			await mainContract.connect(alice).deploy_mint(protocol,tick,maxSupply,pageLimit,{value:initFee,from:alice.address});
			await expect(mainContract.mint(protocol,"faketoken")).to.be.revertedWith("ticker not exist");
			let queryMintPayment = await mainContract.queryBatchMintPayable(protocol,tick,batch_amt);
			console.log("mintPayment is:",queryMintPayment);
			await expect(mainContract.connect(bob).mint(protocol,tick,{from:bob.address,value:pageLimit-1})).to.be.revertedWith("payment not enough");
			let tx = await mainContract.connect(bob).mint(protocol,tick,{from:bob.address,value:queryMintPayment});
			let receipt = await tx.wait();
			//test the init deploy events
			let mint_event = receipt.events?.filter((x)=>{return x.event=="Mint"});
			console.log("mint_event is:",mint_event);
			expect(mint_event?.at(0)?.args?.at(0)).to.be.equals(bob.address);
			expect(mint_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(mint_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(mint_event?.at(0)?.args?.at(3)).to.be.equals(batch_amt);
			expect(mint_event?.at(0)?.address).to.be.equals(mainContract.address);

			// pay more payment
			tx = await mainContract.connect(bob).mint(protocol,tick,{from:bob.address,value:queryMintPayment.mul(10)});
			receipt = await tx.wait();
			//test the init deploy events
			mint_event = receipt.events?.filter((x)=>{return x.event=="Mint"});
			console.log("mint_event is:",mint_event);
			expect(mint_event?.at(0)?.args?.at(0)).to.be.equals(bob.address);
			expect(mint_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(mint_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(mint_event?.at(0)?.args?.at(3)).to.be.equals(batch_amt*10);
			expect(mint_event?.at(0)?.address).to.be.equals(mainContract.address);

			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("balanceOfContract is:",balanceOfContract);
			expect(balanceOfContract).to.be.equals(queryMintPayment.mul(11).add(initFee));

			await mainContract.connect(owner).withdraw(balanceOfContract,{from:owner.address});
			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(0);
		});

		it("over init token", async () => {
			const {
				main:mainContract, owner, alice,bob
			} = await deployInitFixture();
			const protocol = "protocol";
			const tick = "ERC20";
			const maxSupply = 1000;
			const pageLimit = 10;
			const pageMintFee = await mainContract.page_mint_fee();
			const newInitFee = initFee.mul(2);
			let batchPage = initFee.mul(2).div(pageMintFee);
			let batch_amt = batchPage.mul(pageLimit);
			
			let balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(0);
			console.log("before deploy balanceOfContract is:",balanceOfContract);
			let tx = await mainContract.connect(alice).deploy_mint(protocol,tick,maxSupply,pageLimit,{value:newInitFee,from:alice.address});
			let receipt = await tx.wait();
			//test the init deploy events
			let mint_event = receipt.events?.filter((x)=>{return x.event=="Mint"});
			console.log("mint_event is:",mint_event);
			expect(mint_event?.at(0)?.args?.at(0)).to.be.equals(alice.address);
			expect(mint_event?.at(0)?.args?.at(1)).to.be.equals(protocol);
			expect(mint_event?.at(0)?.args?.at(2)).to.be.equals(tick);
			expect(mint_event?.at(0)?.args?.at(3)).to.be.equals(batch_amt);
			expect(mint_event?.at(0)?.address).to.be.equals(mainContract.address);

			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			console.log("after deploy balanceOfContract is:",balanceOfContract);
			expect(balanceOfContract).to.be.equals(newInitFee);
			await expect(mainContract.deploy_mint(protocol,tick,1000,10,{value:newInitFee})).to.be.revertedWith("ticker has exist");

			// test with draw 
			await expect(mainContract.connect(alice).withdraw(100,{from:alice.address})).to.be.revertedWith("Not manager");
			await mainContract.connect(owner).withdraw(100,{from:owner.address});
			balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(newInitFee.sub(100));
	
		});

		it("test set paramter", async () => {
			const {
				main:mainContract, owner, alice,bob
			} = await deployInitFixture();
			const protocol = "protocol";
			const tick = "ERC20";
			const maxSupply = 1000;
			const pageLimit = 10;
			const pageMintFee = await mainContract.page_mint_fee();
			const newInitFee = initFee.mul(2);
			
			let balanceOfContract = await ethers.provider.getBalance(mainContract.address);
			expect(balanceOfContract).to.be.equals(0);
			console.log("before deploy balanceOfContract is:",balanceOfContract);
			await mainContract.connect(alice).deploy_mint(protocol,tick,maxSupply,pageLimit,{value:newInitFee,from:alice.address});
			let token = await mainContract.tokenMap(protocol,tick);
			expect(token.maxSupply).to.be.equals(maxSupply);
			expect(token.pageLimit).to.be.equals(pageLimit);

			await expect(mainContract.connect(bob).setDeployFee(1,{from:bob.address})).to.be.revertedWith("Not manager");
			await expect(mainContract.connect(bob).setBatchMintFee(1,{from:bob.address})).to.be.revertedWith("Not manager");
			await mainContract.connect(owner).setDeployFee(1,{from:owner.address});
			await mainContract.connect(owner).setBatchMintFee(1,{from:owner.address});
			token = await mainContract.tokenMap(protocol,tick);
			expect(await mainContract.deploy_fee()).to.be.equals(1);
			expect(await mainContract.page_mint_fee()).to.be.equals(1);
		});

	});
});