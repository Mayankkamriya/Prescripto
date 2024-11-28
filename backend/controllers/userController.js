import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import  cloudinary from '../config/cloudinary.js'
import jwt from 'jsonwebtoken';
import axios from 'axios'
import crypto from 'crypto'

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000' ;

//API to register user 
const registerUser = async (req,res) =>{
// const secret ='greatstack'
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
    console.log('process.env.JWT_SECRET',process.env.JWT_SECRET)
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


let salt_key = process.env.PHONEPE_MERCHANT_KEY
let merchant_id = process.env.PHONEPE_MERCHANT_ID


// API to cancel appointment
const cancelAppointment = async (req, res)=>{
    
try {
      
    const {userId, appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

    // verify appointment user
    if (appointmentData.userId !== userId) {
        return res.json({success:false, message:'Unauthorized action'})
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})

    // releasing doctor slot
    const {docId, slotDate, slotTime} = appointmentData
    const doctorData = await doctorModel.findById(docId)

    let slots_booked = doctorData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    res.json({success:true, message:'Appointment Cancelled'})


} catch (error) {
  console.log(error)
  res.json({success:false , message:error.message})
}

}

const paymentPhonePe = async (req, res) => {
    try {
      const { appointmentId,transactionId, MUID } = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);
    //   console.log('appointmentData for proceeding payment', appointmentData);
  
      if (!appointmentData || appointmentData.cancelled) {
        return res.json({ success: false, message: "Appointment Cancelled or not found" });
      }

    const data = {
      merchantId: merchant_id,
      merchantTransactionId: transactionId,
      amount: appointmentData.amount*100,
      // redirectUrl: `http://localhost:5000/status?id=${transactionId}`,
      redirectUrl: `${backendUrl}/api/user/status?id=${transactionId}&appointmentId=${appointmentId}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      };

    const KeyIndex =1

    // Base64 encode the payload
    const payload = JSON.stringify(data)
    const payloadMain = Buffer.from(payload).toString("base64");

    // Generate X-VERIFY checksum
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    const checksum = sha256+ '###' + KeyIndex
 
  // const prod_URL = "http://api.phonepe.com/api/hermes/pg/v1/pay" // if you are live
  // const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
  const prod_URL = process.env.REACT_APP_API_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'
console.log('process.env.REACT_APP_API_URL.....', process.env.REACT_APP_API_URL)

  const option = {
    method: 'POST',
    url:prod_URL,
    headers: {
        accept : 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
    },
    data :{
        request : payloadMain
    }
  }

      // Call to PhonePe API to create an order
    axios
    .request(option)
    .then( async(response)=> {
      // console.log('response.data in paymentphonepe ......',response.data)

      res.json(response.data)
      await paymentstatus(req,res);   
    
    })
    .catch(function (error) {
      console.error(error.message);
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

  const paymentstatus= async (req, res) => {

    const merchantTransactionId = req.query.id;
    const merchantId = merchant_id
   const appointmentId  = req.query.appointmentId

const successUrl="http://localhost:5173/my-appointment"
const failureUrl="http://localhost:5173/contact"

  const keyIndex = 1
  const string  = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}` + process.env.PHONEPE_MERCHANT_KEY
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  const checksum = sha256 + '###' + keyIndex

  const prod_URL_status = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status"
  const option = {
      method: 'GET',
      url:`${prod_URL_status}/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      headers: {
          accept : 'application/json',
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID
      },
  }

  await axios(option).then(async (response) => {

    if (response.data.success){
         
  await verifyPhonePePayment (response.data,appointmentId)
      // res.json({message: "payment successfull", data: response.data}) //black page crome
         res.redirect("http://localhost:5173/my-appointment")

    }else{
        return res.redirect("http://localhost:5173/contact")
    }
  })
  .catch((error) => {
    console.error("Error fetching payment status:", error.message);
    res.redirect("http://localhost:5173/contact"); // Failure URL
  });
};


const verifyPhonePePayment = async (responseData, appointmentId) => {
    try {
      
      // const { paymentId, orderId, state } = req.body; 
      const state = responseData.data.state

      console.log('responseData in verifypayment......',responseData)
        if (state === 'COMPLETED') {

        const appointmentData = await appointmentModel.findById(appointmentId);
          if (appointmentData) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            // console.log(`Appointment with ID ${appointmentId} marked as Paid.`);
          } else {
            console.log("Appointment not found.");
          }
        // res.json({ success: true, message: "Payment Successful" });

      } else {
        res.json({ success: false, message: "Payment failed" });
      }
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };


export {registerUser, loginUser, getProfile, updateProfile,
    bookAppointment, listAppointment, cancelAppointment,
    paymentPhonePe, verifyPhonePePayment, paymentstatus }
