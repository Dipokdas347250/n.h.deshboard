import React, { useState } from 'react'
import Navber from '../common/Navber'
import Sideber from '../common/Sideber'
import { Outlet } from 'react-router'
import PrivateRoute from '../private/PrivateRoute'

const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <>
   <PrivateRoute>
     <Navber onMenuClick={() => setSidebarOpen(true)} />
    <div className="flex">
      <div className="w-0 md:w-[20%]">
        <Sideber open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="w-full md:w-[80%] min-w-0">
        <Outlet/>
      </div>
    </div>
   </PrivateRoute>
    </>
  )
}

export default RootLayout