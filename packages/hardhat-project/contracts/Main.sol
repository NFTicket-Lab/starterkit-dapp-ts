// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";


contract Main is OwnableUpgradeable{
    //deploy fee 1 eth
    uint public deploy_fee = 1 ether/10;
    // price for batch Mint per page
    uint public page_mint_fee = 5 ether / 10000;

    mapping(string=>mapping(string=>Token)) public tokenMap;

    event Withdrawal(uint amount, uint when);
    event Init_Deploy(address indexed user,string protocol,string tick,uint supply,uint limit);
    event Mint(address indexed user,string protocol,string tick,uint batch_page);

    mapping(address => bool) public isManager;

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    struct Token{
        uint maxSupply;
        uint pageLimit;
        uint page;
    }

    constructor() payable {
    }

    function initialize() public initializer {

        __Ownable_init(msg.sender);
        isManager[msg.sender] = true;
    }



    //protocal: protocal name
    //tick: ticker name
    function deploy_mint(string memory protocal,string memory tick,uint maxSupply,uint pageLimit) public payable{
        //check the protocal and tick is exist
        require(tokenMap[protocal][tick].maxSupply == 0,"ticker has exist");
        require(maxSupply >= pageLimit,"supply less than pageLimit");
        Token memory token = Token(
            maxSupply,pageLimit,maxSupply/pageLimit
        );
        tokenMap[protocal][tick] = token;

        uint pay_amount = msg.value;
        require(pay_amount >= deploy_fee,"payment not enough");
        require(pay_amount%page_mint_fee==0,"Paid amount must be a multiple of mintingPrice");
        
        address userAddress = msg.sender;
        emit Init_Deploy(msg.sender,protocal,tick,maxSupply,pageLimit);
        _mint(userAddress,protocal,tick,pay_amount);
    }

    function mint(string memory protocal,string memory tick) public payable{
        require(tokenMap[protocal][tick].maxSupply != 0,"ticker not exist");
        uint pay_amount = msg.value;
        require(pay_amount >= page_mint_fee,"payment not enough");
        require(pay_amount%page_mint_fee==0,"Paid amount must be a multiple of mintingPrice");
        address userAddress = msg.sender;
        _mint(userAddress,protocal,tick,pay_amount);
    }

    function _mint(address userAddress,string memory protocol, string memory tick, uint256 receivedEth) internal {

        // Calculate the amount using the formula: paidAmount / mintingPrice * lim
        uint256 lim = tokenMap[protocol][tick].pageLimit;
        uint256 amt = (receivedEth / page_mint_fee) * lim;

        // Emit the MintedEvent with protocol, tick, and amt as parameters
        emit Mint(userAddress,protocol, tick, amt);
    }

    //Query the required funds for batch issuance
    function queryBatchMintPayable(string memory protocol,string memory tick,uint batch_amt)public view returns (uint mintPayable){
        uint256 lim = tokenMap[protocol][tick].pageLimit;
        return batch_amt/lim * page_mint_fee;
    }
    

    //owner whthdraw draw eth
    function withdraw(uint amount) public onlyManager{
        require(address(this).balance >= amount, "Insufficient balance");
        payable(_msgSender()).transfer(amount);
    }

    function setDeployFee(uint _deployFee)public onlyManager{
        deploy_fee = _deployFee;
    }
    function setBatchMintFee(uint _batchMintFee)public onlyManager{
        page_mint_fee = _batchMintFee;
    }
}
