import React from 'react'
import Navber from '../common/Navber'
import Sideber from '../common/Sideber'
import { Outlet } from 'react-router'
import PrivateRoute from '../private/PrivateRoute'

const RootLayout = () => {
  return (
    <>
   <PrivateRoute>
     <Navber/>
    <div className="flex">
      <div className="w-[20%]">
        <Sideber/>
      </div>
      <div className="w-[80%]">
        <Outlet/>
      </div>
    </div>
   </PrivateRoute>
    </>
  )
}

export default RootLayout