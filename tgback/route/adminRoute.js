import express from 'express'
import { addCategory, addProduct, getCategory, getOrderDetail, getOrders, processOrder, productDelete, productDetail, products, productUpdate } from '../controller/adminController.js'
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router()

router.get('/orders', getOrders)
router.get("/order/:id", getOrderDetail);
router.post("/order/process/:id", processOrder);
router.post("/products", upload.array('images', 10), addProduct);
router.get("/products/:categoryId", products);
router.post("/category", addCategory);
router.get("/categories", getCategory);
router.get("/product/:id", productDetail);
router.post("/product/update/:id", productUpdate);
router.delete("/product/:id", productDelete);

export default router