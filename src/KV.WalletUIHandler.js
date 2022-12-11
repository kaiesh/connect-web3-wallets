KV.WalletUIHandler = function(params){
  params.modal_connect_headline = typeof params.modal_connect_headline == "string" ? params.modal_connect_headline : "Choose your wallet type";
  params.btn_disconnect_label = typeof params.btn_disconnect_label == "string" ? params.btn_disconnect_label : "Disconnect";
  params.parent_container = typeof params.parent_container == "object" ? params.parent_container : document.getElementsByTagName("body")[0];
  params.web3network = typeof params.web3network == "number" ? params.web3network : 1; //default to the ETH mainnet
  this.handlers = {
    btnconnect_clicked: [],
    modal_open: [],
    modal_closed: [],
    wallet_connecting: [],
    wallet_connected: [],
    wallet_disconnected: [],
    wallet_error: []
  };
  var thi = this;
  params.btn_connect.addEventListener("click", function(){
    params.btn_connect.disabled = true;
    if (thi._wallet){
      //user is connected, this is a request to disconnect
      thi._trigger_callback("btnconnect_clicked", "disconnect");
      KV.wallet.disconnect();
      params.btn_connect.innerHTML = thi._connect_string;
      params.btn_connect.disabled = false;
      delete thi._wallet;
      thi._trigger_callback("wallet_disconnected", "user-click");
      //TODO Disconnect wallet
    }else if (thi._modaldiv){
      //the modal must be open, but no connection established. This is a request to hide the modal.
      thi._trigger_callback("btnconnect_clicked", "hide");
      thi._modaldiv.parentElement.removeChild(thi._modaldiv);
      thi._modaldiv = false;
      thi._trigger_callback("modal_closed", true);
      params.btn_connect.disabled = false;
    }else{
      //this is a request to pop the connection modal
      let wallet_options = KV.get_available_providers();
      let wallet_options_ml = "";
      for (let i=0; i < wallet_options.length; i++){
        switch (wallet_options[i]){
          case "walletconnect":
          wallet_options_ml += "<button class='kvwalletbtn' id='kvwalletmodal_walletconnect_btn'>WalletConnect</button>";
          break;
          case "metamask":
          wallet_options_ml += "<button class='kvwalletbtn' id='kvwalletmodal_metamask_btn'>MetaMask</button>";
          break;
          case "binancewallet":
          wallet_options_ml += "<button class='kvwalletbtn' id='kvwalletmodal_binance_btn'>Binance</button>";
          break;
          case "coinbasewallet":
          wallet_options_ml += "<button class='kvwalletbtn' id='kvwalletmodal_coinbase_btn'>Coinbase</button>";
          break;
        }
      }

      let connect_to_wallet = function(ev){
        params.btn_connect.disabled = true;
        let btnarr = document.getElementsByClassName("kvwalletbtn");
        for (let i=0; i < btnarr.length; i++){
          btnarr[i].classList.remove("selected");
          btnarr[i].disabled = true;
        }
        ev.target.classList.add("selected");
        thi._trigger_callback("wallet_connecting", ev.currentTarget.id);
        switch (ev.currentTarget.id){
          case "kvwalletmodal_binance_btn":
            KV.set_provider("binancewallet");
            break;
          case "kvwalletmodal_metamask_btn":
            KV.set_provider("metamask");
            break;
          case "kvwalletmodal_coinbase_btn":
              KV.set_provider("coinbasewallet");
              break;
          case "kvwalletmodal_walletconnect_btn":
            KV.set_provider("walletconnect");
            break;
          default:
            console.error("NO TARGET ID FOUND: "+ev.currentTarget.id, ev.currentTarget);
            break;
        }
        thi._init_connection(params);
      };

      thi._trigger_callback("btnconnect_clicked", "connect");
      thi._modaldiv = document.createElement("DIV");
      thi._modaldiv.id = "kvwalletmodal"+Math.floor(Math.random()*10000);
      thi._modaldiv.className = "kvwalletmodal";
      thi._modaldiv.innerHTML = "<h2>"+params.modal_connect_headline+"</h2>"+wallet_options_ml;
      switch (params.modal_position){
        case "below":
          //TODO support positioning instructions
          break;
      }
      params.parent_container.appendChild(thi._modaldiv);
      let btns = params.parent_container.querySelectorAll(".kvwalletmodal button");
      for (let i = 0; i < btns.length; i++){
        btns[i].addEventListener("click", connect_to_wallet);
      }
      thi._trigger_callback("modal_open", true);
      params.btn_connect.disabled = false;
    }
  });

  //The KV.js init method will inspect for existing wallet bindings, if they exist, it will return "ok" here
  if (params.wallet_ready == "ok"){
    this._init_connection(params);
  }
};

