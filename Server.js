// 🎁 PortHub - Telegram Mini-App Server
// by Akajsnndnf

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// --- Supabase Setup ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- Telegram Config ---
const OWNER_ID = 6828396702;
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// --- Utils ---
async function sendTelegramMessage(chat_id, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text, parse_mode: "HTML" })
  });
}

// --- API ROUTES ---

// 🔹 Get NFT Catalog
app.get("/api/nfts", async (req, res) => {
  const { data, error } = await supabase.from("nfts").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔹 Get User Info
app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 🔹 Purchase NFT
app.post("/api/purchase", async (req, res) => {
  const { buyer_id, nft_id } = req.body;

  const { data: nft } = await supabase.from("nfts").select("*").eq("id", nft_id).single();
  const { data: buyer } = await supabase.from("users").select("*").eq("id", buyer_id).single();
  const { data: seller } = await supabase.from("users").select("*").eq("id", nft.owner_id).single();

  if (!nft || !buyer || !seller)
    return res.status(404).json({ error: "NFT или пользователь не найден" });

  if (buyer.balance < nft.price)
    return res.status(400).json({ error: "Недостаточно средств" });

  const commission = nft.price * 0.02;
  const sellerIncome = nft.price - commission;

  // Обновляем балансы
  await supabase.from("users").update({ balance: buyer.balance - nft.price }).eq("id", buyer_id);
  await supabase.from("users").update({ balance: seller.balance + sellerIncome }).eq("id", seller.id);

  // Передача NFT
  await supabase.from("nfts").update({ owner_id: buyer_id }).eq("id", nft_id);

  await sendTelegramMessage(buyer_id, `🎁 Вы купили ${nft.name} за ${nft.price.toFixed(2)} TON`);
  await sendTelegramMessage(seller.id, `💰 Ваш подарок ${nft.name} продан! +${sellerIncome.toFixed(2)} TON`);

  res.json({ success: true });
});

// 🔹 Admin — Add Balance
app.post("/api/admin/addbalance", async (req, res) => {
  const { admin_id, user_id, amount } = req.body;
  if (parseInt(admin_id) !== OWNER_ID) return res.status(403).json({ error: "Нет доступа" });

  const { data: user } = await supabase.from("users").select("*").eq("id", user_id).single();
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  const newBalance = user.balance + parseFloat(amount);
  await supabase.from("users").update({ balance: newBalance }).eq("id", user_id);

  await sendTelegramMessage(user_id, `💰 Вам начислено ${amount} TON`);
  res.json({ success: true });
});

// --- Run Server ---
app.listen(PORT, () => {
  console.log(`🚀 PortHub server running on http://localhost:${PORT}`);
});
