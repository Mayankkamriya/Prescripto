import {v2 as cloudinary} from 'cloudinary'

// const connectCoudinary = async() =>{
    cloudinary.config({
        cloud_name : process.env.CLOUDINARY_NAME,
        api_secret : process.env.CLOUDINARY_SECRET_KEY,
        api_key : process.env.CLOUDINARY_API_KEY
    })

// }
// export default connectCoudinary
export default cloudinary