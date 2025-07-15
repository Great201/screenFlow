
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import './App.css'
import Layout from './Components/Layout'
import Home from './pages/Home'
import Shot from './pages/Shot'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Layout />}>
        <Route path='/' index element={<Home />} />
        <Route path='/shot' index element={<Shot />} />
      </Route>
    )
  )
  return (
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
