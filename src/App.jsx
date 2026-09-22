import { createBrowserRouter, RouterProvider } from "react-router";
import RootLayout from "./components/layout/RootLayout";
import Home from "./components/pages/Home";
import About from "./components/pages/About";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AllBanner from "./components/pages/AllBanner";
import Get_Banner from "./components/pages/Get_Banner";
import Add_category from "./components/category/Add_category";
import All_category from "./components/category/All_category";
import All_product from "./components/product/All_product";
import Add_product from "./components/product/Add_product";
import Orders from "./components/pages/Orders";
import Customers from "./components/pages/Customers";
import Transactions from "./components/pages/Transactions";
import Analytics from "./components/pages/Analytics";
import VideoManager from "./components/video/VideoManager";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "banner", Component: AllBanner },
      { path: "banner/all", Component: Get_Banner },
      { path: "all-category", Component: All_category },
      { path: "add-category", Component: Add_category },
      { path: "all-product", Component: All_product },
      { path: "add-product", Component: Add_product },
      { path: "orders", Component: Orders },
      { path: "customers", Component: Customers },
      { path: "transactions", Component: Transactions },
      { path: "analytics", Component: Analytics },
      { path: "videos", Component: VideoManager },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
]);


const App = () => {
  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App