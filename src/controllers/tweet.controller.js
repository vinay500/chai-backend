import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Content is Required");
    }

    const owner = req.user;

    if(!owner){
        throw new ApiError(400, "Login and Try Again");
    }

    const tweet = await Tweet.create({
        content,owner
    })
    console.log("tweet created: ", tweet);


    if(!tweet){
        throw new ApiError(400, "Failed to Create Tweet,, Try Again");
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // console.log("req.user: ",req.user)
    // const user = User.findById(req.user);
    console.log("user: ",req.user._id)

    const userTweets = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])

    if(!userTweets){
        throw new ApiError(400, "Something Went Wrong, Try Again");
    }
    // console.log("userTweets: ",userTweets)
    return res.status(200).json(
        new ApiResponse(200, userTweets, "User Tweets Fetched Successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;

    console.log("tweetID: ",tweetId);

    const { content } = req.body;
    
    console.log("content: ",content);

    if(!tweetId){
        throw new ApiError(400, "TweetID is required");
    }

    if(!content){
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    // console.log("tweet: ",tweet);

    if(!tweet){
        throw new ApiError(400, " Can't find Tweet, Invalid TweetID");
    }

    console.log("tweet.owner: ",tweet.owner);
    console.log("req?.user?._id: ",req?.user?._id);

    if(tweet.owner?.toString() != req?.user?._id.toString()){
        throw new ApiError(400, " Can't update tweet as you are not the Owner");
    }
    
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content: content
            }
        },
        // new: true will tell mongodb to return the 
        // modified document rather than the original document
        {new: true}
    )

    console.log("updatedTweet:",updatedTweet);

    if(!updateTweet){
        throw new ApiError(400, "Updating Tweet Failed, Try Again");
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"))


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    console.log("tweetID: ",tweetId);


    if(!tweetId){
        throw new ApiError(400, "TweetID is required");
    }


    const tweet = await Tweet.findById(tweetId);

    // console.log("tweet: ",tweet);

    if(!tweet){
        throw new ApiError(400, " Can't find Tweet, Invalid TweetID");
    }

    console.log("tweet.owner: ",tweet.owner);
    console.log("req?.user?._id: ",req?.user?._id);

    if(tweet.owner?.toString() != req?.user?._id.toString()){
        throw new ApiError(400, " Can't update tweet as you are not the Owner");
    }
    
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    console.log("deletedTweet:",deletedTweet);

    if(!deletedTweet){
        throw new ApiError(400, "Deleting Tweet Failed, Try Again");
    }

    return res.status(200).json(new ApiResponse(200, deletedTweet, "Tweet Deleted Successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}