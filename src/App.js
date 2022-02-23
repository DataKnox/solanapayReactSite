import React, { useEffect, useRef, useState, setState } from "react";
import './App.css';
import { clusterApiUrl, Connection, PublicKey, Keypair } from '@solana/web3.js';
import { encodeURL, findTransactionSignature, FindTransactionSignatureError } from '@solana/pay';
import BigNumber from 'bignumber.js';
import QRCodeStyling from "qr-code-styling";

const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  image:
    "https://cryptologos.cc/logos/solana-sol-logo.png",
  dotsOptions: {
    color: "#4267b2",
    type: "rounded"
  },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 20
  }
});

function App() {
  const [url, setUrl] = useState("https://qr-code-styling.com");
  const ref = useRef({});
  const [pmtStatus, setPmtStatus] = useState(null)


  useEffect(() => {
    qrCode.append(ref.current);
  }, []);

  useEffect(() => {
    qrCode.update({
      data: url
    });
  }, [url]);

  async function getTxnStatus(connection, reference) {
    let signatureInfo;
    let count = 0

    return new Promise((resolve, reject) => {

      const interval = setInterval(async () => {
        console.log('Checking for transaction...', count);
        try {
          signatureInfo = await findTransactionSignature(connection, reference, undefined, 'confirmed');
          console.log('\n 🖌  Signature found: ', signatureInfo.signature);
          clearInterval(interval);
          resolve(signatureInfo);
          return signatureInfo
        } catch (error) {
          if (!(error instanceof FindTransactionSignatureError)) {
            console.error(error);
            clearInterval(interval);
            reject(error);
            count++
          }
        }
      }, 1500);
    });
  }

  async function createTxn() {


    // Connecting to devnet for this example
    console.log('1. ✅ Establish connection to the network');
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    //payment request
    console.log('2. 🛍 Simulate a customer checkout \n');
    const recipient = new PublicKey('DxKc73eJX5J1kY5ND69hnLs7ox64Q2exN3BVUWxBtBjo');
    const amount = new BigNumber(1);
    const reference = new Keypair().publicKey;
    const label = 'Knoxs store';
    const message = 'Knoxs store - your order - #42069';
    const memo = 'KS#42069';

    //create URL
    console.log('3. 💰 Create a payment request link \n');
    const url = encodeURL({ recipient, amount, reference, label, message, memo });
    setUrl(url)
    console.log("getting txn status")
    try {
      let txnLookupResults = await getTxnStatus(connection, reference)
      if (txnLookupResults) {
        setPmtStatus(txnLookupResults)
      }
    } catch (err) {
      console.log(err)
    }

  }

  return (

    <div className="App">
      <div>
        {
          (!pmtStatus || pmtStatus == "reset") ? (
            <div>
              <div>
                <button onClick={createTxn}>Gen Txn</button>
              </div>
              <div ref={ref} />
            </div>
          ) : (
            <div>
              <h1>Txn Confirmed</h1>
              <p>Txn ID: {pmtStatus.signature}</p>
              <button onClick={() => window.location.reload(false)}>Again?</button>
            </div>)
        }
      </div>
    </div >

  );
}

export default App;
