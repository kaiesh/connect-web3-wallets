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
- <https://cdn.kaiesh.com/js/KV.ContractFns.latest.min.js>

## Demo

The source code for a demo is in `/demo/demo.html`

## Repo layout

- `/src/` : The full source code is here
- `/prod/` : The minified files for your download and self hosting are here
- `/demo/` : The source code for the demo is here

## Documentation

### Include the core file in your page

Start by including the `KV.js` script. Best practice suggests avoiding keeping it in your header, so the following snippet can be included at the end of your page just above your `</body>` tag:


```
let _kv = document.createElement("SCRIPT"); _kv.src = "https://cdn.kaiesh.com/js/KV.latest.min.js"; _kv.aysnc="async";
_kv.onload = function(){ if (typeof _w3init == "function"){ _w3init(); } };
document.getElementsByTagName("body")[0].appendChild(_kv);

```

Note that this will attempt to invoke a function with name `_w3init`.

### Full initialisation example

The following is an example of a full initialisation function, which also invokes other helper extensions included in this repo. Detailed explanations of options and params follow below.

```
let user_wallet; //define placeholder variable to maintain wallet address
let _w3init = function(){
    KV.init(
        ["https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js", "https://cdn.kaiesh.com/js/KV.ContractFns.latest.min.js"], 
        false
    ).then(function(res){
        //Initialise the Wallet UI manager
        let walletui = new KV.WalletUIHandler({
            //UPDATE THESE REFERENCES FOR YOUR DOM
            parent_container: document.getElementById("walletmodal"),
            btn_connect: document.getElementById("connect_btn"),
            web3network: 80001,
            //ADD ADDITIONAL WALLETUI PROPS HERE
        });  
        //Contracts with write requirements will be created once a wallet is connected
        walletui.on("wallet_connected", function(wallet_addr){
        //store the address of the connected wallet
        user_wallet = wallet_addr;
        //load a contract for read/write
        KV.ContractFns.prepare_contract({
            short_name: 'JedstarStaking',
            contract_address:'0x50D5f8961930B905A804ba1A7A7289DCE486062C',
            contract_abi:'http://localhost:7900/abi/staking.json'
        }).then(function(res){ console.log('Loaded contract JedstarStaking'); });

        //NOTE: ADD ALL ACTIONS THAT SHOULD BE CARRIED OUT HERE ONCE THE WALLET IS CONNECTED
        // --- your code after wallet init goes here ---
        });
    });
}

```

### KV.js API

