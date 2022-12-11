/******
 * This helper class is designed to simplify init of Web3 Wallet connections
 * for vanilla JS implementations.
 *
 * The problem being solved is that every wallet has a slightly different init
 * process, and slightly different mechanism to determine if the wallet is
 * present in the user's browser.
 *
 * The solution provides for a standardised way to query for wallet presence,
 * and connection init, returning an initialised Web3.js wallet object.
 *
 * Currently supports WalletConnect, MetaMask, Binance Wallet, Coinbase Wallet
 * or simply reading chain information via Infura.
 *
 * Depends on Web3.js and WalletConnect JS files - however these are
 * imported through the init function.
 *
 * Copyright (c) 2022 Kaiesh Vohra
 * License: GPL
 *******/

 //Define a cross browser compatible AJAX function
 var ajax = ajax || function(e,r){var t="";for(var n in e)e.hasOwnProperty(n)&&(t+=(""==t?"":"&")+n+"="+encodeURIComponent(e[n]));var o={api_url:"/api/",request_header:"application/x-www-form-urlencoded",json_return:!0,method:"POST"};if("object"==typeof r)for(n in r)r.hasOwnProperty(n)&&(o[n]=r[n]);return new Promise(((e,r)=>{var n=new XMLHttpRequest;n.open(o.method,o.api_url),n.setRequestHeader("Content-Type",o.request_header),n.onload=function(){if(200===n.status){var t=o.json_return?JSON.parse(n.responseText):n.responseText;e(t)}else r({status:"fail",resp:t})},n.send(t)}))};
//Function to add elements to the DOM
 var shield = shield || function ( s, h, i, e, l, d ){ var g = document.createElement(e); g.src = s; if (typeof h=="function") g.onload=h; g.async="async"; if (0) { g.integrity = d; g.crossorigin="anonymous"; }document.getElementsByTagName(i)[l].appendChild(g);};
//Function to support toast style messages (CSS added seperately)
	var showToast = function(msg, classname){
		let all_toasts = document.getElementsByClassName("toast");
		let top_position;
		if (all_toasts.length > 0){
			top_position = (all_toasts[all_toasts.length - 1].offsetTop + all_toasts[all_toasts.length - 1].offsetHeight + 25)+"px";
		}
		let rand_id = Math.floor(Math.random()*1000);
		let t = document.createElement("DIV");
		t.id = "toast"+rand_id;
		t.innerHTML = msg;
		t.className = "toast "+classname;
		if (top_position) t.style.top = top_position;

		document.getElementsByTagName("body")[0].appendChild(t);
		t.addEventListener("mouseover", function(){
			t.classList.add("animpaused");
		});
		t.addEventListener("mouseout", function(){
			t.classList.remove("animpaused");
		});
		t.addEventListener("animationend", function(ev){
			if (ev.animationName == "slide-in"){
				t.parentElement.removeChild(t);
			}
		});
	};
 //Define basic properties to allow wallet connectivity to be managed
 var KV = KV || {
   _infuraID: null,
   _provider_name: localStorage.getItem("provider_name") ? localStorage.getItem("provider_name") : "readonly",
   rpc_url: {
     1: null,
     3: null,
     5: null,
     42: null,
     56: 'https://bsc-dataseed.binance.org/',
     97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
     137: null,
     80001: null
   },
   rpc_codes:{
     "ETH_MAINNET": 1,
     "ETH_ROPSTEN": 3,
     "ETH_GORLI": 5,
     "ETH_KOVAN": 42,
     "BSC_MAINNET": 56,
     "BSC_TESTNET": 97,
     "MATIC_MAINNET": 137,
     "MATIC_MUMBAI": 80001
   },
   network_humannames:{
     1: "Ethereum Mainnet",
     3: "Ethereum Ropsten",
     5: "Ethereum Goerli",
     42: "Ethereum Kovan",
     56: "Binance Smart Chain",
     97: "Binance Smart Chain Test",
     137: "Polygon Mainnet",
     80001: "Polygon Mumbai Testnet"
   },
   block_explorers:{
     1: "https://etherscan.io",
     3: "https://ropsten.etherscan.io",
     5: "https://goerli.etherscan.io",
     42: "https://kovan.etherscan.io",
     56: "https://bscscan.com",
     97: "https://testnet.bscscan.com",
     137: "https://polygonscan.com",
     80001: "https://mumbai.polygonscan.com"
   },
   native_rpcs:{
     1: "https://mainnet.infura.io/v3/",
     3: "https://ropsten.infura.io/v3/",
     4: "https://rinkeby.infura.io/v3/",
     5: "https://goerli.infura.io/v3/",
     42: "https://kovan.infura.io/v3/",
     56: "https://bsc-dataseed.binance.org/",
     97: "https://data-seed-prebsc-1-s1.binance.org:8545",
     137: "https://polygon-rpc.com",
     80001: "https://rpc-mumbai.maticvigil.com"
   },
   network_currency: {
     1: {name: "Ethereum", symbol: "ETH", decimals: 18},
     3: {name: "Ethereum", symbol: "ETH", decimals: 18},
     5: {name: "Ethereum", symbol: "ETH", decimals: 18},
     42: {name: "Ethereum", symbol: "ETH", decimals: 18},
     56: {name: "BNB", symbol: "BNB", decimals: 8},
     97: {name: "tBNB", symbol: "tBNB", decimals: 8},
     137: {name: "MATIC", symbol: "MATIC", decimals: 18},
     80001: {name: "MATIC", symbol: "MATIC", decimals: 18}
   }
 };
