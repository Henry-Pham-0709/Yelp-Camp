if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate");
const session = require("express-session")
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user")
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet");

const MongoStore = require("connect-mongo");


const campgroundRoute = require("./routes/campground")
const reviewRoute = require("./routes/review")
const userRoute = require("./routes/user")


const ExpressError = require("./utils/ExpressError")

// process.env.DB_URL  
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(console.log("CONNECTION OPEN"))
    .catch(err => console.log(err));


app.engine("ejs", ejsMate)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize({replaceWith:"_"}))

const secret = process.env.SECRET || "secret";

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24*3600,
    crypto: {
        secret
    }
})

store.on("error", function(e) {
    console.log(e)
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash())
app.use(helmet())

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://stackpath.bootstrapcdn.com",
    "https://api.mapbox.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
];
const fontSrcUrls = []; 
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
                "https://images.unsplash.com",
                "https://source.unsplash.com/random",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

app.get("/", (req, res) => {
    res.render("home")
})

app.use("/campgrounds", campgroundRoute);

app.use("/campgrounds/:id/reviews", reviewRoute);

app.use("/", userRoute);

app.all("*", (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})


app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oops, something went wrong"
    res.status(statusCode).render("error", { err })
})
//Express has a default error handler (the one that show you the error information on the web when some errors occur) (Doesn't work with async callback). Making another handler will let the program to execute THAT handler first. If you call next(__argument), the next error handler will be execute (in the case that you don't have a next handler, default handler will be triggered)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}`)
})