| Method | Description | Example usage |
|---|---|---|
| `KV.rpc_codes` | A reference object that maps well known network names to their standardised network IDs. | `KV.rpc_codes.ETH_MAINNET` returns `1`, while `KV.BSC_MAINNET` returns `56` |
| `KV.rpc_url` | A reference object that maps network IDs to usable RPC URL endpoints | `KV.rpc_url[56]` maps to the Binance RPC URL |
| `KV.network_humannames` | A reference object that maps network IDs to easily readable human names. Useful when populating things like dropdown boxes in your UI. | `KV.network_humannames[1]` returns `Ethereum Mainnet` |
| `KV.block_explorers` | A reference object that maps network IDs to block explorer URLs | `KV.block_explorers[56]` maps to the Binance Scan block explorer |
| `KV.network_currency` | A reference object that maps network IDs to the definition of their native tokens. This is required when adding networks to a user's wallet that did not previously exist | `KV.network_currency[137]` defines the MATIC native currency for import into a wallet |
| `KV.init(...)` | The invocation method. Described in the section _Invocation_ | `KV.init(...).then(...)` |
| `KV.set_infuraID(...)` | WalletConnect and Read Only contracts require RPC URLs to interact with the chain. [Infura](https://www.infura.com) is the default RPC provider supported (not endorsed) by this library. Use this method to set your Infura API key in order to enable support for read-only contracts, and WalletConnect | `KV.set_infuraID("abcdefg")` |
| `KV.get_available_providers()` | This method takes no parameters. It returns an array of strings which defines what wallet extensions have been detected in this browser | `KV.get_available_providers()` can return `["walletconnect", "metamask", "binancewallet"]` |
| `KV.set_provider(string)` | The following options are available: `walletconnect`, `metamask`, `binancewallet`, `readonly`. From the known list of supported providers, set the wallet provider to the one defined by the given string. If `readonly` is specified, no wallet prompt will be necessary, however a working RPC URL for the given network is required. | `KV.set_provider("metamask")` |
| `KV.get_provider()` | Get the current provider that has been defined by the set method. Returns `null` or `undefined` if nothing has been set. | `KV.get_provider()` |
| `KV.on_connect(function)` | Attach a function that will be fired every time a wallet connection is established. The function will be passed a parameter - an array that contains the list of connected wallet addresses. Despite wallets allowing users to have multiple addresses connected to a site, the length of the array is usually 1 - i.e. the currently connected wallet address. Note that this function can be fired multiple times in a single session depending on user behaviour. | `KV.on_connect(fn_update_buttons)` |
| `KV.on_disconnect(function)` | Attach a function that will be fired every time a wallet connection is destroyed. Note that this means it can be fired multiple times in a single session depending on user behaviour. Not all wallets will fire the disconnection notice. | `KV.on_disconnect(fn_cleanup_buttons)` |
| `KV.on_session_change(function)` | Some wallets allow users to toggle wallet addresses while connected to a site. This is effectively the same as a "disconnect" and "connect", however the wallet does not invoke those functions, but instead combines those actions into one. The function is usually passed a parameter similar to the `on_connect` method - i.e. an array of strings that represent wallet addresses. | `KV.on_session_change(fn_update_buttons)` |
| `KV.wallet.enable(network_id)` | After using the `KV.set_provider` method to define the desired wallet for connectivity, this method can be invoked. It will follow the known initialisation procedure for the selected wallet and attempt to attach it to the given `network_id`. If the user's current wallet does not have the `network_id` configured, the method will attempt to prompt the user to add it (if supported by the wallet). The method returns a promise once the user's wallet process is complete. If there are any issues, the `catch` method can be used to handle the exception. | `KV.wallet.enable(KV.rpc_codes.MATIC_MAINNET).then(...).catch(...)` |
| `KV.wallet.web3()` | Returns a [Web3.js wallet object](https://web3js.readthedocs.io/en/v1.7.1/) (if the wallet has been enabled) for you to manipulate with web3 methods. | `let w3 = KV.wallet.web3()` |
| `KV.wallet.disconnect()` | Attempt to disconnect from the user wallet, and purge known connectivity information. Not all wallets support formal disconnection. | `KV.wallet.disconnect()` |
| `KV.wallet.reset_all()` | Silently remove all known connection information. Does not invoke any callbacks related to disconnection, etc | `KV.wallet.reset_all()` |

### Invocation

If using the default function naming from above, then the init function will need to be present with the name `_w3init` and the necessary flags to turn on the wallet handler:

*Syntax:*

```
var _w3init = function(){
    KV.init(
        <array of scripts to load>,
        <CDN URL string  *or* TRUE to override>
    ).then(
        <function once wallet handler is ready>
    )
}

```

*Explanation of options*
| Option | Description | Example |
|--------|-------------|---------|
| Array of scripts to load | This is optional. If your web3 page has multiple dependencies, the init function will download them in parallel and only fire the promise when the browser has reported everything as loaded | `["https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js", "https://cdn.kaiesh.com/js/KV.ContractFns.latest.min.js"]` |
| CDN URL string or TRUE | This is optional. By default, the init procedure loads two dependencies to provide web3 support (web3.js and walletconnect libraries). Specific versions are hosted on https://cdn.kaiesh.com/, however if you would like to self host these, you can provide a string here with your own CDN URL (e.g. https//cdn.yourdomain.org/ ). Alternatively, if you would like to load different versions of the libraries, you can simply supply the boolean value `true`, and ensure that your library files are provided in the _Array of scripts to load_ | `"https://cdn.yourdomain.org/"` *or* `true` |
| Function once wallet handler is ready | This is recommended. Once all library files have been downloaded, the init function will fire the promise so that your custom load function can be invoked. By default, if a user's wallet was previously connected, it will attempt to reconnect it. It will pass an object into the function that describes the outcome. See _wallet init info_ below for more details. | `function (res){ ... }` |

_Wallet Init Info_
The promise returns an object that describes the status of the wallet connection. The object properties are as follows:
| Property | Value | Explanation |
|---|---|---|
| `init` | `"ok"` | The init procedure loaded all necessary scripts and all dependencies are ready to be used. |
| `wallet` | `"ok"` | The user was previously connected to a chain from this page, and instant reconnection is available. The user can be reconnected without a prompt. |
| `wallet` | `"fail"` | The user was previously connected to a chain from this page, but instant reconnection is NOT available. The user will experience a prompt when trying to reconnect. |
| `wallet` | `undefined` | The user has not connected to a chain from this page yet. The user will experience a prompt when trying to reconnect |

*Relevant code snippet*

```
var w3init = function(){
    KV.init(
        ["https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js", "https://cdn.kaiesh.com/js/KV.ContractFns.latest.min.js"], 
        false
    ).then(function(res){
        ...
    });
}
```

## The WalletUI Manager (optional) 

One of the main pain points being addressed by this toolkit is the management of UI components through vanilla JS and CSS. The WalletUI manager extension attempts to simplify this process for you. It does this by using methods from KV.js to inspect the browser and automatically creating DOM elements depending on available wallets, and connection status.

The extension is in the repo as `/src/KV.WalletUIHandler.js` and available on the CDN at <https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js>.

### KV.WalletUIHandler API

The following methods are made available if this extension is loaded:

| Method | Description | Example Usage |
|---|---|---|
| _constructor_ | The WalletUIHandler requires some init params to function property as it binds elements and click handlers to the DOM. These are detailed in the section _Initialisation_ | `new walletObj = new KV.WalletUIHandler({...});` |
| `walletObj.on(ev, fn_handler)` | When certain events take place, it may be necessary for you to invoke certain handler functions. The `on` method allows you to attach functions that will fire everytime the event occurs. The supported events are detailed in the section _Supported events_. Whenever you bind a handler, a unique ID is returned. This ID can be later be used to unbind the event if needed. | `walletobj.on("wallet_connected", fnManageWallet);` |
| `walletObj.off(ev, id)` | If you have previously bound a handler to a specific event, you can use this method to detach the event so that it no longer fires. The `id` would have been provided when you bound the handler using the `on` method. | `walletobj.off("wallet_connected", 1)` |

### Initialisation

*Relevant code snippet*

```
...
        //Initialise the Wallet UI manager
        let walletui = new KV.WalletUIHandler({
            //UPDATE THESE REFERENCES FOR YOUR DOM
            parent_container: document.getElementById("walletmodal"),
            btn_connect: document.getElementById("connect_btn"),
            web3network: 80001,
            //ADD ADDITIONAL WALLETUI PROPS HERE
        });  
        //Contracts with write requirements will be created once a wallet is connected
        walletui.on("wallet_connected", function(wallet_addr){
        //store the address of the connected wallet
        user_wallet = wallet_addr;

        ...

        //NOTE: ADD ALL ACTIONS THAT SHOULD BE CARRIED OUT HERE ONCE THE WALLET IS CONNECTED
        // --- your code after wallet init goes here ---
        });
...
```

The following properties are supported as part of the initialisation process.

| Init property | Mandatory/Optional | Description | Example |
|---|---|---|---|
| `btn_connect` | Mandatory | An element is required to serve as the user interaction point, where they can tap/click to connect/disconnect their wallet. This could be a button, a div or an image - however must be provided as a DOM object | `btn_connect: document.getElementById('connect_btn')` |
| `parent_container` | Mandatory | A DOM object is required in the DOM for the *Wallet Chooser* modal/popup DIV to be written into. When the `btn_connect` element is pressed, a new DIV element will be created which holds buttons for every detected wallet in the browser - this will appended as a child node to the given DOM element. See the KV.js API method `KV.get_available_providers()` to understand more about the supported wallets. | `parent_container: document.getElementById("walletmodal")` |
| `btn_disconnect_label` | Optional | By default this is "Disconnect". The property accepts a string that will replace the innerHTML within `btn_connect`. For example, your default text might be "Choose Your Wallet", but once connected, this no longer makes sense and the button serves a different function (namely to disconnect the wallet). So, the default disconnection text should be used here. | `btn_disconnect_label: "Disconnect"` |
| `modal_connect_headline` | Optional | The default modal text prompt is "Choose your wallet type", however your may want to provide a different headline in the modal | `modal_connect_headline: "Pick your preferred wallet"` |
| `web3network` | Optional | The default network is the Ethereum Mainnet. Other networks are supported, and the network ID can be specified here. See the KV.js API method `KV.rpc_codes` | `web3network: KV.rpc_codes.MATIC_MAINNET` |

### Supported events

Once the WalletUIHandler is written to the DOM, there are a number of events that can take place as a result of user interaction. These events will likely need some action from you to handle. You can bind to these events using the WalletUIHandler's `.on(ev, fn_handler)` API.

| Event name | Description | Passes into handler | Example |
|---|---|---|---|
| `btnconnect_clicked` | Fired when the user has clicks on the DOM element provided in the init props | A string with one of the following status' is sent: `connect` when the user intent is to select a wallet for connection, `hide` when the user opened the modal dialog to connect a wallet, but clicked on the element again without selecting a wallet (thus hiding the modal), `disconnect` when the user's wallet is connected, and they have clicked the element again in order to terminate the connection | `obj.on("btnconnect_clicked", function(status){ ... });` |
| `modal_open` | Fired when the connection modal is shown on screen. | This method only passes `true` into the handler | `obj.on("modal_open", function(b){ ... });` |
| `modal_closed` | Fired when the connection modal is removed. This happens if the user cancels the modal dialog, or if they choose a wallet to connect to. | This method only passes `true` into the handler | `obj.on("modal_closed", function(b){ ... });` |
| `wallet_connected` | Fired when the wallet connection for the user's chosen wallet has been established. Note, some wallets allow a user to select a different wallet address without firing a `wallet_disconnected` event. You should build with this in mind. | This will pass an array of strings into the handler. Each string represents a connected wallet address. Note that this will usually be an array of length 1. | `obj.on("wallet_connected", function(w){ wallet_addr = w; });` |
| `wallet_disconnected` | Fired when the user disconnects their wallet from your site. | This will send whatever disconnection data comes from the wallet, or simply the string `user disconnected`. The data sent on this callback is not usually very useful. | `obj.on("wallet_disconnected", fn_handle_disconnection);` |


## The Web3 Contract Functions extension (optional)

*COMING SOON*

## License, legal and fun

All my code is Copyright (c) 2022 Kaiesh Vohra and licensed under the GPL.

The other brands, code, dependencies, etc, all belong to their respective owners and their licenses. Appropriate licenses and notices should be present in the code - if not, please let me know and I will update accordingly.
