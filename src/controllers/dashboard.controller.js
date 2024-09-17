import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    
    const userId = req?.user._id;

    const { channelId } = req.params;

    console.log("channelId: ",channelId)

    if(!userId){
        throw new ApiError(400, "Login and Try Again")
    }
    console.log("userId: ",userId)
    // total subscribers
    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
        //     // it is used to group the subscribers but as we are using 
        //     // _id:null it will group all subscribers to a single group
        //     // and as we mentioned subscribersCount, it will add a field called subscribersCount
        //     // and as we mentioned $sum: 1 it will add 1 for every record
            $group:{
                _id: null,
                subscribersCount:{
                    $sum: 1
                }
            }
        },
        // {
        //     $count: "subscriberCount"
        // }
    ])

    // Extract the count from the result
    const subscribersCount = totalSubscribers.length > 0 ? totalSubscribers[0].subscribersCount : 0;
    console.log(`Total subscribers: ${subscribersCount}`);

    console.log("totalSubscribers: ",totalSubscribers);
    console.log("totalSubscribers.subscriberCount: ",subscribersCount);
    // console.log("subscribersCount: ",totalSubscribers[0]?.subscribersCount);

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            } 
        },
        {
           $group:{
                _id: null,
                totalViews:{
                    $sum: "$views"
                },
                totalVideos:{
                    $sum: 1
                }
           }    
        },
        {
            $lookup:{
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likes"
            }
        },
        {
            $addFields:{
                totalLikes:{
                    $size: "$likes"
                }
            }
        },
        // {
        //     $count: "videosCount"
        // },
        {
            $project:{
                totalViews: 1,
                totalLikes: 1,
                totalVideos: 1
            }
        }
    ])

    console.log("videoStats: ",videoStats)
    console.log("videoStats[0]: ",videoStats[0])

    // const channelInfo = await User.findById(req?.user._id);
    const channelInfo = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $project:{
                "_id": 0,
                "username": 1,
                "avatar": 1,
                "coverImage": 1
            }
        }
    ]);
    console.log("channelInfo: ",channelInfo)

    // if isLoggedInUserSubscribedOrNot = 0 this means that the logged-in user is viewing his own channel
    // if isLoggedInUserSubscribedOrNot = True this means that the logged-in user is subscribed
    // if isLoggedInUserSubscribedOrNot = False this means that the logged-in user is not subscribed
    let isLoggedInUserSubscribedOrNot = 0

    //  we are only going to check isLoggedInUserSubscribedOrNot, if the other a user checks a channel
    // other than his/her own channel
    if(userId != channelId){
        const isLoggedInUserSubscribed = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(userId),
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            }
        ])
        console.log("isLoggedInUserSubscribed: ",isLoggedInUserSubscribed)
        if (isLoggedInUserSubscribed.length > 0) {
            isLoggedInUserSubscribedOrNot = true;
        }else{
            isLoggedInUserSubscribedOrNot = false;
        }
    }

    console.log("isLoggedInUserSubscribedOrNot: ",isLoggedInUserSubscribedOrNot)

    const responseData = {
        "totalSubscribers": subscribersCount,
        "totalVideos": videoStats[0].totalVideos,
        "totalViews": videoStats[0].totalViews,
        "channelInfo": channelInfo,
        "isLoggedInUserSubscribed": isLoggedInUserSubscribedOrNot
    }

    console.log("responseData: ",responseData)

    return res.status(200).json(
        new ApiResponse(200, responseData,'Channel stats fetched Successfully')
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    console.log("in getChannelVideos")
    const userId = req.user?._id;

    const channelVideos = await Video.aggregate([
        // getting videos uploaded by loggedIn user
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        // getting likes for the video
        {
            $lookup:{
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likes",
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                createdAt:{
                    $dateToParts:{ 'date': "$createdAt"}
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project:{
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                likesCount: 1,
                isPublished: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                }
            }
        }


    ])

    return res.status(200).json(
        new ApiResponse(200, channelVideos, "channel Videos fetched Successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }