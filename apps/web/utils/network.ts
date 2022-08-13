import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
// import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
// import { InjectedConnector } from "wagmi/connectors/injected";

export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  throw new Error("NEXT_PUBLIC_ALCHEMY_API_KEY is a required env var");
}

// const localChain: Chain = {
//   id: 31337,
//   name: "local Ethereum",
//   network: "local",
//   rpcUrls: {
//     default: "http://localhost:8545",
//   },
//   testnet: false,
// };

// export const defaultProvider = jsonRpcProvider({
//   rpc: (chain) => ({ http: chain.rpcUrls.default }),
// });
export const defaultProvider = alchemyProvider({ apiKey: ALCHEMY_API_KEY });

export const { chains, provider, webSocketProvider } = configureChains(
  [chain.mainnet],
  // [chain.mainnet, chain.rinkeby],
  // [localChain],
  [defaultProvider]
);

// const connectors = connectorsForWallets([
//   {
//     groupName: "Recommended",
//     wallets: [
//       {
//         id: "my-wallet",
//         name: "My Wallet",
//         iconUrl: "https://my-image.xyz",
//         iconBackground: "#0c2f78",
//         // downloadUrls: {
//         //   android: "https://my-wallet/android",
//         //   ios: "https://my-wallet/ios",
//         //   qrCode: "https://my-wallet/qr",
//         // },
//         createConnector: () => ({
//           connector: new InjectedConnector({ chains }),
//         }),
//       },
//     ],
//   },
// ]);

const { connectors } = getDefaultWallets({
  appName: "nouns.tv",
  chains,
});

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});
