import { Telegraf, Markup } from "telegraf";
import User from "./model/userModel.js";
import Category from "./model/categoryModel.js";
import Product from "./model/productModel.js";
import Order from "./model/orderModel.js";
import connectDB from "./db.js";
import { config } from "dotenv";
import mongoose from "mongoose";

config();

const bot = new Telegraf(process.env.BOT);

connectDB();

const userStates = {};

const showMainMenu = (ctx, message = "Welcome Back") => {
  return ctx.reply(
    message,
    Markup.keyboard([["Shop", "Order"]])
      .resize()
      .oneTime()
  );
};

const showMainMenuNoMessage = (ctx) => {
  return ctx.reply(
    Markup.keyboard([["Shop", "Order"]])
      .resize()
      .oneTime()
  );
};

const removeKeyboard = (ctx, message) => {
  return ctx.reply(message, Markup.removeKeyboard());
};

// Command: /start -> Show main menu
bot.start(async (ctx) => {
  const { id, first_name } = ctx.from;
  const alreadyRegistered = await User.findOne({ userId: id });
  if (!alreadyRegistered) {
    const user = new User({ userId: id, firstName: first_name });
    await user.save();
  }
  showMainMenu(ctx, "Welcome to our store!");
});

// Handle category selection
bot.hears(["Shop"], async (ctx) => {
  const categories = await Category.find();

  if (!categories || categories.length === 0) {
    return ctx.reply("No categories found.");
  }

  const buttons = categories.map((category) =>
    Markup.button.callback(category.name, `category_${category._id}`)
  );

  ctx.reply(
    `Choose a category`,
    Markup.inlineKeyboard(buttons, { columns: 2 })
  );
});

let productListMessageId;

function removeMarkdownChars(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "");
}

bot.action(/^category_(.+)/, async (ctx) => {
  try {
    await ctx.deleteMessage();

    const categoryId = ctx.match[1];
    const category = await Category.findById(categoryId);

    if (!category) {
      await ctx.reply("Category not found", Markup.removeKeyboard());
      return ctx.answerCbQuery();
    }

    const products = await Product.find({ category: categoryId });

    if (!products.length) {
      await ctx.reply("No products in this category", Markup.removeKeyboard());
      return ctx.answerCbQuery();
    }

    // Store the message ID when sending product list header
    const { message_id } = await ctx.reply(
      `📦 Products in ${category.name}`,
      Markup.removeKeyboard()
    );
    productListMessageId = message_id;

    // Create product buttons with Back button
    const productButtons = products.reduce((rows, product, index) => {
      if (index % 2 === 0) rows.push([]);
      rows[rows.length - 1].push(
        Markup.button.callback(product.name, `prod_${product._id}`)
      );
      return rows;
    }, []);

    productButtons.push([
      Markup.button.callback("« Back to Categories", "back_to_categories"),
    ]);

    await ctx.reply(
      "Choose a product:",
      Markup.inlineKeyboard(productButtons, { columns: 2 })
    );

    await ctx.answerCbQuery();
  } catch (err) {
    console.error("Error:", err);
    await ctx.answerCbQuery("Error loading products");
    await showMainMenuNoMessage(ctx);
  }
});

bot.action("back_to_categories", async (ctx) => {
  try {
    await ctx.deleteMessage();
    if (productListMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, productListMessageId);
    }

    const categories = await Category.find();

    if (!categories.length) {
      await ctx.reply("No categories available", Markup.removeKeyboard());
      return ctx.answerCbQuery();
    }
    await showMainMenu(ctx);
    const buttons = categories.map((category) =>
      Markup.button.callback(category.name, `category_${category._id}`)
    );

    await ctx.reply(
      "Categories",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );

    await ctx.answerCbQuery();
  } catch (err) {
    console.error("Error:", err);
    await ctx.answerCbQuery("Error going back");
    await showMainMenuNoMessage(ctx);
  }
});

const deleteMessages = async (ctx, messageIds) => {
  for (const id of messageIds) {
    await ctx.telegram.deleteMessage(ctx.chat.id, id).catch(console.error);
  }
};

console.log('object')

