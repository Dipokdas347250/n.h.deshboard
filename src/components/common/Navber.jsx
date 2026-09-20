import React, { useState, useRef, useEffect } from 'react'
import { IoSearch } from "react-icons/io5";
import { BsBell } from "react-icons/bs";
import pro from '../../assets/pro.png'
import { MdOutlineDarkMode } from "react-icons/md";
import { useAuthStore } from '../zustendstore/AuthStore';

const Navber = () => {

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef()

  const [logoutOpen, setLogoutOpen] = useState(false)

  const {user} = useAuthStore()
  

  // outside click close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className='py-3 px-5 bg-linear-to-br from-[#022c22] to-[#064e3b] border-b border-black sticky top-0 z-50'>
      <div className="flex items-center justify-between">

        {/* Logo */}
        <div>
          {/* <img src={logo} alt="logo" /> */}
          <h2 className='text-[24px] font-bold text-white'>N H Shop</h2>
        </div>

        {/* Search */}
        <div className="w-[30%] border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2">
          <input className='outline-none w-full text-white bg-transparent' type="text" placeholder="Search..." />
          <IoSearch className='text-white' />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 relative">

          <div className="p-2.5 rounded-full bg-white/20 cursor-pointer">
            <MdOutlineDarkMode />
          </div>

          <div className="p-2.5 rounded-full bg-white/20 cursor-pointer">
            <BsBell />
          </div>

          {/* User */}
          <div ref={dropdownRef} className="relative">
            <img
              src={pro}
              alt="Profile"
              onClick={() => setOpen(!open)}
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-white"
            />

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg p-4 text-black animate-fadeIn">

                {/* User Info */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <img src={pro} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold">{user?.fullname}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                      {user?.role}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-col gap-2">
                  <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
                    Profile
                  </button>
                  <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
                    Settings
                  </button>
                  <button className="text-left px-3 py-2 rounded-lg hover:bg-red-100 text-red-500"  onClick={() => setLogoutOpen(true)}>
                    
                    Logout
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
      {logoutOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white w-80 p-5 rounded-2xl shadow-xl animate-fadeIn">

      <h2 className="text-lg font-semibold text-gray-800">
        Confirm Logout
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Are you sure you want to logout?
      </p>

      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={() => setLogoutOpen(false)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
          Cancel
        </button>

        <button
          // onClick={() => {
          //   setLogoutOpen(false)
          //   console.log("Logged out")
          //   localStorage.removeItem("token")
          //   navigate("/login")
          // }}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
          Logout
        </button>
      </div>

    </div>
  </div>
)}
    </nav>
  )
}

export default Navber