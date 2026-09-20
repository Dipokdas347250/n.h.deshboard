import axios from 'axios'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../zustendstore/AuthStore';

const PrivateRoute = ({children}) => {
  const navigate = useNavigate();
  const {setUser} = useAuthStore()
  
  useEffect(()=>{
    
    axios.get(`${import.meta.env.VITE_API_URL}/auth/getme`, { withCredentials: true })
    .then((response) => {
      
      setUser(response.data.data)
    })
    .catch((error) => {
      console.error("Error:", error);
      navigate("/login")
      }
    );
  }, [navigate, setUser]);

  return (
    <div>{children}</div>
  )
}

export default PrivateRoute