const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "exporter",
  }),
});

client.on("qr", (qr) => {
  // Generate and scan this code with your phone
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Client is ready!");
  // Fetch all channel ID's
  let messages = [];
  // For each letter in the alphabet, run a search
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    messages = [...messages, ...(await client.searchMessages(letter))];
  }
  console.log(`Found ${messages.length} messages`);
  let chats = await Promise.all(messages.map((msg) => msg.getChat()));
  console.log(`Found ${chats.length} chats`);
  // Dedupe the chats by .id
  chatDict = {};
  chats.forEach((chat) => {
    chatDict[JSON.stringify(chat.id)] = chat;
  });
  chats = Object.values(chatDict);
  console.log(`Found ${chats.length} unique chats`);
  // Archive each chat
  await Promise.all(chats.map((chat) => archiveChat(chat)));
  console.log("Done archiving chats");
});

const fs = require("fs");
let archivedChats;
try {
  archivedChats = JSON.parse(fs.readFileSync("archivedChats.json"));
} catch (e) {
  archivedChats = {};
}

async function archiveChat(chat) {
  console.log(`Archiving ${chat.name}`);
  const startTime = performance.now();
  const chatMessages = await chat.fetchMessages({
    limit: 50000,
  });
  console.log(
    `Found ${chatMessages.length} messages in ${chat.name} (took ${
      performance.now() - startTime
    }ms)`
  );
  archivedChats[JSON.stringify(chat.id)] = chatMessages;
  fs.writeFileSync("archivedChats.json", JSON.stringify(archivedChats));
}

client.initialize();
