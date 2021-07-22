const type = require("os");
const path = require("path");
const { isArray } = require("util");

// Use the existing order data
let orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const thisOrder = orders.find((order) => order.id == orderId);
  if (!thisOrder) {
    return next({ status: 404, message: `${orderId} not found.` });
  }
  res.locals.order = thisOrder;
  next();
}

function requiredOrderFields(req, res, next) {
  const data = req.body.data || {};
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({ status: 400, message: `Order must include a ${field}` });
    }
  }
  if (!isArray(dishes) || data.dishes.length < 1) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
  dishes.map((dish, index) => {
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });

  res.locals.newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  next();
}

function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  orders.push(res.locals.newOrder);
  res.status(201).json({ data: res.locals.newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes, id } = {} } =
    req.body;
  const order = res.locals.order;
  const { orderId } = req.params;
  if (id) {
    if (orderId !== id) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      });
    }
  }
  if (!status || status.length == 0 || status === "invalid") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  const updatedOrder = {
    ...order,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  order = res.locals.order;

  if (order.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  const deletedOrder = orders.find((thisOrder) => thisOrder.id === order.id);
  orders.splice(orders[deletedOrder] - 1, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [requiredOrderFields, create],
  read: [orderExists, read],
  update: [orderExists, requiredOrderFields, update],
  delete: [orderExists, destroy],
};
