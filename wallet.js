const fs = require('fs');
const { Keypair, Connection, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');

const network = 'https://api.devnet.solana.com';

async function createWallet() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58;

  // Save wallet information to the file
  const walletData = {
    privateKey: keypair.secretKey.toString(),
    publicKey: publicKey,
    balance: 0
  };
  fs.writeFileSync('wallet.json', JSON.stringify(walletData, null, 2));

  console.log(`New wallet created:\nPublic Key: ${publicKey}`);
}

async function airdrop(amount = 1) {
  const walletData = loadWalletData();
  const connection = new Connection(network, 'confirmed');
  const publicKey = walletData.publicKey;

  await connection.requestAirdrop(publicKey, amount * 1000000000);

  console.log(`${amount} SOL airdrop completed.`);
}

async function checkBalance() {
  const walletData = loadWalletData();
  const connection = new Connection(network, 'confirmed');
  const publicKey = walletData.publicKey;

  const balance = await connection.getBalance(publicKey);
  console.log(`Balance: ${balance / 1000000000} SOL`);
}

async function transfer(otherPublicKey, amount) {
  const walletData = loadWalletData();
  const connection = new Connection(network, 'confirmed');
  const privateKey = Uint8Array.from(JSON.parse(walletData.privateKey));

  const from = Keypair.fromSecretKey(privateKey);
  const to = new Keypair();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: amount * 1000000000
    })
  );

  await sendAndConfirmTransaction(connection, transaction, [from, to]);

  console.log(`${amount} SOL transferred to ${otherPublicKey} address.`);
}

function loadWalletData() {
  const walletData = fs.readFileSync('wallet.json', 'utf-8');
  return JSON.parse(walletData);
}

// Perform operations based on command-line arguments
const command = process.argv[2];
switch (command) {
  case 'new':
    createWallet();
    break;
  case 'airdrop':
    const amount = process.argv[3] ? parseFloat(process.argv[3]) : 1;
    airdrop(amount);
    break;
  case 'balance':
    checkBalance();
    break;
  case 'transfer':
    const otherPublicKey = process.argv[3];
    const transferAmount = process.argv[4] ? parseFloat(process.argv[4]) : 0;
    transfer(otherPublicKey, transferAmount);
    break;
  default:
    console.log('Invalid command.');
    break;
}
