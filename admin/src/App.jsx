import React, { useContext } from 'react'
import Login from './pages/Login.jsx'
import {ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import  {AdminContext}  from './context/AdminContext.jsx'
import Navbar from './components/Navbar.jsx'

const App = () => {
  const {atoken} = useContext(AdminContext)

  return atoken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer/>
      <Navbar/>
      {/* <Login/> */}
    </div>
  ) :(
    <>
      <Login/>
      <ToastContainer/>
    </>
  )
}

export default App