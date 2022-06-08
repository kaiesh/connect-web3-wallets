//To enable wallet connect, an infuraID is needed, so this should be set first
KV.set_infuraID(YOUR_INFURA_ID);
//The wallet connection system can be then be initialised, and other dependency scripts can be added
KV.init(["https://cdn.kaiesh.com/js/KV.WalletUIHandler.latest.min.js"]).then(function(res){
  let walletui = new KV.WalletUIHandler({
    parent_container: document.getElementById("connect_box"),
    btn_connect: document.getElementById("connect_btn"),
    modal_connect_headline: "Select your wallet",
    btn_disconnect_label: "Disconnect",
    web3network: KV.rpc_codes.ETH_MAINNET
  });
  walletui.on("btnconnect_clicked", function(activity_when){
    console.log("btnconnect", activity_when);
  });
  walletui.on("modal_open", function(msg){
    console.log("modal opened", msg);
  });
  walletui.on("modal_closed", function(msg){
    console.log("modal closed", msg);
  });
  walletui.on("wallet_connecting", function(msg){
    console.log("connecting", msg);
  });
  walletui.on("wallet_connected", function(msg){
    console.log("connected", msg);
  });
  walletui.on("wallet_error", function(msg){
    console.log("wallet err", msg);
  });
  walletui.on("wallet_disconnected", function(msg){
    console.log("wallet disconnected", msg);
  });
}).catch(function(err){
  console.error(err);
});
