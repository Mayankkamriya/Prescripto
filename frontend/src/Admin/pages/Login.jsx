import React, { useContext,useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import axios  from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DoctorContext } from '../context/DoctorContext'

const Login = () => {
   const navigate = useNavigate()

  const [state,setState]= useState('Admin')
  const [email,setEmail]= useState('')
  const [Password,setPassword]= useState('')

  const {setAtoken, backendUrl} = useContext(AdminContext)
  const {setDToken} = useContext(DoctorContext)

  const [docId,setdocId] = useState('')
  
  const onSubmitHandler = async (event) => {
  event.preventDefault();
    if (!backendUrl) {
      console.error('Error: backendUrl is undefined. Please check the AdminContext.');
      toast.error('Server URL is not set. Please contact the admin.');
      return;
    }

  try {
    if (state === 'Admin') {
      const {data} = await axios.post(backendUrl + '/api/admin/loginAdmin', { email, password:Password });
    
      if ( data && data.success) {
        localStorage.setItem('aToken',data.token)
        setAtoken(data.token);
        toast.success('Login successful!');
        navigate('/admin-dashbord');
      } 
      else {
        toast.error(data.message)
      }
      
    } else {
      // Handle doctor login or other cases
      const {data} = await axios.post(backendUrl + '/api/doctor/login', { email, password:Password });

      if ( data && data.success) {

        localStorage.setItem('dToken',data.token)
        setDToken(data.token);
        setdocId(data.id);
        toast.success('Login successful!');
        navigate('/doctor-dashboard');
        
      } else {
        toast.error(data.message)
      }
    }

  } catch (error) {
    console.error('Error during login:', error.response ? error.response.data : error);
    toast.error('Login failed. Please check your credentials.');
  }
}
  return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
            <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
              <p className='text-2xl font-semibold m-auto'><span className='text-primary'> {state} </span> Login</p>
            <div>
              <p>Email</p>
              <input  onChange={(e)=>setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded-w-full p-2 mt-1' required type="email" />
            </div>
            <div>
              <p>password</p>
              <input onChange={(e)=>setPassword(e.target.value)} value={Password} className='border border-[#DADADA] rounded-w-full p-2 mt-1' required type="password" />
            </div>
            <button className='bg-primary text-white w-full py-2 rounded-md text-base'>Login</button>
            {
              state === 'Admin'
              ? <p>Doctor Login? <span className='text-primary underline cursor-pointer' onClick={()=> setState('Doctor')}> Click here</span></p>
              : <p>Admin Login?  <span className='text-primary underline cursor-pointer' onClick={()=> setState('Admin')}> Click here</span></p>
            }    
            
            </div>
        </form>
      )
}
    
    export default Login
