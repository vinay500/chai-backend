import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError("Channel ID is required")
    }

    const channelToBeSubscribed = await User.findById(channelId)

    if(!channelToBeSubscribed){
        throw new ApiError("Channel to be Subscribed is not Present")
    }

    const subscribed = await Subscription.create({
        subscriber: req?.user?._id,
        channel: channelToBeSubscribed
    })

    // TODO: if subscribed then unsubscribe 

    return res.status(200).json(
        new ApiResponse(200, subscribed, "Channel Subscribed Successfully")
    )


})

// controller to return subscriber list of a channel
// TODO: test this endpoint
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    console.log("in getUserChannelSubscribers")
    const {channelId} = req.params;
    console.log("channelId: ",channelId)

    if(!channelId){
        throw new ApiError(200, "Channel ID is required")
    }

    const channel = await User.findById(channelId);

    const channelSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channel)
            }
        },
    ])

    return res.status(200).json(
        new ApiResponse(200, channelSubscribers, "Subscribers Fetched Successfuly")
    )
})

// controller to return channel list to which user has subscribed
// TODO: test this endpoint
const getSubscribedChannels = asyncHandler(async (req, res) => {

    console.log("in getSubscribedChannels");
    console.log("req:",req);

    const { subscriberId } = req.params;

    console.log("subscriberId: ",subscriberId);
    
    if(!subscriberId){
        throw new ApiError(200, "Subscriber ID is required")
    }

    const subscriber = await User.findById(subscriberId);

    console.log("subscriber: ",subscriber);

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriber)
            }
        },
    ])

    console.log("subscribedChannels ",subscribedChannels);

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Channels Subscribed  Fetched Successfuly")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}