KV.WalletUIHandler.prototype._trigger_callback = function(ev, data){
  if (this.handlers[ev].length > 0){
    for (let i=0; i < this.handlers[ev].length; i++){
      if (typeof this.handlers[ev][i] == "function"){
        (function (handler){
          setTimeout(function(){ handler(data) }, 10);
        })(this.handlers[ev][i])
      }
    }
  }
};

/**
 * Possible events to get notifications on:
 * btnconnect_clicked: When a user has clicked the btnconnect DOM element
 * modal_open: When the connection modal is on screen
 * modal_closed: When the connection modal has been destroyed
 * wallet_connected: When the wallet connection has been established
 * wallet_error: When there is an error connecting to a wallet
 *
 * Returns an ID that can be used to remove the handler in the future
 **/
KV.WalletUIHandler.prototype.on = function (ev, handler){
  if (Array.isArray(this.handlers[ev]) && typeof handler == "function"){
    this.handlers[ev].push(handler);
    return this.handlers[ev].length;
  }else{
    return false;
  }
};

/**
 * Remove an event handler by reference ID
 **/
KV.WalletUIHandler.prototype.off = function(ev, id){
  if (Array.isArray(this.handlers[ev]) && typeof this.handlers[ev][id - 1] == "function"){
    this.handlers[ev][id - 1] = null;
  }
};

KV.WalletUIHandler.prototype._init_connection = function(params){
  var thi = this;
  let btnarr = document.getElementsByClassName("kvwalletbtn");
  KV.wallet.enable(params.web3network).then(function(res){
    KV.wallet.web3().eth.getAccounts().then(function(wallets){
      thi._connect_string = params.btn_connect.innerHTML; //save the current button string
      thi._wallet = wallets;
      thi._trigger_callback("wallet_connected", wallets);
      params.btn_connect.innerHTML = params.btn_disconnect_label;
      if (typeof thi._modaldiv == "object"){
        thi._modaldiv.parentElement.removeChild(thi._modaldiv);
        thi._modaldiv = false;
      }
      KV.wallet.on_disconnect(function(wallet_disconnect_data){
        params.btn_connect.innerHTML = thi._connect_string;
        params.btn_connect.disabled = false;
        delete thi._wallet;
        thi._trigger_callback("wallet_disconnected", wallet_disconnect_data);
      });
      KV.wallet.on_session_change(function(sess_info){
        if (sess_info.length == 0){
          //mark it as disconnected
          KV.wallet.disconnect();
          params.btn_connect.innerHTML = thi._connect_string;
          params.btn_connect.disabled = false;
          delete thi._wallet;
          thi._trigger_callback("wallet_disconnected", "user disconnected");
        }else{
          //user has changed wallet
          thi._trigger_callback("wallet_connected", sess_info);
        }
      });
      params.btn_connect.disabled = false;
      thi._trigger_callback("modal_closed", true);
    })
  }).catch(function(err){
    console.error(err);
    for (let i=0; i < btnarr.length; i++){
      btnarr[i].classList.remove("selected");
      btnarr[i].disabled = false;
    }
    thi._trigger_callback("wallet_error", err);
    params.btn_connect.disabled = false;
  });
}
