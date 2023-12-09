//jshint esversion:6

const _ = require("lodash"); //It provides various functions which adjust the url accordingly, in lower or upper case as needed

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

try {
  mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
  console.log("Connection Successful");
} catch (error) {
  console.log(error);
}

//Schema for OG to-do-list ITEM SCHEMA
const itemsSchema = new mongoose.Schema({
  name: String,
});

//Model for the same ITEM MODEL
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "To add an item click + icon, and to remove an item click the checkbox",
});

//Schema for custom to-do-list
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

//Model for the same
const List = mongoose.model("List", listSchema);

//Presenting the default items on the web-page
const now = new Date();
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const day = days[now.getDay()];
app.get("/", function (req, res) {
  Item.find({})
    .then(function (result) {
      //.find() will return the array of objects

      if (result.length === 0) {
        Item.insertMany(item1)
          .then(function () {
            console.log("Successfully saved defult items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: result });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

//Routing parameters from express
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundistName) {
      // .findOne will return an object

      if (!foundistName) {
        //Creating the list as it does not exists
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Presenting thr list if exists
        res.render("List", {
          listTitle: foundistName.name,
          newListItems: foundistName.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  //Adding items to the OG to-do-list
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  //Adding items to the custom to-do-list
  else {
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Deleting items form the OG to-do-list
//Changes in the <form> present in list.ejs are also been made
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName; //uuuu

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function () {
      console.log("Successfully deleted checked item");
      res.redirect("/");
    });
  } else {
    //uuuu
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(function () {
      res.redirect("/" + listName);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
