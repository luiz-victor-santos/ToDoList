const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.set('view engine', 'ejs');
//using template embedded javaScript template ejs
app.use(bodyParser.urlencoded({extended: true})); // don't forget to make it use body parser

app.use(express.static("public")); // for css,images JavaScript files etc

mongoose.set('useFindAndModify', false);
//mongoose.connect(uri, { useFindAndModify: false });

//Conecting mongoose/ Schema/ Mongoose Model(Collection):

mongoose.connect("mongodb+srv://lv-admin:lvadmin@cluster0.jkcvq.mongodb.net/todolistDB", {useUnifiedTopology: true, useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


//----------------New database (Mongoose Document)------------------------
const item1 = new Item ({
  name: "Welcome to your todolist!"
});
const item2 = new Item ({
  name: "Hit the + button to add new item!"
});
const item3 = new Item ({
  name: "<-- Hit the checkbox to delete an item!"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//----------------------------HOME ROUTE--------------------------------
app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){
    // check if there is any items in the Collection
    if(foundItems.length===0){
      // if there are none it creates the 3 items previously set above
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved defautl items to DB.");
        }
      });
      //and finally reidrects to the route route
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });

});

//---------------DINAMIC ROUTE----------------------
//Whatever we type here will be the name of the new list
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

List.findOne({name:customListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      //If foundList doesn't exist it will cretate a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else{
      //Show an existing list. And the title will change according the list name
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});
});

//--------------POST ROUTE------------------------
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    // save the new item in the collection Items
  item.save();
  // redirect back over to the home Page with the new item on
  res.redirect("/");
  } else {
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName );
  })
  }

});

//-----------------DELETE ROUTE------------------------------

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName =  req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove (checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked items!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }



});

//---------------ABOUT and Work ROUTE----------------------------------
app.get("/about", function(req,res){
  res.render("about");
});


//-----------Port------------------------------------------------------
//heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully!");
});
