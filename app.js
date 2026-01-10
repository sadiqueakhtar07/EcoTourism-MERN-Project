const express = require('express');
const app = express();
const PORT=3000;
const mongoose= require('mongoose');
const Listing=require('./models/listing.js');
const path= require('path');
const methodOverride= require('method-override');
const ejsMate=require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const {listingSchema} = require("./schema.js");

const DB_URL = "mongodb://127.0.0.1:27017/ecotourism";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

main().then(() => {
    console.log("connected to database");
})
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(DB_URL);
}

app.get('/', (req, res) => {
    res.send('Server is running....');
});


const validateListing = ((req,res,next)=>{
    let {error}=listingSchema.validate(req.body);

    if(error){
        let errMsg= error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
});


//index route
app.get('/listings', wrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/index.ejs", { listings });
})
);

//new route
app.get('/listings/new', (req, res) => {
    res.render("listings/new.ejs");
});


//show route
app.get('/listings/:id', wrapAsync(async (req, res) => {
    let { id } = req.params;
    const singleList = await Listing.findById(id);
    // console.log(singleList);
    res.render("listings/show.ejs", { singleList });
})
);

//create route
app.post('/listings', validateListing, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    // console.log(newListing);
    await newListing.save();
    res.redirect('/listings');
    })
);


//edit route
app.get('/listings/:id/edit', wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
})
);

//update route
app.put('/listings/:id', validateListing, wrapAsync(async (req, res) => {
    // if(!req.body.listing){
    //     throw new ExpressError(400, "Send Valid Data for Listing");
    // }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

app.delete('/listings/:id', wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let deletedList= await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
}));

app.get('/',(req,res)=>{
    res.send('Server is running....');
});

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

//Middleware
app.use((err, req, res, next) => {
    let {statusCode=500, message="Something went wrong"}=err;
    res.status(statusCode).render("error.ejs", {message});
    // res.status(statusCode).send(message);
});

app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}`);
});