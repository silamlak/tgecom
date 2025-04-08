import express from 'express'
import { addCategory, addProduct, getOrderDetail, getOrders, processOrder } from '../controller/adminController.js'
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router()

router.get('/orders', getOrders)
router.get("/order/:id", getOrderDetail);
router.post("/order/process/:id", processOrder);
router.post("/products", upload.array('images', 10), addProduct);
router.post("/category", addCategory);

export default router