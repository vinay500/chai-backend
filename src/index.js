// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({path:'./env'})






// import express from "express";

// const app = express()

// ( async()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("errro", (error)=>{
//             console.log("error: ",error);
//             throw error;
//        })
//        app.listen(process.env.PORT, ()=>{
//             console.log(`App is listenting on Port ${process.env.PORT}`)
//        })
//     }catch(error){
//         console.error("Error: ",error)
//         throw err
//     }
// })()



connectDB()
.then(()=>{
    const app_listening = app.listen(process.env.PORT||8000,()=>{
        console.log(`App is listenting on Port ${process.env.PORT}`)
    })
    app_listening.on('error',(err)=>{
        consolee.log(`App failed to listen, Error: ${err}`);
        process.exit(1);
    })
})
.catch((err)=>{
    console.log(`MongoDb Connection Failed !!! Error:${err}`)
})