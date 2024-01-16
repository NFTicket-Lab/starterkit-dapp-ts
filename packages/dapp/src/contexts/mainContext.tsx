import { createContext } from "react";

type MainContextType = {
    // State
    contract: Object | undefined
    owner: string | undefined
    tokenlist: object[] | undefined
    mintlist: object[] | undefined
    contractIsConnected: boolean | undefined
    isOwner: boolean | undefined
    deployFee: bigint | undefined
    pageMintFee: bigint | undefined

    // Function
    deployMint: (protocol: string, tick: string, maxSupply: bigint, pageLimit: bigint, transferValue: bigint) => void
    mint: (protocol: string, tick: string, transferValue: bigint) => void
}

export const MainContext = createContext<MainContextType>({
    contract: {},
    owner: "",
    tokenlist: [],
    mintlist: [],
    contractIsConnected: false,
    isOwner: false,
    deployFee:0n,
    pageMintFee:0n,
    
    deployMint: (protocol: string, tick: string, maxSupply: bigint, pageLimit: bigint, transferValue: bigint) => { },
    mint: (protocol: string, tick: string, transferValue: bigint) => { },
})
