import { useMemo } from 'react';
import { Props } from '@/types';
import { useMain } from '@/hooks/useMain';
import { MainContext } from '@/contexts/mainContext';

export default function MainProvider({ children }: Props) {
    // Hook
    const {
        contract, owner, isOwner, contractIsConnected,tokenlist,mintlist, deployFee, pageMintFee,deployMint, mint,
    } = useMain()

    // Memory
    const values = useMemo(() => ({
        contract, owner, isOwner, contractIsConnected,tokenlist,mintlist, deployFee, pageMintFee,deployMint, mint,
    }), [
        contract, owner, isOwner, contractIsConnected,tokenlist,mintlist, deployFee, pageMintFee,deployMint, mint,
    ])

    return <MainContext.Provider value={values}>{children}</MainContext.Provider>;

}
