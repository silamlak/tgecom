import {RouterProvider, createBrowserRouter} from 'react-router-dom'
import Home from "./pages/home"
import AddProduct from './pages/AddProduct'

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
  ])
  return (
    <RouterProvider router={router} />
  )
}

export default App
