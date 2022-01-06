const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities")
const { places, descriptors } = require("./seedHelpers")

async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
}

main()
    .then(console.log("CONNECTION OPEN"))
    .catch(err => console.log(err));

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000)
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: "61d4a618433d8421bd979eae",
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            images: [{
                url: "https://source.unsplash.com/random",
                filename: "random seeding"
            },
            {
                url: "https://source.unsplash.com/random",
                filename: "random seeding 2"
            }],
            description: "bait text",
            price: price,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            }
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})

