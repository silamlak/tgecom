import {RouterProvider, createBrowserRouter} from 'react-router-dom'
import Home from "./pages/home"
import AddProduct from './pages/AddProduct'
import OrdersTable from './pages/Order'
import DetailOrder from './pages/DetailOrder'
import AddCategory from './pages/AddCategory'

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/add",
      element: <AddProduct />,
    },
    {
      path: "/order",
      element: <OrdersTable />,
    },
    {
      path: "/add/category",
      element: <AddCategory />,
    },
    {
      path: "/order/:id",
      element: <DetailOrder />,
    },
  ]);
  return (
    <RouterProvider router={router} />
  )
}

export default App
