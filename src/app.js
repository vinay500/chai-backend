// import dotenv from 'dotenv'
// import connectDB from './db'


// dotenv.config({path:'./env'})
// connectDB()
// .then(()=>{
//     const appConnection = app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on PORT ${process.env.PORT}`)
//     })
//     appConnection.on('error',()=>{
//         console.log('App listening Failed')
//     })
// })
// .catch((err)=>{
//     console.log('Database Connection Failed, Error: ',Error)
// })

import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'


const app = express()

// let corsOptions = {
//     origin: "http://localhost:3000"
//   };

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    corsOptions: process.env.CORS_OPTIONS,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public")) 
app.use(cookieParser())


// routes import
import userRouter from "./routes/user.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"


// routes declaration
// the url http://127.0.0.1:8000/api/v1/users is handled by below router
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)



export { app }


