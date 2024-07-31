import { NetworkId, useWallet, type Wallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import * as React from 'react'

export function Connect() {
  const {
    algodClient,
    activeAddress,
    activeNetwork,
    setActiveNetwork,
    transactionSigner,
    wallets
  } = useWallet()

  const [isChecking, setIsChecking] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [name, setName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [supply, setSupply] = React.useState<number>();
  const [transactionDetails, setTransactionDetails] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const isConnectDisabled = (wallet: Wallet) => {
    if (wallet.isConnected) {
      return true
    }
    return false
  }

  const setActiveAccount = (event: React.ChangeEvent<HTMLSelectElement>, wallet: Wallet) => {
    const target = event.target
    wallet.setActiveAccount(target.value)
  }

  const checkBalance = async () => {
    try {
      if (!activeAddress) {
        throw new Error('[App] No active account')
      }

      if (name.length == 0 || name.length > 32) {
        throw new Error('[App] Name Should be greater than 0 or less than 32 characters')
      }

      if (symbol.length == 0 || symbol.length > 8) {
        throw new Error('[App] Symbol Should be greater than 0 or less than 8 characters')
      }

      if (!supply) {
        throw new Error('[App] Supply is mandatory')
      }

      if (supply < 1) {
        throw new Error('[App] Supply should be greater than 0')
      }

      setResult(`Minting...`)

      setIsChecking(true)

      const atc = new algosdk.AtomicTransactionComposer()
      const suggestedParams = await algodClient.getTransactionParams().do()

      const transaction = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        suggestedParams,
        assetName: name,
        unitName: symbol,
        defaultFrozen: false,
        total: supply,
        decimals: 0
      })

      atc.addTransaction({ txn: transaction, signer: transactionSigner })

      console.info(`[App] Sending transaction...`, transaction)

      const result = await atc.execute(algodClient, 4)

      const txnres = await algodClient.pendingTransactionInformation(result.txIDs[0]).do()

      console.log(result, txnres)

      setTransactionDetails({
        txIDs: result.txIDs,
        assetIndex: txnres['asset-index'],
        confirmedRound: txnres['confirmed-round']
      });
      setShowModal(true);

      setResult(`Asset Created With ID: ${txnres['asset-index']}`)

    } catch (error) {
      setResult(`Failed to Mint Token`)
      console.error('[App] Error signing transaction:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const closeModal = () => {
    setShowModal(false);
  }

  return (
    <div>
      <div className="network-group">
        <h4>
          Current Network: <span className="active-network">{activeNetwork}</span>
        </h4>
        <div className="network-buttons">
          <button
            type="button"
            onClick={() => setActiveNetwork(NetworkId.BETANET)}
            disabled={activeNetwork === NetworkId.BETANET}
          >
            Set to Betanet
          </button>
          <button
            type="button"
            onClick={() => setActiveNetwork(NetworkId.TESTNET)}
            disabled={activeNetwork === NetworkId.TESTNET}
          >
            Set to Testnet
          </button>
          <button
            type="button"
            onClick={() => setActiveNetwork(NetworkId.MAINNET)}
            disabled={activeNetwork === NetworkId.MAINNET}
          >
            Set to Mainnet
          </button>
        </div>
      </div>

      {wallets.map((wallet) => (
        <div key={wallet.id} className="wallet-group">
          <h4 id="MainTxt">
            {wallet.metadata.name} {wallet.isActive ? '[active]' : ''} Wallet
          </h4>
          <div className="wallet-buttons">
            <button
              type="button"
              onClick={() => wallet.connect()}
              disabled={isConnectDisabled(wallet)}
              id='Connectbtn'
            >
              Connect
            </button>
            <button
              type="button"
              onClick={() => wallet.disconnect()}
              disabled={!wallet.isConnected}
              id='DisConnectbtn'
            >
              Disconnect
            </button>
            
            {wallet.isActive ? (
              <>
                <div><br /><br /><br />
                  <label><b><strong>Enter Your Token Name:</strong></b></label>
                  <input type='text' onChange={(e) => setName(e.target.value)}>
                  </input><br /><br /><br />
                  <label><b><strong>Enter the token sybmol(units):</strong></b></label>
                  <input type='text' onChange={(e) => setSymbol(e.target.value)}>
                  </input><br /><br /><br />
                  <label><b><strong>Enter Total Supply:</strong></b></label>
                  <input type='number' onChange={(e) => { console.log(Number(e.target.value)), setSupply(Number(e.target.value)) }}>
                  </input>
                </div>
                <div id="Mintbtn">
                  <button type="button" onClick={checkBalance} disabled={isChecking}>
                    {isChecking ? 'Minting Token...' : 'Mint Token'}
                  </button>
                </div>
                <div id="Resultmsg">{result}</div>
                </>
            ) : (
              <button
                type="button"
                onClick={() => wallet.setActive()}
                disabled={!wallet.isConnected}
                id="SetActiveBtn"
              >
                Set Active
              </button>
            )}
          </div>

          {wallet.isActive && wallet.accounts.length > 0 && (
            <select onChange={(e) => setActiveAccount(e, wallet)}>
              {wallet.accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.address}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Transaction Details</h2>
            <p><strong>Transaction ID:</strong> {transactionDetails.txIDs[0]}</p>
            <p><strong>Asset Index:</strong> {transactionDetails.assetIndex}</p>
            <p><strong>Confirmed Round:</strong> {transactionDetails.confirmedRound}</p>
            <button type="button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
