import {RouterProvider, createBrowserRouter} from 'react-router-dom'
import Home from "./pages/Home"
import AddProduct from './pages/AddProduct'
import OrdersTable from './pages/Order'
import DetailOrder from './pages/DetailOrder'
import AddCategory from './pages/AddCategory'
import ProductDetail from './pages/ProductDetail'
import Layout from './component/Layout'

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/product/:id",
          element: <ProductDetail />,
        },
        {
          path: "/add-product",
          element: <AddProduct />,
        },
        {
          path: "/order",
          element: <OrdersTable />,
        },
        {
          path: "/add-category",
          element: <AddCategory />,
        },
        {
          path: "/order/:id",
          element: <DetailOrder />,
        },
      ],
    },
  ]);
  return (
    <RouterProvider router={router} />
  )
}

export default App
