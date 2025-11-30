import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";

export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "87299389203928392039",
});

export const vinuChain = defineChain({
    id: 207,
    name: "VinuChain",
    rpc: "https://vinuchain-rpc.com", // Replace with actual RPC if different
    nativeCurrency: {
        name: "VinuChain",
        symbol: "VC",
        decimals: 18,
    },
});

export const wallets = [
    inAppWallet({
        auth: {
            options: [
                "google",
                "apple",
                "email",
                "passkey",
            ],
        },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
];