bot.action(/^prod_(.+)/, async (ctx) => {
  try {
    const productId = ctx.match[1];
    const product = await Product.findById(productId);
    await ctx.deleteMessage();

    const safeName = removeMarkdownChars(product.name);
    const safeDescription = removeMarkdownChars(product.description);
    const hasMultipleImages =
      Array.isArray(product.imageUrl) && product.imageUrl.length > 1;

    let detailMsg;

    if (hasMultipleImages) {
      const mediaGroup = product.imageUrl.map((url, index) => ({
        type: "photo",
        media: url,
        caption:
          index === 0
            ? `🛍️ ${safeName}\n💰 ${product.price} ETB\n${safeDescription}`
            : undefined,
        parse_mode: "Markdown",
      }));

      // Send media group (album)
      detailMsg = await ctx.replyWithMediaGroup(mediaGroup);

      // Since media group returns an array of messages, we take the first one as reference
      const firstMediaMessage = detailMsg[0];
    } else {
      // Fallback to single photo if only one image exists
      detailMsg = await ctx.replyWithPhoto(
        product.imageUrl[0] || product.imageUrl,
        {
          caption: `🛍️ ${safeName}\n💰 ${product.price} ETB\n${safeDescription}`,
          parse_mode: "Markdown",
        }
      );
    }

    const optionsMsg = await ctx.reply(
      "Select an option:",
      Markup.inlineKeyboard([
        [
          Markup.button.callback("🛒 Order Now", `add_${productId}`),
          Markup.button.callback(
            "🔙 Back to List",
            `back_to_products_${product.category}`
          ),
        ],
      ])
    );

    // Store all message references
    userStates[ctx.from.id] = {
      productId,
      action: "viewing_product",
      messageIds: [
        ...(hasMultipleImages
          ? detailMsg.map((m) => m.message_id)
          : [detailMsg.message_id]),
        optionsMsg.message_id,
      ],
    };

    await ctx.answerCbQuery();
  } catch (err) {
    console.error(err);
    await ctx.answerCbQuery("Error loading product");
  }
});

bot.action(/^back_to_products_(.+)/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const categoryId = ctx.match[1];
    const products = await Product.find({ category: categoryId });

    if (!products.length) {
      await ctx.reply("This category is empty now");
      return ctx.answerCbQuery();
    }

    // Create product list in 2 columns
    const productButtons = [];
    for (let i = 0; i < products.length; i += 2) {
      const row = [];
      if (products[i]) {
        row.push(
          Markup.button.callback(products[i].name, `prod_${products[i]._id}`)
        );
      }
      if (products[i + 1]) {
        row.push(
          Markup.button.callback(
            products[i + 1].name,
            `prod_${products[i + 1]._id}`
          )
        );
      }
      productButtons.push(row);
    }

    // Add back button in its own row
    productButtons.push([
      Markup.button.callback("« Back to Categories", "back_to_categories"),
    ]);

    await ctx.reply("Select a product:", Markup.inlineKeyboard(productButtons));

    await ctx.answerCbQuery();
  } catch (err) {
    console.error(err);
    await ctx.reply("⚠️ Error loading products");
    await ctx.answerCbQuery();
  }
});

bot.action(/^add_(.+)/, async (ctx) => {
  try {
    const productId = ctx.match[1];
    const orders = await Order.find({
      userId: ctx.from.id,
      status: "pending",
      productId,
    });
    if (orders.length > 0) {
      await ctx.reply(
        "You have an order pending for this product. Please complete it first."
      );
      return ctx.answerCbQuery();
    }
    await ctx.deleteMessage();
    userStates[ctx.from.id] = {
      productId,
      action: "awaiting_phone",
    };

    // Ask for phone number
    await ctx.reply(
      "📱 Please send your phone number:",
      Markup.keyboard([
        [Markup.button.contactRequest("Share Contact")],
        ["Cancel"],
      ])
        .resize()
        .oneTime()
    );

    await ctx.answerCbQuery();
  } catch (err) {
    console.error(err);
    await ctx.reply("⚠️ Error adding to cart");
    await ctx.answerCbQuery();
  }
});

bot.action(/^neworder_(.+)/, async (ctx) => {
  try {
    const productId = ctx.match[1];
    const orders = await Order.find({
      userId: ctx.from.id,
      status: "pending",
      productId,
    });
    if (orders.length > 0) {
      await ctx.reply(
        "You have an order pending for this product. Please complete it first."
      );
      return ctx.answerCbQuery();
    }
    // Initialize user state if it doesn't exist
    if (!userStates[ctx.from.id]) {
      userStates[ctx.from.id] = {};
    }

    // Update user state for order process
    userStates[ctx.from.id] = {
      ...userStates[ctx.from.id], // Preserve existing state if any
      productId,
      action: "awaiting_phone",
      createdAt: new Date(), // Add timestamp for state cleanup
    };

    // Ask for phone number
    await ctx.reply(
      "📱 Please send your phone number:",
      Markup.keyboard([
        [Markup.button.contactRequest("Share Contact")],
        ["Cancel"],
      ])
        .resize()
        .oneTime()
    );

    await ctx.answerCbQuery();
  } catch (err) {
    console.error(err);
    await ctx.reply("⚠️ Error adding to cart");
    await ctx.answerCbQuery();
  }
});

