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

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public")) 
app.use(cookieParser())


// routes import
import userRouter from "./routes/user.routes.js"


// routes declaration
// the url http://127.0.0.1:8000/api/v1/users is handled by below router
app.use("/api/v1/users", userRouter)



export { app }


