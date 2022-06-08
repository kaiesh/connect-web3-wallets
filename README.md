# connect-web3-wallets

## Raison d'etre

Too many Web3 libraries depend on large frameworks being imported and used for the entire project implementation. This is annoying. So, these helper files are designed to simplify init of Web3 Wallet connections for vanilla JS implementations. It imports all the annoying dependencies required for services like Wallet Connect, and wraps it up so that vanilla JS can be used with [Web3.js wallet objects](https://web3js.readthedocs.io/en/v1.7.1/).

## The issue

The main problem being solved is that every wallet has a slightly different init process, and slightly different mechanism to determine if the wallet is present in the user's browser. Listing the wallet options and enabling connections in a fully stylable button container should not be difficult.

## What it does

The solution provides:

- search engine load-speed friendly mechanisms
- standardised method to query for wallet presence
- standardised wallet connection init
- fully self-stylable wallet prompt

and returns an initialised [Web3.js wallet object](https://web3js.readthedocs.io/en/v1.7.1/) at the end of it all.

Currently supports:

- MetaMask
- Binance Wallet
- WalletConnect ( requires an [Infura ID](https://infura.io/) )
- simply reading chain information via Infura

Coming soon:

- Coinbase Wallet

## Dependencies

Depends on Web3.js and WalletConnect JS files - however these are imported through the init function, and the exact files are stored in this repo incase they disappear from the interwebs.

## Hosting

Because I use these files in various projects, they are publicly hosted and availble for your use from here:

- <https://cdn.kaiesh.com/js/KV.latest.min.js>
- <https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js>

## Demo

The source code for a demo is in `/demo/demo.html`

## Repo layout

- `/src/` : The full source code is here
- `/prod/` : The minified files for your download and self hosting are here
- `/demo/` : The source code for the demo is here

## Documentation

This is coming soon. For now, inspect the demo code.

## License, legal and fun

All my code is Copyright (c) 2022 Kaiesh Vohra and licensed under the GPL.

The other brands, code, dependencies, etc, all belong to their respective owners and their licenses. Appropriate licenses and notices should be present in the code - if not, please let me know and I will update accordingly.
