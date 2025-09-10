// src/App.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";

const contractAddress = "0x9d2C68fa1199B8B720e59B4E18264C81cCacDafA"; // deployed address
const contractABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "bool", name: "result", type: "bool" },
      { indexed: false, internalType: "uint256", name: "amountWon", type: "uint256" }
    ],
    name: "CoinFlipped",
    type: "event"
  },
  { inputs: [], name: "flipcoin", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { stateMutability: "payable", type: "receive" },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// ✅ Fallback provider for HTTPS (replace with your own Infura/Alchemy key)
const fallbackProvider = new ethers.JsonRpcProvider(
  "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
);

function App() {
  const [account, setAccount] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [result, setResult] = useState(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      fetchContractBalance();
    } else {
      alert("MetaMask not detected!");
    }
  };

  // Fetch contract balance
  const fetchContractBalance = async () => {
    const provider = window.ethereum
      ? new ethers.BrowserProvider(window.ethereum)
      : fallbackProvider;

    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const bal = await contract.contractBalance();
    setBalance(ethers.formatEther(bal));
  };

  // Flip coin
  const flipCoin = async () => {
    if (!window.ethereum) return alert("MetaMask not installed!");
    try {
      if (!betAmount || isNaN(betAmount)) return alert("Enter a valid ETH amount!");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      setLoading(true);
      setResult(null);

      contract.once("CoinFlipped", (player, didWin, amountWon) => {
        setResult(didWin ? `🎉 You won ${ethers.formatEther(amountWon)} ETH` : "😢 You lost");
        fetchContractBalance();
        setLoading(false);
      });

      const tx = await contract.flipcoin({
        value: ethers.parseEther(betAmount.trim()),
        gasLimit: 300000
      });
      await tx.wait();

    } catch (err) {
      console.error("Transaction error:", err);
      alert("Transaction failed!");
      setLoading(false);
    }
  };

  // Auto-check wallet connection on load
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchContractBalance();
        }
      });
    } else {
      // Still fetch balance with fallback
      fetchContractBalance();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-700 via-indigo-800 to-gray-900 text-white">
      <div className="p-8 rounded-2xl shadow-xl bg-black/40 backdrop-blur-md w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-purple-600">🎲 Coin Flip DApp</h1>

        {account ? (
          <p className="mb-3 text-sm">Connected: <span className="font-mono">{account}</span></p>
        ) : (
          <button onClick={connectWallet} className="bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-500">
            Connect Wallet
          </button>
        )}

        <p className="mb-4 text-lg">💰 Contract Balance: <span className="font-bold">{balance} ETH</span></p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter ETH amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="p-2 rounded-lg text-black w-32 text-center"
          />
          <button onClick={flipCoin} className="bg-green-600 px-4 py-2 rounded-xl hover:bg-green-500">
            Flip Coin
          </button>
        </div>

        {loading && <p className="text-yellow-400 animate-pulse">⏳ Transaction pending...</p>}
        {result && <h3 className="text-xl font-semibold mt-3">{result}</h3>}
      </div>
    </div>
  );
}

export default App;
