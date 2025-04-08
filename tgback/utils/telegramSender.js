import { Telegraf } from "telegraf";
import { config } from "dotenv";
config();

console.log(process.env.BOT);

const bot = new Telegraf(process.env.BOT);

export const sendTelegramNotification = async (
  id,
  status,
  message = "",
  order,
  phone
) => {
  try {
    console.log("Sending notification to:", status);
    const statusMessages = {
      accept:
        `✅ *Order Accepted!* ✅\n\n` +
        `Your ${order.productId?.name || "order"} has been confirmed.\n\n` +
        `💳 *Payment Instructions:*\n` +
        `Please contact us at ${
          phone || "our support number"
        } to complete payment.\n\n` +
        `We'll prepare your order once payment is confirmed.`,

      reject:
        `❌ *Order Rejected* ❌\n\n` +
        `We couldn't process your ${order.productId?.name || "order"}.\n\n` +
        `Please contact ${
          phone || "our support"
        } if you believe this is a mistake.`,

      shipped:
        `🚚 *Order Shipped!* 🚚\n\n` +
        `Your ${order.productId?.name || "order"} is on the way!\n\n` +
        `Contact ${phone || "us"} for any delivery questions.`,
    };

    let text =
      `${statusMessages[status]}\n` +
      `${message ? `Message: ${message}` : ""}\n`;

    await bot.telegram.sendMessage(id, text);
    return true;
  } catch (error) {
    console.error("Telegram notification failed:", error.message);
    return false;
  }
};

// export default sendTelegramNotification;
