import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    
    const userId = req?.user._id
    console.log("userId: ",userId)
    // total subscribers
    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
        //     // it is used to group the subscribers but as we are using 
        //     // _id:null it will group all subscribers to a single group
        //     // and as we mentioend subscribersCount, it will add a field called subscribersCount
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
    const count = totalSubscribers.length > 0 ? totalSubscribers[0].subscriberCount : 0;
    console.log(`Total subscribers: ${count}`);

    console.log("totalSubscribers: ",totalSubscribers);
    console.log("totalSubscribers.subscriberCount: ",totalSubscribers[0].subscriberCount);
    // console.log("subscribersCount: ",totalSubscribers[0]?.subscribersCount);

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req?.user?._id)
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

    return res.status(200).json(
        new ApiResponse(200, totalSubscribers,'Channel stats fetched Successfully')
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