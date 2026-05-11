import express from "express";
import { z } from "zod";
import { requireAdmin, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { getSettings } from "../services/settings.js";
import { sendPushToRole } from "../services/push.js";
import { asyncHandler, HttpError } from "../utils/http.js";

const router = express.Router();
const FREE_DELIVERY_THRESHOLD = 500;

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1)
    })
  ),
  address: z.string().min(8),
  notes: z.string().optional().default(""),
  paymentMethod: z.enum(["cash", "card"]),
  name: z.string().min(2),
  phone: z.string().min(5)
});

router.post(
  "/orders",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const body = orderSchema.parse(req.body);
    if (body.paymentMethod === "card") throw new HttpError(400, "Card payments are coming soon");
    const user = await User.findById(req.auth?.userId);
    if (!user) throw new HttpError(404, "User not found");

    const products = await Product.find({ _id: { $in: body.items.map((item) => item.productId) }, isActive: true });
    const itemMap = new Map(products.map((item) => [item.id, item]));
    const items = body.items.map((item) => {
      const product = itemMap.get(item.productId);
      if (!product) throw new HttpError(400, "Product unavailable");
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const settings = await getSettings();
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : settings.deliveryFee;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      customer: { id: user._id, name: body.name, phone: body.phone },
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: body.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      address: body.address,
      notes: body.notes
    });

    user.name = body.name;
    user.phone = body.phone;
    user.address = body.address;
    await user.save();

    await sendPushToRole("admin", {
      title: "New order",
      body: `${body.name} placed an order for ${total} THB`,
      url: "/admin/orders"
    });

    res.status(201).json({ order });
  })
);

router.get(
  "/orders/my",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const orders = await Order.find({ "customer.id": req.auth?.userId }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  })
);

router.get(
  "/admin/orders",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || "");
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const metrics = {
      todaysOrders: await Order.countDocuments({ createdAt: { $gte: today } }),
      estimatedSales: orders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: await Order.countDocuments({ status: { $in: ["pending", "accepted", "preparing"] } }),
      activeProducts: await Product.countDocuments({ isActive: true })
    };

    res.json({ orders, metrics });
  })
);

router.get(
  "/admin/orders/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw new HttpError(404, "Order not found");
    res.json({ order });
  })
);

router.patch(
  "/admin/orders/:id/status",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.enum(["pending", "accepted", "preparing", "out_for_delivery", "delivered", "cancelled"])
      })
      .parse(req.body);
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: { status: body.status } }, { new: true });
    if (!order) throw new HttpError(404, "Order not found");
    await sendPushToRole(
      "customer",
      {
        title: "Order status updated",
        body: `Your order is now ${body.status.replaceAll("_", " ")}`,
        url: "/profile/orders"
      },
      String(order.customer?.id)
    );
    res.json({ order });
  })
);

export const ordersRouter = router;
