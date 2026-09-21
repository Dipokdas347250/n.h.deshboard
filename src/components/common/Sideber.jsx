import React from 'react'
import { FaBorderAll } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";
import { FaBarsStaggered } from "react-icons/fa6";
import { FaShopify } from "react-icons/fa6";
import { MdOutlineLibraryBooks } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { VscArrowSwap } from "react-icons/vsc";
import { BsBarChartFill } from "react-icons/bs";
import { IoSettingsSharp } from "react-icons/io5";
import { TbHelpSquareRounded } from "react-icons/tb";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { GiVerticalBanner } from "react-icons/gi";
import { Link } from 'react-router';
import { IoClose } from "react-icons/io5";




const Sideber = ({ open = false, onClose = () => {} }) => {
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-black/50 md:hidden" />}
      <section className={`fixed inset-y-0 left-0 z-50 w-[min(82vw,300px)] bg-[#064e3b] border-r border-black pt-5 pb-25 px-2 h-full overflow-scroll scrollmain transition-transform duration-300 md:w-[20%] md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className=" ">
          <div className="p-2 flex justify-between items-center gap-3 cursor-pointer">

           <Link to="/">
            <div className="flex items-center justify-center gap-3">
              <FaBorderAll className='text-[20px] text-white' />
              <h2 className=' text-white text-2xl font-bold '>Dashboard</h2>
            </div>
           </Link>
            <div className="flex items-center gap-3">
              <FaBarsStaggered className='text-white text-[20px]' />
              <button type="button" onClick={onClose} className="text-white md:hidden" aria-label="Close navigation"><IoClose size={24} /></button>
            </div>
          </div>

          <div className=" space-y-3 mt-10">
            <div className="mt-10  border-t  border-gray-300 pt-5">
            <div className=" p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <h2 className=' text-white text-lg font-semibold uppercase'>Product</h2>
            </div>
            <div className="ml-5">
              <div className="">
              <Link to="/add-product">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <FaShopify className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Add Products</h2>
              </div>
              </Link>
            </div>
            <div className="">
              <Link to="/all-product">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <FaShopify className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'> All Products</h2>
              </div>
              </Link>
            </div>
            </div>
            </div>
            <div className="mt-10  border-t  border-gray-300 pt-5">
            <div className=" p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <h2 className=' text-white text-lg font-semibold uppercase'>Category</h2>
            </div>
            <div className="ml-5">
             
            <div className="">
              <Link to="/add-category">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <AiFillProduct className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Add Category</h2>
              </div>
              </Link>
            </div>
             <div className="">
                <Link to="/all-category">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <AiFillProduct className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>All Category</h2>
              </div>
               </Link>
            </div>
            </div>
            </div>

            <div className="mt-10  border-t border-b border-gray-300 py-5">
            <div className=" p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <h2 className=' text-white text-lg font-semibold uppercase'>Banner</h2>
            </div>
           <div className="ml-5">
             <div className="">
              <Link to="/banner">
                <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                  <GiVerticalBanner className='text-[16px] text-white' />
                  <h2 className=' text-white text-lg font-semibold'>Add Banner</h2>
                </div>
              </Link>
            </div>
            <div className="">
              <Link to="/banner/all">
                <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                  <GiVerticalBanner className='text-[16px] text-white' />
                  <h2 className=' text-white text-lg font-semibold'>All Banner</h2>
                </div>
              </Link>
            </div>
           </div>
            </div>
            
            <div className="">
              <Link to="/orders">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <MdOutlineLibraryBooks className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Orders</h2>
              </div>
              </Link>
            </div>
            <div className="">
              <Link to="/customers">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <FaUsers className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Customers</h2>
              </div>
              </Link>
            </div>
            <div className="">
              <Link to="/transactions">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <VscArrowSwap className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Transactions</h2>
              </div>
              </Link>
            </div>
            <div className="">
              <Link to="/analytics">
              <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
                <BsBarChartFill className='text-[16px] text-white' />
                <h2 className=' text-white text-lg font-semibold'>Analytics</h2>
              </div>
              </Link>
            </div>
          </div>

          <div className="">
            <div className="mt-10  border-t border-gray-300 pt-5">
             <div className=" p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <h2 className=' text-white text-lg font-semibold uppercase'>support</h2>
            </div>
           <div className="space-y-3 mt-5">
             <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <IoSettingsSharp className='text-[16px] text-white' />
              <h2 className=' text-white text-lg font-semibold'>Settings</h2>
            </div>
             <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <TbHelpSquareRounded className='text-[16px] text-white' />
              <h2 className=' text-white text-lg font-semibold'>Helps</h2>
            </div>
             <div className="flex items-center gap-3 p-2 cursor-pointer duration-300 ease-in-out hover:bg-green-300/20 rounded-r-lg border-l-4 border-[#064e3b] hover:border-green-300">
              <RiLogoutCircleRLine className='text-[16px] text-white' />
              <h2 className=' text-white text-lg font-semibold'>Log out</h2>
            </div>
           </div>
            
          </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Sideber