import React from 'react'
import { assets } from '../assets/assets'

const contact = () => {
  return (
<div>

    <div className='text-center text-2xl pt-6  text-gray-500 '>
      <p>CONTACT <span className='text-gray-700 font-medium'>US</span></p>
    </div>

<div className='my-10 flex flex-col justofy-center md:flex-row gap-10 mb-28  text-sm'>
  <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
    <div className='flex flex-col justofy-center items-start gap-6'>
     <p className='font-semibold text-lg text-gray-600'>OUR OFFICE</p>
     <p className='text-gray-500'>B-24 Road No.3, Alkapuri <br /> Ratlam (M.P.)</p>
     <p className='text-gray-500'> Mob : +91 8253038815 <br />Email: kamriyamayank45@gmail.com</p>
     <p className='font-semibold text-lg text-gray-600'>Careers at PRESCRIPTO</p>
     <p className='text-gray-500'>Learn more about our teams an job openings.</p> 
     <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Explore Jobs</button>
    </div>
</div>

</div>
  )
}

export default contact