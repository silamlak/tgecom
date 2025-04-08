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
       `✅ *Order Confirmed - Cash on Delivery* ✅\n\n` +
       `Your ${order.productId?.name || "order"} is ready!\n\n` +
       `💰 *Payment Method:*\n` +
       `Pay when you receive the item.\n\n` +
       `📦 Expected delivery in 1-3 business days.\n\n` +
       `Need help? Contact ${phone || "our support"}`,

     reject:
       `❌ *Order Rejected* ❌\n\n` +
       `We couldn't process your ${order.productId?.name || "order"}.\n\n` +
       `Please contact ${
         phone || "our support"
       } if you believe this is a mistake.`,

     paid:
       `💳 *Payment Received!* 💳\n\n` +
       `Thank you for paying for your ${
         order.productId?.name || "order"
       }!\n\n` +
       `We're now preparing your order for shipment.\n\n` +
       `You'll receive another notification when it ships.\n\n` +
       `Contact ${phone || "us"} for any questions.`,

     shipped:
       `🚚 *Order Shipped!* 🚚\n\n` +
       `Your ${order.productId?.name || "order"} is on the way!\n\n` +
       `📦 *Tracking Info:* Will be shared soon\n\n` +
       `Contact ${phone || "us"} for any delivery questions.`,

     completed:
       `🎉 *Order Delivered!* 🎉\n\n` +
       `Your ${
         order.productId?.name || "order"
       } has been successfully delivered!\n\n` +
       `We hope you're happy with your purchase.\n\n` +
       `💬 *Review Request:* Please share your feedback with us at ${
         phone || "our support"
       }\n\n` +
       `Thank you for shopping with us!`,
   };

    let text =
      `${statusMessages[status]}\n` +
      `${message ? `Message: ${message}` : ""}\n`;
console.log(id)
    await bot.telegram.sendMessage(id, text);
    return true;
  } catch (error) {
    console.error("Telegram notification failed:", error.message);
    return false;
  }
};

// export default sendTelegramNotification;