//Init sequence to ensure all dependencies are available before attempting
//wallet connectivity
 KV.init = function(addn_scripts, overwrite_defaults){
   if (KV._init_complete) return new Promise((resolve) => { resolve(); });
   return new Promise((resolve, reject) => {
     try{
       let loaded = 0;
       let default_list = ["https://cdn.kaiesh.com/js/web3_3.0.0-rc.5.min.js", "https://cdn.kaiesh.com/js/walletconnect_1.7.1.min.js"]; //['https://cdnjs.cloudflare.com/ajax/libs/web3/3.0.0-rc.5/web3.min.js',"https://unpkg.com/@walletconnect/web3-provider@1.7.1/dist/umd/index.min.js"];
       if (typeof overwrite_defaults == "string"){
         for (let i=0; i < default_list.length; i++){
           default_list[i] = default_list[i].replace("https://cdn.kaiesh.com/", overwrite_defaults);
         }
       }
       let script_list = Array.isArray(addn_scripts) ? (typeof overwrite_defaults == "boolean" && overwrite_defaults ? addn_scripts : default_list.concat(addn_scripts)) : default_list;
       let count_load = function(){
         loaded++;
         if (loaded >= script_list.length){
           KV._init_complete = true;
           if (localStorage.getItem("chainId") && localStorage.getItem("provider_name")){
             KV._provider_name = localStorage.getItem("provider_name");
             KV.wallet.enable(localStorage.getItem("chainId")).then(function (res){
               resolve({"init": "ok", "wallet": "ok"});
             }).catch(function (err){
               resolve({"init": "ok", "wallet": "fail"});
             });
           }else{
             resolve({"init": "ok"});
           }
         }
       }
       for (var i=0; i < script_list.length; i++){
         shield(script_list[i], count_load, "head", "script", 0);
       }
     }catch (e){
       reject(e);
     }
   });
 };
 //WalletConnect requires an InfuraID for ETH networks, so this must be set before it can be used
 KV.set_infuraID = function(infuraID){
   KV._infuraID = infuraID;
   KV.rpc_url[1] = "https://mainnet.infura.io/v3/"+infuraID;
   KV.rpc_url[3] = "https://ropsten.infura.io/v3/"+infuraID;
   KV.rpc_url[5] = "https://goerli.infura.io/v3/"+infuraID;
   KV.rpc_url[42] = "https://kovan.infura.io/v3/"+infuraID;
   KV.rpc_url[137] = "https://polygon-mainnet.infura.io/v3/"+infuraID;
   KV.rpc_url[80001] = "https://polygon-mumbai.infura.io/v3/"+infuraID;
 }
 //Inspect all known window properties to look for various wallets
 KV.get_available_providers = function(){
   //walletconnect will always be available, but will not function for ETH networks unless an infura ID is present
   let provs = [];
   provs.push("walletconnect");

   //Look for metamask
   if (typeof window.ethereum == "object" && window.ethereum.isMetaMask){
     provs.push("metamask");
   }
   //Look for binance wallet
   if (typeof window.BinanceChain == "object"){
     provs.push("binancewallet");
   }
   //Look for coinbase wallet
   //TEMPORARILY DISABLE LOOKUP FOR COINBASE
   /*if (typeof window.ethereum == "object" && Array.isArray(window.ethereum.providers)){
     for (let i = 0; i < window.ethereum.providers.length; i++){
       if (window.ethereum.providers[i].isCoinbaseWallet){
         provs.push("coinbasewallet");
         break;
       }
     }
   }*/
   return provs;
 }
 KV.set_provider = function(provider_name){
   switch (provider_name){
     case "metamask":
     case "walletconnect":
     case "binancewallet":
     //case "coinbasewallet": //TEMPORARILY DISABLE COINBASE WALLET
     case "readonly":
     KV._provider_name = provider_name;
     localStorage.setItem("provider_name", provider_name);
     break;
     default:
     throw Exception("Invalid provider specified");
     break;
   }
 };
 KV.get_provider = function(){
   return KV._provider_name;
 }

 KV.wallet = {
   reset_all: function(){
     KV.wallet._hooks.disconnect = [];
     KV.wallet._hooks.connect = [];
     KV.wallet._hooks.session_change = [];
     localStorage.removeItem("chainId");
     localStorage.removeItem("provider");
     KV.wallet.walletconnect._provider = null;
     KV.wallet.walletconnect._web3 = null;
     KV.wallet.metamask._provider = null;
     KV.wallet.metamask._web3 = null;
     KV.wallet.binancewallet._provider = null;
     KV.wallet.binancewallet._web3 = null;
     KV.wallet.coinbasewallet._provider = null;
     KV.wallet.coinbasewallet._web3 = null;
     KV.wallet.readonly._provider = null;
     KV.wallet.readonly._web3 = null;
     KV._provider_name = null;
   },
   on_disconnect: function (fn_hook){
     if (typeof fn_hook == "function"){
       KV.wallet._hooks.disconnect.push(fn_hook);
     }
   },
   on_session_change: function (fn_hook){
     if (typeof fn_hook == "function"){
       KV.wallet._hooks.session_change.push(fn_hook);
     }
   },
   on_connect: function (fn_hook){
     if (typeof fn_hook == "function"){
       KV.wallet._hooks.connect.push(fn_hook);
     }
   },
   _process_session_update: function(p){
     //potential wallet/chain change
     for (let i = 0; i < KV.wallet._hooks.session_change.length; i++){
       if (typeof KV.wallet._hooks.session_change[i] == "function"){
         (function(handler){
           setTimeout( function(){ handler(p); }, 10);
         })(KV.wallet._hooks.session_change[i])
       }else{
         console.error("Session change hooks", KV.wallet._hooks.session_change[i], "This is not a function");
       }
     }
   },
   _process_disconnection: function(p){
     //the user has disabled connectivity
     //fire disconnection notification
     for (let i = 0; i < KV.wallet._hooks.disconnect.length; i++){
       if (typeof KV.wallet._hooks.disconnect[i] == "function"){
         (function(handler){
           setTimeout( function(){ handler(p); }, 10);
         })(KV.wallet._hooks.disconnect[i])
       }else{
         console.error("Disconnection hooks", KV.wallet._hooks.disconnect[i], "This is not a function");
       }
     }
     //reset everything
     KV.wallet.reset_all();
   },
   _process_connect: function(p){
     //successful connection established
     for (let i = 0; i < KV.wallet._hooks.connect.length; i++){
       if (typeof KV.wallet._hooks.connect[i] == "function"){
         (function(handler){
           setTimeout( function(){ handler(p); }, 10);
         })(KV.wallet._hooks.connect[i])
       }else{
         console.error("Disconnection hooks", KV.wallet._hooks.connect[i], "This is not a function");
       }
     }
   },
   _hooks: {disconnect:[], session_change:[], connect:[]},
   walletconnect: {
     enable: function(network_id){
       return new Promise((resolve, reject) => {
         if (KV.rpc_url[network_id] == null){
           reject({"code": -1, "debug": "Invalid RPC url for this network. You might need an Infura ID for Wallet Connect to work on this network.\n\nUse the function KV.set_infuraID(str) to set your Infura ID before invoking this method."});
           return;
         }
         KV.wallet.walletconnect._provider = new WalletConnectProvider.default({
           infuraId: KV._infuraID,
           rpc: KV.rpc_url,
           chainId: network_id
         });
         KV.wallet.walletconnect._provider.chainId = network_id;
         KV.wallet.walletconnect._provider.enable().then(function(res){
           KV.wallet.walletconnect._web3 = new Web3(KV.wallet.walletconnect._provider);
           localStorage.setItem("chainId", network_id);
           KV.wallet.walletconnect._provider.on("disconnect", KV.wallet._process_disconnection);
           KV.wallet.walletconnect._provider.on("session_update", KV.wallet._process_session_update);
           KV.wallet._process_connect(res);
           resolve(res);
         }).catch(function(err){
           reject(err);
         });
       });
     }
   },
   binancewallet: {
     enable: function(network_id){
       return new Promise((resolve, reject) => {
         if (typeof window.BinanceChain != "object") reject({"code": -1, "debug":"Binance Chain wallet not found. Please query available providers before invoking."});
         KV.wallet.binancewallet._provider = window.BinanceChain;
         if ((network_id == 1 && window.BinanceChain.chainId != '0x01') && window.BinanceChain.chainId != '0x'+Number(network_id).toString(16)) {
           reject({"code":4901, "target_network": '0x'+Number(network_id).toString(16), "actual_network": window.BinanceChain.chainId});
         }else{
           KV.wallet.binancewallet._provider.enable().then(
             function (enableres){
               KV.wallet.binancewallet._web3 = new Web3(window.BinanceChain)
               localStorage.setItem("chainId", network_id);
               KV.wallet.binancewallet._provider.on("disconnect", KV.wallet._process_disconnection);
               KV.wallet.binancewallet._provider.on("accountsChanged", KV.wallet._process_session_update);
               KV.wallet._process_connect(enableres);
               resolve(enableres);
             }
           ).catch(
             function (failres){
               //user rejected connection
               reject(failres);
             }
           );
         }
       });
     }
   },
   coinbasewallet: {
     enable: function(network_id){
       return new Promise((resolve, reject) => {
         if (typeof window.ethereum == "object" && Array.isArray(window.ethereum.providers)){
           for (let x = 0; x < window.ethereum.providers.length; x++){
             if (window.ethereum.providers[x].isCoinbaseWallet){
               KV.wallet.coinbasewallet._provider = window.ethereum.providers[x];
               break;
             }
           }
           KV.wallet.coinbasewallet._provider.request({ method: 'wallet_addEthereumChain', params:[{
             chainId: '0x'+Number(network_id).toString(16),
             blockExplorerUrls: [KV.block_explorers[network_id]],
             chainName: KV.network_humannames[network_id],
             nativeCurrency: KV.network_currency[network_id],
             rpcUrls:[KV.native_rpcs[network_id]]
           }]}).then(function(nres){
             console.log(nres);
             KV.wallet.coinbasewallet._provider.enable().then(
               function (enableres){
                 console.log(enableres);
                 KV.wallet.coinbasewallet._web3 = new Web3(KV.wallet.coinbasewallet._provider);
                 localStorage.setItem("chainId", network_id);
                 KV.wallet.coinbasewallet._provider.on("disconnect", KV.wallet._process_disconnection);
                 KV.wallet.coinbasewallet._provider.on("accountsChanged", KV.wallet._process_session_update);
                 KV.wallet._process_connect(enableres);
                 resolve(enableres);
               }
             ).catch(function(err_res){
               reject(err_res);
             });
           }).catch(function(perr_res){
             reject(perr_res);
           });

         }else{
           reject({"code":-1, "debug": "Wallet provider not available"});
         }
       });
     }
   },
   metamask: {
     enable: function(network_id){
       return new Promise((resolve, reject) => {
         if (window.ethereum){
           //Check if the user has multiple wallets installed, if so, we only want metamask
           let mm;
           if (Array.isArray(window.ethereum.providers)){
             for (var i=0; i < window.ethereum.providers.length; i++){
               if (window.ethereum.providers[i].isMetaMask){
                 mm = window.ethereum.providers[i];
                 break;
               }
             }
           }else{
             mm = window.ethereum;
           }
           //Newer implementation
           KV.wallet.metamask._provider = mm;
           let request;
           if (network_id != 1){
             request = { method: 'wallet_addEthereumChain', params:[{
               chainId: '0x'+Number(network_id).toString(16),
               blockExplorerUrls: [KV.block_explorers[network_id]],
               chainName: KV.network_humannames[network_id],
               nativeCurrency: KV.network_currency[network_id],
               rpcUrls:[KV.native_rpcs[network_id]]
             }]};
           }else{
             request = { method: 'wallet_switchEthereumChain', params:[{chainId: '0x'+Number(network_id).toString(16)}]};
           }
           let _connect_wallet = function (nres){
             KV.wallet.metamask._provider.enable().then(
               function(enableres){
                 KV.wallet.metamask._web3 = new Web3(window.ethereum);
                 localStorage.setItem("chainId", network_id);
                 KV.wallet.metamask._provider.on("disconnect", KV.wallet._process_disconnection);
                 KV.wallet.metamask._provider.on("accountsChanged", KV.wallet._process_session_update);
                 KV.wallet._process_connect(enableres);
                 resolve(enableres);
               }
             )
             .catch(function(err){
               //user rejected network change
               reject(err);
             });
           };
           KV.wallet.metamask._provider.request(request).then(_connect_wallet)
           .catch(
             function(err){
               if (err.code == -32602){
                 //network already added, but with slightly different profile
                 request = { method: 'wallet_switchEthereumChain', params:[{chainId: '0x'+Number(network_id).toString(16)}]};
                 KV.wallet.metamask._provider.request(request).then(_connect_wallet).catch(reject);
               }else{
                 reject(err);
               }
             }
           )
         }else if (window.web3){
           //Legacy DApp
           KV.wallet.metamask._web3 = window.web3;
           localStorage.setItem("chainId", network_id);
           KV.wallet._process_connect();
           resolve();
         }else{
           //local RPC port no longer supported
           KV.wallet.metamask._provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
           KV.wallet.metamask._provider.chainId = network_id;
           KV.wallet.metamask._web3 = new Web3(KV.wallet.metamask._provider);
           localStorage.setItem("chainId", network_id);
           KV.wallet.metamask._provider.on("disconnect", KV.wallet._process_disconnection);
           KV.wallet.metamask._provider.on("accountsChanged", KV.wallet._process_session_update);
           reject();
         }
       });
     }
   },
   readonly: {
     enable: function(network_id){
       return new Promise((resolve, reject) => {
         KV.wallet.readonly._provider = new Web3.providers.HttpProvider(KV.rpc_url[network_id]);
         KV.wallet.readonly._web3 = new Web3(KV.wallet.readonly._provider);
         KV.wallet._process_connect();
         localStorage.setItem("chainId", network_id);
         resolve();
       });
     }
   }
 };
 KV.wallet.enable = function(network_id){
   if (!network_id) network_id = KV.rpc_codes.ETH_MAINNET;
   return KV.wallet[KV._provider_name].enable(network_id);
 };
 KV.wallet.web3 = function(){
   return KV.wallet[KV._provider_name]._web3;
 }
 KV.wallet.disconnect = function(){
   if (KV._provider_name == "walletconnect"){
     KV.wallet.walletconnect._provider.disconnect().then(console.log).catch(console.log);
   }
   KV.wallet.reset_all();
 };

 KV.Contract = function(addr){
   this.contract_address = addr;
 };

 KV.Contract.prototype.load = function(contract_url, readonly_from_chain_id){
   var ct = this;
   return new Promise((resolve, reject) => {
     ajax([], {
       "api_url": typeof contract_url == "string" ? contract_url : "/rpc-data/"+ct.contract_address+".json",
       "method": "GET"
     })
     .then(function(res){
       if (readonly_from_chain_id > 0){
         //without using the user's wallet managed connection, try to read directly from the chain's gateway
         let roProv = new Web3.providers.HttpProvider(KV.rpc_url[readonly_from_chain_id]);
         let roWeb3 = new Web3(roProv);
         ct.w3contract = new roWeb3.eth.Contract(res, ct.contract_address);
         resolve(ct);
       }else{
         let w3 = KV.wallet.web3();
         ct.w3contract = new w3.eth.Contract(res, ct.contract_address);
         resolve(ct);
       }
     })
     .catch(function(err){
       reject(err);
     });
   });
 };
