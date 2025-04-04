import { Telegraf, Markup } from "telegraf";
import connectDB from "./db.js";
import { config } from "dotenv";
import User from "./model/userModel.js";
import Category from "./model/categoryModel.js";
import Product from "./model/productModel.js";
import Order from "./model/orderModel.js";

config();

const bot = new Telegraf(process.env.BOT);
connectDB();
const userState = {}; // To store categoryId and messageId

bot.start(async (ctx) => {
  const { id, first_name } = ctx.from;
  await User.findOneAndUpdate(
    { userId: id },
    { firstName: first_name },
    { upsert: true }
  );
  await showCategories(ctx);
});

async function showCategories(ctx, edit = false, messageId = null) {
  const categories = await Category.find();
  const buttons = categories.map((c) =>
    Markup.button.callback(c.name, `category_${c._id}`)
  );

  const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });

  if (edit && messageId) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      "Choose a category:",
      keyboard
    );
  } else {
    const { message_id } = await ctx.reply("Choose a category:", keyboard);
    userState[ctx.from.id] = {
      ...userState[ctx.from.id],
      messageId: message_id,
    };
  }
}

async function showProducts(ctx, categoryId, edit = false, messageId = null) {
  const products = await Product.find({ category: categoryId });
  const productButtons = products.map((p) =>
    Markup.button.callback(`${p.name} ($${p.price})`, `product_${p._id}`)
  );

  const keyboard = [
    productButtons,
    [Markup.button.callback("⬅️ Back", "back_to_categories")],
  ];

  if (edit && messageId) {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      messageId,
      null,
      "Products:",
      Markup.inlineKeyboard(keyboard)
    );
  } else {
    const { message_id } = await ctx.reply(
      "Products:",
      Markup.inlineKeyboard(keyboard)
    );
    userState[ctx.from.id] = { categoryId, messageId: message_id };
  }
}

bot.action(/category_(\w+)/, async (ctx) => {
  const categoryId = ctx.match[1];
  const userId = ctx.from.id;
  const messageId = userState[userId]?.messageId;
  await showProducts(ctx, categoryId, !!messageId, messageId);
});

bot.action("back_to_categories", async (ctx) => {
  const userId = ctx.from.id;
  const messageId = userState[userId]?.messageId;
  delete userState[userId];
  await showCategories(ctx, !!messageId, messageId);
});

bot.action("back_to_start", async (ctx) => {
  delete userState[ctx.from.id];
  await ctx.deleteMessage();
  await ctx.reply("Main menu:", Markup.keyboard(["/start"]).resize());
});

bot.action(/product_(\w+)/, async (ctx) => {
  const productId = ctx.match[1];
  const product = await Product.findById(productId);

  if (!product) {
    await ctx.reply("Product not found!");
    return;
  }

  const image = product.imageUrl || "https://via.placeholder.com/150";
  const caption = `You selected: ${product.name}\nPrice: $${product.price}\n\nPurchase or go back?`;

  await ctx.replyWithPhoto(image, {
    caption: caption,
    reply_markup: Markup.inlineKeyboard([
      Markup.button.callback("💳 Purchase", `purchase_${productId}`),
    //   Markup.button.callback("⬅️ Back to Products", "back_to_products"),
    //   Markup.button.callback("⬅️ Back to Categories", "back_to_categories"),
    ]).reply_markup,
  });
});

bot.action("back_to_products", async (ctx) => {
  const userId = ctx.from.id;
  const { categoryId, messageId } = userState[userId] || {};

  if (!categoryId) {
    await ctx.reply("Category not found. Please start over with /start.");
    return;
  }

  // Send a new message instead of editing the photo
  await showProducts(ctx, categoryId, false);
});

bot.action(/purchase_(\w+)/, async (ctx) => {
  const productId = ctx.match[1];
  const product = await Product.findById(productId);

  if (!product) {
    await ctx.reply("Product not found!");
    return;
  }

  const order = new Order({
    userId: ctx.from.id,
    productId: product._id,
    productName: product.name,
    price: product.price,
  });

  await order.save();

  await ctx.reply(
    `Thank you for your purchase!\nProduct: ${product.name}\nPrice: $${product.price}\nYour order has been recorded.`
  );
});

bot.launch();
