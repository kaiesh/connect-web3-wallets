KV.ContractFns = {
  cts: {}, //variable to store W3 Contract instances
  ct_abisource_base: {
    1: "https://api.etherscan.io/api?module=contract&action=getabi&address=",
    3: null,
    5: null,
    42: null,
    56: "https://api.bscscan.com/api?module=contract&action=getabi&address=",
    97: "https://api-testnet.bscscan.com/api?module=contract&action=getabi&address=",
    137: "https://api.polygonscan.com/api?module=contract&action=getabi&address=",
    80001: null
  },
  ct_abisource_apikeys: {},
  _readycts: {},
  _queuects: {}
};

/**
 * ABI definitions for verified contracts are available via API, this method
 * constructs the URLs to retrieve those ABIs. If you would like to use a
 * different source for ABI definitions, then simply change the
 * ct_abisource_base for the chain you need to customise, or override this
 * method to return the appropriate target
 **/
KV.ContractFns.get_abi_url = function (ct_addr){
  let chainId = KV.wallet.web3().eth.getChainId();
  let url = KV.ContractFns.ct_abisource_base[chainId];
  if (!url) return false;
  url += KV.ContractFns.ct_abisource_apikeys[chainId] ? '&apikey=' + KV.ContractFns.ct_abisource_apikeys[chainId] : "";
  return url;
};
KV.ContractFns.set_abi_apikey = function (chainId, apikey){
  if (typeof chainId == "number" && typeof apikey == "string"){
    KV.ContractFns.ct_abisource_apikeys[chainId] = apikey;
    return true;
  }else{
    return false;
  }
};

/**
 * Loads a W3 contract into a variable, and retrieves the necessary ABI to
 * support execution. If the ABI neds to come from a specific location
 * then this can also be provided
 **/
KV.ContractFns.prepare_contract = function(props){
  // short_name, contract_address, contract_abi, readonly_from_chain_id
  return new Promise((resolve, reject)=>{
    KV.ContractFns.cts[props.short_name] = new KV.Contract(props.contract_address);
    KV.ContractFns.cts[props.short_name].load(typeof props.contract_abi == "string" ? props.contract_abi : KV.ContractFns.get_abi_url(props.contract_address), props.readonly_from_chain_id).then(
      function (ct){
        KV.ContractFns._ct_prepared(props.short_name);
        resolve(ct);
      }
    ).catch(
      function (err){
        reject(err);
      }
    );
  });
}

KV.ContractFns._ct_prepared = function(short_name){
  KV.ContractFns._readycts[short_name] = true;
  if (Array.isArray(KV.ContractFns._queuects[short_name]) && KV.ContractFns._queuects[short_name].length > 0){
    while(KV.ContractFns._queuects[short_name].length > 0){
      KV.ContractFns._queuects[short_name].pop()(KV.ContractFns.cts[short_name]);
    }
  }
}
/**
 * Allows queuing of contract queries, and firing of requests only if the
 * contract has loaded.
 **/
KV.ContractFns.when_ready = function(short_name){
  return new Promise((resolve, reject) => {
    if (KV.ContractFns._readycts[short_name]){
      resolve(KV.ContractFns.cts[short_name]);
    }else{
      if (!Array.isArray(KV.ContractFns._queuects[short_name])){
        KV.ContractFns._queuects[short_name] = [];
      }
      KV.ContractFns._queuects[short_name].push(resolve);
    }
  });
}

/**
 * Inspects a given wallet address for balances of a specific list of tokens.
 * Also allows for the tokens to be checked for spender authorisation against
 * a given contract. Data is cached for a defined period of time to prevent
 * unnecessary network calls, however checks can be forced.
 *
 * Expects:
 * - wallet_addr: <string> The address to inspect in format 0x....
 * - tokens: <Object: <string>:<Object: <string>>> The list of tokens to check
 *           balances for, in a specific format of
 *           {"TOKEN_NAME1": {"contract":"0x...."}, "TOKEN_NAME2": {...}, ...}
 * - force_check: [Optional] A booleany value to instruct the function to ignore
 *                the cache
 * - spenders: [Optional] An object that defines which currencies to check
 *             for spend authorisation against given contract addresses. If only
 *             a string is provided, then the one string will be used as the
 *             contract address to check against. For example:
 *             {"TOKEN_NAME1" : "0x...", "TOKEN_NAME2": "0x...", ... }
 *             or "0x..."
 *
 * Returns:
 * - A promise that will expose the balances of all tokens once discovered in
 *   the following format:
 *   {"TOKEN_NAME": {"contract": "0x...", "balance": 1E18, "decimals": 1E18}, ...}
 *   If "spenders" is also specified, then each token object will contain the
 *   additional property "allowance"
 **/
KV.ContractFns.get_token_balances = function (wallet_addr, tokens, force_check, spenders){
  return new Promise((resolve, reject) => {
    let w3cache = JSON.parse(localStorage.getItem("w3cache"));
    let tokens_to_check = {};
    if (!force_check && w3cache && w3cache.tokenBalances){
      for (tName in tokens){
        if (tokens.hasOwnProperty(tName)){
          if (typeof w3cache.tokenBalances[tName] == "undefined" || w3cache.tokenBalances[tName].lastCheck + CACHE_THRESHOLD < new Date().getTime()){
            tokens_to_check[tName] = tokens[tName];
          }
          if (typeof KV.ContractFns.cts[tName] == "undefined"){
            KV.ContractFns.cts[tName] = new KV.Contract(tokens_to_check[tName]["contract"]);
            KV.ContractFns.cts[tName].load(KV.ContractFns.get_abi_url(tokens_to_check[tName]["contract"]));
          }
        }
      }
    }else{
      tokens_to_check = tokens;
    }

    var all_qs = [];
    var idx = {}, callback_i = 0;
    for (var i=0; i < ccys.length; i++){
      all_qs.push(KV.ContractFns.cts[tokenName].w3contract.methods["balanceOf"](wallet).call());
      all_qs.push(KV.ContractFns.cts[tokenName].w3contract.methods["decimals"]().call());
      idx[callback_i++] = {currency: tokenName, type: "balanceOf"};
      idx[callback_i++] = {currency: tokenName, type: "decimals"};
      if (typeof spenders == "object" && typeof spenders[tokenName] == "string"){
        all_qs.push(KV.ContractFns.cts[tokenName].w3contract.methods["allowance"](wallet, spenders[tokenName]).call());
        idx[callback_i++] = {currency: tokenName, type: "allowance"};
      }else if (typeof spenders == "string"){
        all_qs.push(KV.ContractFns.cts[tokenName].w3contract.methods["allowance"](wallet, spenders).call());
        idx[callback_i++] = {currency: tokenName, type: "allowance"};
      }
    }
    Promise.all(all_qs).then(
      res => {
        for (var i=0; i < res.length; i++){
          if (res){
            switch (idx[i].type){
              case "balanceOf":
              w3cache[idx[i].currency]["balance"] = res[i];
              break;
              case "decimals":
              w3cache[idx[i].currency]["decimals"] = res[i];
              break;
              case "allowance":
              w3cache[idx[i].currency]["allowance"] = res[i];
              break;
              default:
              console.error("Unknown response index ["+i+"]", res[i]);
              break;
            }
          }
        }
        localStorage.setItem("w3cache", JSON.stringify(w3cache));
        resolve(w3cache);
      }
    ).catch(function (err){
      reject(err);
    });
  });
};
