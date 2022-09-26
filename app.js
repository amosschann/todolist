//jshint esversion:6

//require all the packages to use them
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
const mongoKey = process.env.MONGOOSE_KEY;

//setting view engine
app.set('view engine', 'ejs');
//using express and bodyParser
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
//connecting to database server (mongodb)
mongoose.connect(mongoKey, {useNewUrlParser: true});

//test on local db
// mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true});


// Ignore favicon.ico requests.
app.use( function(req, res, next) { 

  if (req.originalUrl && req.originalUrl.split("/").pop() === 'favicon.ico') {

     return res.sendStatus(204);

  }

  return next();

});

//Schema for Items
const itemsSchema = {
  name: String
};
//model for schema
const Item = mongoose.model("Item",itemsSchema);

//creating new items
const item1 = new Item({
  name: "Hit the + button to add a new item"
});

const item2 = new Item({
  name: "<-- Hit this to delete an item"
});


//items array
const defaultItems = [item1,item2];

//Schema other routes to include itemSchema as well
const listSchema ={
  name: String,
  items: [itemsSchema]
};
//model for schema
const List = mongoose.model("List",listSchema);


//when user goes to default route "/"
app.get("/", function(req, res) {
  //looking through Item db
  Item.find({},function(err,foundItems){
    //if item db is empty, insert item 1 and 2 (defualtItems)
    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if (err){
          console.log(err);
        }else{
          console.log("successfully saved default items to DB.");
        }
      });
      //redirect to refresh page after saving defaultItems to db
      res.redirect("/");
    }else{
      //render list.ejs with listTitle and newListItems(to connect to ejs side %%)
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

//process user post request to "/"
app.post("/", function(req, res){
  // itemName = text user input  listName = button value = listtitle(header)
  const itemName = req.body.newItem;
  const listName = req.body.list

  //create new item from the itemName (the text user input)
  const item = new Item({
    name: itemName
  });

  // if listTitle is "Today" = main page
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    //if the listTitle is another name = not main page (/custom page name), scan through List to find header name (should have been created through app.get(/custom list name))
    List.findOne({name: listName},function(err,foundList){
      //push new item into the list (with he listSchema model)
      foundList.items.push(item);
      foundList.save();
      //redirect back to custom dir
      res.redirect("/" + listName);
    });
  }

});


//process user post request to "/delete"
app.post("/delete",function(req,res){
  //checkbox item id in db (checkbox input) listname from (hidden input: value of it = listname)
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  //if its on the home page
  if(listName === "Today"){
    //remove by id and redirect back to home page
    Item.findByIdAndRemove(checkedItemID,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("successfully deleted item");
        res.redirect("/");
      }
    })
  }else{
    //if its not on the home page, find the listname and delete the value that coorospond to the item id in the listname array
    List.findOneAndUpdate({name: listName},{$pull:{items: {_id: checkedItemID}}},function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});


//custom dir
app.get("/:customListName",function(req,res){
  //custom list name string and caps first alphabet using lodash
  const customListName = _.capitalize(req.params.customListName)
  //check if customlistname is alr in db
  List.findOne({name: customListName},function(err,foundList){
    if(err){
      console.log(err);
    }else{
      //create new list if not found in dd, save and redirect back to custom dir
      if(!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      }else{
        //show an existing list
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//about page
app.get("/about", function(req, res){
  res.render("about");
});

// // for heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}



// //server starts on port and listens for browser
app.listen(port, function() {
  console.log("Server started successfully on port 3000");
});


//test on local db
// app.listen(3000, function() {                                                   //start server on port 3000
//   console.log("Server started on port 3000");
// });


