import { Keypair, TransactionBuilder, Asset, Operation } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { Client, networks } from "soroswap-router";

const rpcUrl = 'https://soroban-testnet.stellar.org'
const USDC_SAC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const CARBON_SAC = "CCVMSAUB5RSCN7VFA2GESPVGRBNDHLQG5YDA7DST63OXJB5YBZGKEUVU"

async function setup_account() {
  const keypair = Keypair.random();

  // Fund account with Friendbot
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`
  );
  if (!response.ok) {
    throw new Error(`Friendbot request failed: ${response.status}`);
  }

  // Use RPC Server for transaction building/submission
  const server = new Server(rpcUrl);
  const account = await server.getAccount(keypair.publicKey());

  const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
  const CARBON = new Asset("CARBON", "GDT5XM5C5STQZS5R3F4CEGKJWKDVWBIWBEV4TIYV5MDVVMKA775T4OKY");

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: networks.testnet.networkPassphrase,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .addOperation(Operation.changeTrust({ asset: CARBON }))
    .addOperation(Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: "5000",
      destination: keypair.publicKey(),
      destAsset: USDC,
      destAmount: "500",
      path: [],
    }))
    .setTimeout(60)
    .build();

  tx.sign(keypair);
  const resp = await server.sendTransaction(tx);
  console.log(resp)

  // wait for the tx to be stored
  if (resp.status === "PENDING") {
    let getResponse = await server.getTransaction(resp.hash);
    
    // Poll until we get a final status
    while (getResponse.status === "NOT_FOUND") {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await server.getTransaction(resp.hash);
    }
    
    // Now we have either SUCCESS or FAILED
    if (getResponse.status === "SUCCESS") {
        console.log("Transaction succeeded!");
        // Proceed with your logic
    } else {
        console.log("Transaction failed:", getResponse);
        // Handle the error
    }
  }

  return keypair;
}

export async function swap_usdc_to_carbon() {
    const source_amount = 50_000_000n;
    const source_keypair = Keypair.fromSecret("SCHQO6J7CTLQGZGJO2WENSNHIEA4WGAMKP36AGUKAIB22WKRQWFZPJXW");
    // yes i know i'm exposing this secret
    // and here's its pubkey: GCM4NRBFDMVJ3KSQLY4HUGYVFLNGXZ7NYPHUNC2RHSU6ZL5ARJC3UR7D

    const router = new Client({
        ...networks.testnet, 
        rpcUrl,
        publicKey: source_keypair.publicKey(),
        signTransaction: async (txXdr) => {
            const tx = TransactionBuilder.fromXDR(txXdr, networks.testnet.networkPassphrase);
            tx.sign(source_keypair);
            return { signedTxXdr: tx.toXDR(), signerAddress: source_keypair.publicKey() };
        },
    })
    const time_in_ms = new Date().getTime();
    const deadline = 60n + BigInt(Math.trunc(time_in_ms / 1000));

    const swap_tx = await router.swap_exact_tokens_for_tokens({
        amount_in: source_amount,
        amount_out_min: source_amount / 30n,
        path: [USDC_SAC, CARBON_SAC],
        to: source_keypair.publicKey(),
        deadline
    });
    console.log(swap_tx)
    const { result: steps } = await swap_tx.signAndSend();

    return steps.unwrap()
}
