import { 
  createConfig, 
  http, 
  cookieStorage,
  createStorage 
} from 'wagmi'
import { mainnet, polygon, sepolia } from 'wagmi/chains'

export function getConfig() {
  return createConfig({
    chains: [mainnet,polygon],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
    },
  })
}