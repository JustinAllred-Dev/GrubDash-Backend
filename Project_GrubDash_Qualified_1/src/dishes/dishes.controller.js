const { type } = require("os");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

const list = (req, res, next) => {
  res.json({ data: dishes });
};

function priceCheck(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (typeof price !== "number" || price < 1) {
    return next({
      status: 400,
      message: `Dish must have a price that is an interger greater than 0`,
    });
  } else next();
}
function requiredFieldsCorrect(req, res, next) {
  const data = req.body.data || {};

  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({ status: 400, message: `Dish must include ${field}` });
    }
  }
  next();
}

const create = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

function dishExists(req, res, next) {
  const { dishId } = req.params;

  const matchingDish = dishes.find((dish) => dish.id === dishId);
  if (matchingDish) {
    res.locals.dish = matchingDish;
    next();
  }
  return next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

const read = (req, res, next) => {
  res.status(200).json({ data: res.locals.dish });
};

function idExists(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (dishId !== id) {
      return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
  }
  next();
}

const update = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    ...res.locals.dish,
    name,
    description,
    price,
    image_url,
  };
  res.json({ status: 200, data: newDish });
};
module.exports = {
  list,
  create: [requiredFieldsCorrect, priceCheck, create],
  read: [dishExists, read],
  update: [dishExists, idExists, requiredFieldsCorrect, priceCheck, update],
};
