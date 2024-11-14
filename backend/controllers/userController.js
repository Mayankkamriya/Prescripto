import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'

//API to register user 
const registerUser = async (req,res) =>{

    try {
        const {name,email,password}= req.body

    if ( !name || !password || !email ) {
        return res.json({success:false, message:"Missing Details"})
    }

    if ( !validator.isEmail(email) ) {
        return res.json({success:false, message:"enter a valid email"})
    }

    if ( password.length <8 ) {
        return res.json({success:false, message:"enter a strong password of atleast 8 character"})
    }
    // hashing user password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    const userData ={
        name, email, password : hashedPassword
    }

    const newUser = new userModel(userData)
    const user = await newUser.save()

    const token = jwt.sign({id:user._id}, process.env.JWT_SECRET )
    res.json({success:true , token})

    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message}) 
    }
}

// API for user login
const loginUser = async (req,res) =>{

    try {
       const {email,password} = req.body
       const user = await userModel.findOne({email})

       if (!user) {
        return res.json({success:false, message:'User does not exist'})
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)
        res.json({success:true, token })
    } else  {
        res.json({success:false, message:"Invalid credentials" })
    }

    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message}) 
    }
}

// API to get user profile data
const getProfile = async (req,res)=>{

    try {
        const { userId}= req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({success:true, userData})
    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message})
    }
}

// API to update user profile
 const updateProfile = async (req,res)=>{
    try {
        const {userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file
        
        if (!name || !phone || !dob || !gender ) {
            res.json({success:false , message:"Data Missing"})
        }
        await userModel.findByIdAndUpdate(userId, {name, phone, address:JSON.parse(address), dob, gender})
  if (imageFile) {

      const imageUploader = await cloudinary.uploader.upload(imageFile.path, {resource_type:'image'})
      const imageURL = imageUploader.secure_url

      await userModel.findByIdAndUpdate(userId,{image:imageURL})
    }
    res.json({success:true , message:"Profile Updated"})

    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message})
    }
 }

 // API to book Appointment
const bookAppointment = async (req,res)=> {

try {
    const {userId, docId, slotDate, slotTime } = req.body

    const docData = await doctorModel.findById(docId).select('-password')

    if (!docData.available) {
        return res.json({success:false, message: 'Doctor not available'})
    }
    let slots_booked = docData.slots_booked

    // checking for slot availablity
    if (slots_booked[slotDate] ){
        if(slots_booked[slotDate].includes(slotTime)){
           return res.json({success: false, message:'Slot not available' }) 
        } else {
            slots_booked[slotDate].push(slotTime)
        }
    } else {
        slots_booked[slotDate] =[]
        slots_booked[slotDate].push(slotTime)
    }

    const userData = await userModel.findById(userId).select('-password')

      // Check if user exists
    if (!userData) {
        return res.json({ success: false, message: 'User not found' });
    }

    // we do not want the history of slots_booked
    delete docData.slots_booked

    const appointmentData= {
        userId,
        docId,
        userData,
        docData,
        amount: docData.fees,
        slotTime,
        slotDate,
        date: Date.now()
    }

    // For create and save new appointmentData in appointmentModel
    const newAppoinment = new appointmentModel(appointmentData)
    await newAppoinment.save()

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})
    res.json({success:true, message:'Appointment Booked'})

} catch (error) {
    console.log(error)
    res.json({success:false , message:error.message})
}

}

//API to get user appointments for frontend my-appointments page
const listAppointment = async (req,res) =>{
    try {
        const {userId} = req.body
        const appointments = await appointmentModel.find({userId})

        res.json({success:true, appointments})

    } catch (error) {
        console.log(error)
        res.json({success:false , message:error.message})
    }
}


 
export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment}
