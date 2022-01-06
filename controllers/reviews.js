const Campground = require("../models/campground")
const Review = require("../models/review")

module.exports.createReview = async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    camp.reviews.push(review);
    await review.save();
    await camp.save();
    req.flash("success", "Successfully create a new review")
    res.redirect(`/campgrounds/${camp._id}`)
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const camp = await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    const review = await Review.findByIdAndDelete(req.params.reviewId);
    req.flash("success", "Successfully delete a review")
    res.redirect(`/campgrounds/${id}`)
}