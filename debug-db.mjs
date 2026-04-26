import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb+srv://ali:uI4FdmUrp4zINIhn@cluster0.hivp2eu.mongodb.net/proteinbar?retryWrites=true&w=majority');

  const orderSchema = new mongoose.Schema({}, { strict: false });
  const CustomerOrder = mongoose.model('CustomerOrder', orderSchema, 'customerorders');
  const Order = mongoose.model('Order', orderSchema, 'orders');

  const orderId = "ORD-1777199945732-7N77UN";

  console.log("Checking Order collection...");
  const order = await Order.findOne({ orderId }).lean();
  console.log("Order found:", !!order);

  console.log("Checking CustomerOrder collection...");
  const customerOrder = await CustomerOrder.findOne({ orderId }).lean();
  console.log("CustomerOrder found:", !!customerOrder);

  if (customerOrder) {
    console.log("CustomerOrder fields:", Object.keys(customerOrder));
    console.log("Customer:", customerOrder.customer);
    console.log("Totals:", customerOrder.totals);
  }

  mongoose.disconnect();
}

main().catch(console.error);
