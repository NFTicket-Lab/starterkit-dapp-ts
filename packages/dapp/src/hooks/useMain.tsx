import { useAccount, useContractEvent, useNetwork } from "wagmi"
import { useNotif } from "./useNotif"
import { useCallback, useEffect, useState } from "react"
import { getContract, prepareWriteContract, writeContract, readContract, waitForTransaction } from '@wagmi/core'
import { client, config } from "@/config"
import { getAddress, parseAbiItem } from "viem"
import { confetti } from "@/utils"

export function useMain() {
    const { isConnected, address } = useAccount()
    const { chain } = useNetwork()
    const { setNotif } = useNotif()

    // init state
    const [contract, setContract] = useState<any>();
    const [contractIsConnected, setContractIsConnected] = useState<boolean>();
    const [owner, setOwner] = useState<string>("");
    const [isOwner, setIsOwner] = useState<boolean>();

    const [deployFee, setDepLoyFee] = useState<bigint>();
    const [pageMintFee, setPageMintFee] = useState<bigint>();
    const [tokenlist, setTokenlist] = useState<object[]>();

    // Load contract
    const loadContract = useCallback(async () => {
        try {
            // const walletClient = await getWalletClient()
            const c = getContract({
                address: getAddress(config.contracts.main.mainAddress),
                abi: config.contracts.main.mainAbi
            })

            await initialize();

            console.log('loadContract', c, await c.read.owner())
            const owner = await c.read.owner() ? String(await c.read.owner()) : null

            setContractIsConnected(true)
            setContract(c)
            setDepLoyFee(await c.read.deploy_fee());
            setPageMintFee(await c.read.page_mint_fee());

            // Set state hook
            if (!owner) return
            setOwner(getAddress(owner))
        } catch (error) {
            console.log('error use effect')
            setNotif({ type: "error", message: "Impossible load connecter au contrat, please check the contract address" })
            setContractIsConnected(false)
        }
    }, [setNotif])

    useEffect(() => {
        if (!isConnected) return;
        try {
            loadContract()
        } catch (error) {
            console.log(error)
        }
    }, [isConnected, address, chain?.id, loadContract])

    const initialize = async () => {
        try {
            const { request } = await prepareWriteContract({
                address: getAddress(config.contracts.main.mainAddress),
                abi: config.contracts.main.mainAbi,
                functionName: 'initialize'
            })
            await transactionsCompleted(request)
        } catch (error) {
            setNotif({ type: "error", message: String(error) })
        }
    }

    const transactionsCompleted = async (_request: any) => {
        const { hash } = await writeContract(_request)
        setNotif({ type: 'info', message: "Transactions Processing..." })
        const data = await waitForTransaction({
            hash: hash,
        })
        setNotif({ type: 'info', message: "Transactions effectué !" })
        confetti(0)
        return data
    }

    const deployMint = async (protocol: string, tick: string, maxSupply: bigint, pageLimit: bigint, transferValue: bigint) => {
        try {
            const { request } = await prepareWriteContract({
                address: getAddress(config.contracts.main.mainAddress),
                abi: config.contracts.main.mainAbi,
                functionName: 'deploy_mint',
                args: [protocol, tick, maxSupply, pageLimit],
                value: transferValue,
            })
            await transactionsCompleted(request)
        } catch (error) {
            setNotif({ type: "error", message: String(error) })
        }
    };

    const mint = async (protocol: string, tick: string, transferValue: bigint) => {
        try {
            const { request } = await prepareWriteContract({
                address: getAddress(config.contracts.main.mainAddress),
                abi: config.contracts.main.mainAbi,
                functionName: 'mint',
                args: [protocol, tick],
                value: transferValue,
            })
            await transactionsCompleted(request)
        } catch (error) {
            setNotif({ type: "error", message: String(error) })
        }
    };


    // Events watcher
    useContractEvent({
        address: getAddress(config.contracts.main.mainAddress),
        abi: config.contracts.main.mainAbi, // Warn with event in library
        eventName: 'Init_Deploy',
        listener(log) {
            setNotif({ type: 'info', message: String(log[0].args.user) });
            getTokenlisted();
        }
    })

    // Events logs
    const getTokenlisted = async () => {
        const fromBlock = BigInt(Number(await client.getBlockNumber()) - 15000)

        const whitelistedLogs = await client.getLogs({
            address: getAddress(config.contracts.main.mainAddress),
            event: parseAbiItem(
                "event Init_Deploy(address indexed user,string protocol,string tick,uint supply,uint limit)"
            ),
            fromBlock: Number(fromBlock) >= 0 ? fromBlock : BigInt(0),
        });

        const tokenlist = (await Promise.all(whitelistedLogs.map(async (log, i) => {
            return { id: Number(i + 1), user: String(log.args.user), protocol: log.args.protocol, tick: log.args.tick, supply: log.args.supply, limit: log.args.limit };
        }))).map(w => w)

        setTokenlist(tokenlist)
    }

    // Load Data/Storage
    useEffect(() => {
        if (!contractIsConnected) return;
        getTokenlisted()
    }, [contract, contractIsConnected])

    return {
        contract, owner, isOwner, contractIsConnected, deployMint, mint, deployFee, pageMintFee
    }
}