const deletePreviousMessages = async (ctx, messageIds = []) => {
  try {
    await ctx.deleteMessage(); // Delete the current message
    for (const messageId of messageIds) {
      await ctx.telegram.deleteMessage(ctx.chat.id, messageId).catch(() => {});
    }
  } catch (err) {
    console.error("Error deleting messages:", err);
  }
};

bot.hears(/^(\+251|0)(9|7)[0-9]{8}$/, async (ctx) => {
  if (userStates[ctx.from.id]?.action === "awaiting_phone") {
    try {
      const phone = ctx.match[0];
      const { productId, messageIds } = userStates[ctx.from.id]; // Store message IDs in state
      const product = await Product.findById(productId);

      if (!product) throw new Error("Product not found");

      // Create order
      const newOrder = new Order({
        userId: ctx.from.id,
        productId,
        phone,
      });

      await newOrder.save();

      // Clean up previous messages
      await deletePreviousMessages(ctx, messageIds);

      // Send clean success message
      await ctx.replyWithHTML(
        `✅ <b>Order Confirmed!</b>\n\n` +
          `🛍️ <b>Product:</b> ${product.name}\n` +
          `💰 <b>Price:</b> ${product.price} ETB\n` +
          `📱 <b>Phone:</b> ${phone}\n\n` +
          `We'll contact you shortly. Thank you!`,
        Markup.removeKeyboard()
      );

      delete userStates[ctx.from.id];
    } catch (err) {
      console.error(err);
      await ctx.reply(
        "⚠️ Error processing your order. Please try again.",
        Markup.removeKeyboard()
      );
    }
  }
});

bot.on("contact", async (ctx) => {
  if (userStates[ctx.from.id]?.action === "awaiting_phone") {
    try {
      const phone = ctx.message.contact.phone_number;
      const { productId, messageIds } = userStates[ctx.from.id];
      const product = await Product.findById(productId);

      if (!product) throw new Error("Product not found");

      // Create temporary order (pre-payment)
      const tempOrder = await new Order({
        userId: ctx.from.id,
        productId,
        phone,
        status: "pending",
      }).save();

      // Delete previous messages
      await deletePreviousMessages(ctx, messageIds);

      // Send clean success message
      await ctx.replyWithHTML(
        `✅ <b>Order Confirmed!</b>\n\n` +
          `🛍️ <b>Product:</b> ${product.name}\n` +
          `💰 <b>Price:</b> ${product.price} ETB\n` +
          `📱 <b>Phone:</b> ${phone}\n\n` +
          `We'll contact you shortly. Thank you!`,
        Markup.removeKeyboard()
      );

      delete userStates[ctx.from.id];
    } catch (err) {
      console.error(err);
      await ctx.reply(
        "⚠️ Error processing your order. Please try again.",
        Markup.removeKeyboard()
      );
      delete userStates[ctx.from.id];
    }
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  try {
    const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
    const order = await Order.findById(payload.orderId);

    if (!order || order.status !== "pending_payment") {
      return ctx.answerPreCheckoutQuery(false, "Order no longer available");
    }

    await ctx.answerPreCheckoutQuery(true);
  } catch (err) {
    console.error(err);
    await ctx.answerPreCheckoutQuery(false, "Payment error");
  }
});

bot.on("successful_payment", async (ctx) => {
  try {
    console.log("paid well");
  } catch (err) {
    console.error(err);
    await ctx.reply("⚠️ Error recording your payment. Contact support.");
  }
});

async function notifyAdmin(order) {
  await bot.telegram.sendMessage(
    process.env.ADMIN_CHAT_ID,
    `🛒 New Order #${order._id}\n\n` +
      `Product: ${order.productId.name}\n` +
      `User: ${order.userId}\n` +
      `Amount: ${order.paymentDetails.telegramPayment.total_amount / 100} ETB`
  );
}

bot.hears(["Cancel"], async (ctx) => {
  if (userStates[ctx.from.id]?.action === "awaiting_phone") {
    const { messageIds } = userStates[ctx.from.id];
    await deletePreviousMessages(ctx, messageIds);
    await ctx.reply(
      "❌ Order canceled. You can shop again anytime!",
      Markup.removeKeyboard()
    );
    delete userStates[ctx.from.id];
  }
});

bot.launch();
