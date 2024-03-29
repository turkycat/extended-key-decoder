const { Command } = require('commander');
const program = new Command();
const bitcoin = require('bitcoinjs-lib')
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { BIP32Path } = require('bitcoinjs-lib/src/types');
const bip32 = BIP32Factory(ecc);

const DEFAULT_PATH = "m/48'/1'/0'/2'"

program
  .addHelpText('before', 'generates extended key pairs for mainnet and testnet from a common randomly-generated seed.')
  .option('-p, --path <path>', `the derivation path to use. use h or ' for hardened derivations. default: ${DEFAULT_PATH}`)
  .parse(process.argv);

const options = program.opts();

// Generate a random seed (not secure)
const seed = bitcoin.crypto.sha256(Math.random().toString());

// create a master key and encode it for main and testnet
const master = bip32.fromSeed(seed, bitcoin.networks.mainnet);

if (options.path) {
  options.path = options.path.replace(/h/g, '\'');
  console.log('Using path: ' + options.path);
}
else {
  console.log(`Using default path for testnet p2wsh: ${DEFAULT_PATH}`);
  options.path = DEFAULT_PATH;
}

let derived = master
if (!(options.path === 'm' || options.path === 'm/')) {
  derived = master.derivePath(options.path)
}

derived.network = bitcoin.networks.bitcoin;
const main = { xprv: derived.toBase58(), xpub: derived.neutered().toBase58() };
derived.network = bitcoin.networks.testnet;
const test = { tprv: derived.toBase58(), tpub: derived.neutered().toBase58() };

console.log({
  origin: master.fingerprint.toString('hex'),
  fingerprint: derived.fingerprint.toString('hex'),
  depth: derived.depth,
  index: derived.index,
  main,
  test
})