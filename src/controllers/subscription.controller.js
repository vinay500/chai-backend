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

    return res.status(200).json(
        new ApiResponse(200, subscribed, "Channel Subscribed Successfully")
    )


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}