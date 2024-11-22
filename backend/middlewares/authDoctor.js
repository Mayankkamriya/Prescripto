import jwt from "jsonwebtoken";

// doctor authentication middleware
const authDoctor = async (req,res,next)=>{
    try {
        const {dtoken} =req.headers // take token from headers
        
        if (!dtoken) {
    return res.json({success:false, message:'Not Authorized Login Again'})
    }

// we get decoded token it means email and password

    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
    req.body.docId = token_decode.id;
    next()
    
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export default authDoctor