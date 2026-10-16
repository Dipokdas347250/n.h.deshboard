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
import MerchantApply from "./components/auth/MerchantApply";
import MerchantLayout from "./components/merchant/MerchantLayout";
import MerchantHome from "./components/merchant/MerchantHome";
import MerchantProducts from "./components/merchant/MerchantProducts";
import MerchantOrders from "./components/merchant/MerchantOrders";
import MerchantApplications from "./components/merchants/MerchantApplications";
import MerchantList from "./components/merchants/MerchantList";
import ProductApprovals from "./components/merchants/ProductApprovals";
import PaymentReviews from "./components/merchants/PaymentReviews";
import SupportTickets, { AdminTicket } from "./components/merchants/SupportTickets";
import AuditLog from "./components/merchants/AuditLog";
import NotificationCenter from "./components/common/NotificationCenter";

const AdminNotifications = () => <NotificationCenter role="admin" />;
const MerchantNotifications = () => <NotificationCenter role="merchant" />;
import MerchantBilling from "./components/merchant/MerchantBilling";
import MerchantSupport, { MerchantTicket } from "./components/merchant/MerchantSupport";

const MerchantAddProduct = () => <AddProduct merchant />;

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
      { path: "merchants", Component: MerchantList },
      { path: "merchants/applications", Component: MerchantApplications },
      { path: "merchants/products", Component: ProductApprovals },
      { path: "merchants/payments", Component: PaymentReviews },
      { path: "merchants/support", Component: SupportTickets },
      { path: "merchants/support/:id", Component: AdminTicket },
      { path: "merchants/audit", Component: AuditLog },
      { path: "notifications", Component: AdminNotifications },
      // A merchant's own pages. RootLayout keeps merchants here and administrators out.
      {
        path: "merchant",
        Component: MerchantLayout,
        children: [
          { index: true, Component: MerchantHome },
          { path: "products", Component: MerchantProducts },
          { path: "products/new", Component: MerchantAddProduct },
          { path: "orders", Component: MerchantOrders },
          { path: "billing", Component: MerchantBilling },
          { path: "support", Component: MerchantSupport },
          { path: "support/:id", Component: MerchantTicket },
          { path: "notifications", Component: MerchantNotifications },
        ],
      },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/apply", Component: MerchantApply },
  { path: "/register", Component: Register },
]);

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
