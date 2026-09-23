import { createBrowserRouter, RouterProvider } from "react-router";
import RootLayout from "./components/layout/RootLayout";
import { LanguageProvider } from "./i18n/LanguageContext";

import Dashboard from "./components/home/Dashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AddBanner from "./components/banner/Banner";
import GetBanner from "./components/banner/GetBanner";
import AddCategory from "./components/category/Add_category";
import AllCategory from "./components/category/All_category";
import AddProduct from "./components/product/Add_product";
import AllProduct from "./components/product/All_product";
import VideoManager from "./components/video/VideoManager";
import Orders from "./components/pages/Orders";
import FraudReview from "./components/pages/FraudReview";
import Customers from "./components/pages/Customers";
import Transactions from "./components/pages/Transactions";
import Analytics from "./components/pages/Analytics";
import Settings from "./components/pages/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "add-product", Component: AddProduct },
      { path: "all-product", Component: AllProduct },
      { path: "add-category", Component: AddCategory },
      { path: "all-category", Component: AllCategory },
      { path: "banner", Component: AddBanner },
      { path: "banner/all", Component: GetBanner },
      { path: "videos", Component: VideoManager },
      { path: "orders", Component: Orders },
      { path: "fraud-review", Component: FraudReview },
      { path: "customers", Component: Customers },
      { path: "transactions", Component: Transactions },
      { path: "analytics", Component: Analytics },
      { path: "settings", Component: Settings },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
]);

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
