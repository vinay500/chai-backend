import { v2 } from "cloudinary"
import fs from "fs"

import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
  api_key: 'process.env.CLOUDINARY_API_KEY', 
  api_secret: 'process.env.CLOUDINARY_API_SECRET' 
});


const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if (!localFilePath) return null;
        const fileUploadResponse = await cloudinary.uploader.upload
        (localFilePath,{
            resource_type: "auto"
         },
        );
        console.log('File uploaded Successfully, Response: ', fileUploadResponse, ' file URL: ',fileUploadResponse.url);
        return fileUploadResponse;
    }catch(err){
        console.log('Error while uploading file to Cluoudinary, Error: ',err);
        // below code will remove the locally saved temporary file as the upload operation got failed 
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export { uploadOnCloudinary }