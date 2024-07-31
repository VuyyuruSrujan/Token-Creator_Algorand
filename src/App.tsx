import { NetworkId, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { Connect } from './Connect'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const walletManager = new WalletManager({
  wallets: [
    // WalletId.DEFLY,
    { id: WalletId.PERA },
    // {
    //   id: WalletId.WALLETCONNECT,
    //   options: { projectId: 'fcfde0713d43baa0d23be0773c80a72b' }
    // },
    // {
    //   id: WalletId.LUTE,
    //   options: { siteName: 'Balance Checker' }
    // },
  ],
  network: NetworkId.TESTNET
})

function App() {
  return (
    <WalletProvider manager={walletManager}>
      <Connect />
    </WalletProvider>
  )
}

export default App
