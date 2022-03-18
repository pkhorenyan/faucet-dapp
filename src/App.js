import { useEffect, useState, useCallback } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [accBalance, setAccBalance] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [ctrAd, setCtrAd] = useState("Contract address");
  const canConnectToContract = account;

  const [donateValue, setDonateValue] = useState("");
  const [withdrawValue, setWithdrawValue] = useState("");

  const [shouldReload, setShouldReload] = useState(false);
  let [loading, setLoading] = useState(false);

  const setAccountListener = (provider) => {
    provider.on("accountsChanged", () => reloadEffect());
    provider.on("chainChanged", () => reloadEffect());
  };

  const reloadEffect = useCallback(
    () => setShouldReload(!shouldReload),
    [shouldReload]
  );

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        setAccountListener(provider);

        setWeb3Api({
          web3: new Web3(provider),
          provider,
          isProviderLoaded: true,
        });
      } else {
        setWeb3Api({ ...web3Api, isProviderLoaded: true });
        console.log("Please install MetaMask");
      }
    };

    loadProvider();
  }, []);

  // CONTRACT BALANCE
  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const ctrBal = await web3.eth.getBalance(contract.options.address);
      setBalance(web3.utils.fromWei(ctrBal, "ether"));
    };
    web3Api.contract && loadBalance();
  }, [web3Api, shouldReload]);

  // ACCOUNT BALANCE
  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
      if (accounts[0]) {
        const accBalance = await web3Api.web3.eth.getBalance(accounts[0]);
        setAccBalance(web3Api.web3.utils.fromWei(accBalance, "ether"));
      }
    };
    web3Api.web3 && getAccount();
  }, [web3Api.web3, shouldReload]);

  // DEPLOYING CONTRACT
  const deployContract = useCallback(async () => {
    setLoading(true);
    const { web3 } = web3Api;
    const response = await fetch(`/contracts/Faucet.json`);
    const compiledContract = await response.json();
    const web3Contract = await new web3.eth.Contract(compiledContract.abi);
    const accounts = await web3.eth.getAccounts();

    try {
      const result = await web3Contract
        .deploy({
          data: compiledContract.bytecode,
        })
        .send({ from: accounts[0] });

      web3Contract.options.address = result._address;
      setContractAddress(result._address);
      setWeb3Api({ ...web3Api, contract: result });
    } catch (error) {
      console.log(error.Message);
    }
    setLoading(false);
  }, [web3Api]);

  // ADD FUNDS
  const addFunds = useCallback(async () => {
    setLoading(true);
    const { contract, web3 } = web3Api;
    await contract.methods
      .addFunds()
      .send({ value: web3.utils.toWei(donateValue, "ether"), from: account });
    setLoading(false);
    reloadEffect();
  }, [web3Api, account, donateValue, reloadEffect]);

  // WITHDRAW FUNDS
  const withdrawFunds = useCallback(async () => {
    setLoading(true);
    const { contract, web3 } = web3Api;
    const withDrawAmount = await web3.utils.toWei(withdrawValue, "ether");
    await contract.methods.withdraw(withDrawAmount).send({ from: account });
    setLoading(false);
    reloadEffect();
  }, [web3Api, account, withdrawValue, reloadEffect]);

  // CONNECT TO CONTRACT
  const connectToContract = useCallback(async () => {
    setContractAddress(ctrAd);
    const contractAddress = await ctrAd;
    const { web3 } = web3Api;
    const response = await fetch("/contracts/Faucet.json");
    const compiledContract = await response.json();
    const web3Contract = await new web3.eth.Contract(
      compiledContract.abi,
      contractAddress
    );
    console.log(web3Contract);

    setWeb3Api({ ...web3Api, contract: web3Contract });
  }, [web3Api, ctrAd]);

  return (
    <div className="App">
      <div className="faucet-wrapper">
        <div className="faucet">
          <span>
            <strong>Account:</strong>
          </span>
          <h1>{account ? account : "not connected"}</h1>
          <span>
            <strong>Balance:</strong>
          </span>
          <h1>{account ? `${accBalance} ETH` : "not connected"}</h1>
          <div className="balance-view is-size-2 mb-2">
            Contract balance: <strong>{balance}</strong> ETH
          </div>
          <span>
            <strong>Contract address:</strong>
          </span>
          <h1>{contractAddress ? contractAddress : "not connected"}</h1>
          <br></br>
          <div className="field has-addons">
            <input
              className="input"
              type="number"
              placeholder="Donate ETH amount"
              onChange={(e) => {
                setDonateValue(e.target.value);
              }}
            />

            <p className="control is-expanded">
              <button
                className={
                  loading ? "button is-info is-loading" : "button is-info "
                }
                onClick={addFunds}
                disabled={!canConnectToContract}
              >
                Donate
              </button>
            </p>
          </div>
          <div className="field has-addons mb-5">
            <input
              className="input"
              type="number"
              placeholder="Withdraw ETH amount"
              onChange={(e) => {
                setWithdrawValue(e.target.value);
              }}
            />
            <p className="control is-expanded">
              <button
                className={
                  loading
                    ? "button is-danger is-loading"
                    : "button is-danger is-fullwidth"
                }
                onClick={withdrawFunds}
                disabled={!canConnectToContract}
              >
                Withdraw
              </button>
            </p>
          </div>

          {web3Api.isProviderLoaded ? (
            web3Api.provider ? (
              <>
                <button
                  className={
                    canConnectToContract
                      ? "button is-primary mr-2 is-hidden"
                      : "button is-primary mr-2 mb-4"
                  }
                  onClick={() => {
                    web3Api.provider.request({ method: "eth_requestAccounts" });
                  }}
                >
                  Connect Metamask
                </button>
                <div className={canConnectToContract ? "" : "is-hidden"}>
                  <button
                    className={
                      loading
                        ? "button is-primary is-loading"
                        : "button is-primary mr-2 mb-4"
                    }
                    onClick={() => {
                      deployContract();
                    }}
                  >
                    Deploy a new contract
                  </button>
                </div>
                <div className={canConnectToContract ? "" : "is-hidden"}>
                  <input
                    className="input mb-2"
                    type="text"
                    placeholder={ctrAd}
                    onChange={(e) => {
                      setCtrAd(e.target.value);
                    }}
                  />
                  <button
                    className={
                      canConnectToContract
                        ? "button is-primary mr-2"
                        : "button is-primary mr-2 is-hidden"
                    }
                    onClick={() => {
                      connectToContract();
                    }}
                  >
                    Connect to contract
                  </button>
                </div>
              </>
            ) : (
              <button
                className="button is-primary mr-2"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://docs.metamask.io", "_blank");
                }}
              >
                Install Metamask
              </button>
            )
          ) : (
            <span className="tag is-large is-white">Loading... </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
