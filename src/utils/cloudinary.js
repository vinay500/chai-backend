import fs from "fs";
import {v2 as cloudinary} from 'cloudinary';
          
let config = cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
console.log("config: ",config)


const uploadOnCloudinary = async (localFilePath)=>{
    try{
        console.log('localFilePath: ',localFilePath);
        if (!localFilePath) return null;
        // const fileUploadResponse = await cloudinary.uploader.upload
        // (localFilePath,{
        //     resource_type: "auto"
        //  },
        // );
        const fileUploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log('fileUploadResponse: ',fileUploadResponse)
        console.log('File uploaded Successfully, Response: ', fileUploadResponse, ' file URL: ',fileUploadResponse.url);
        fs.unlinkSync(localFilePath);
        return fileUploadResponse;
    }catch(err){
        console.log('Error while uploading file to Cloudinary, Error: ',err);
        // below code will remove the locally saved temporary file as the upload operation got failed 
        // above line is commented just for debugging
        // fs.unlinkSync(localFilePath)
        return null;
    }
}

export { uploadOnCloudinary }