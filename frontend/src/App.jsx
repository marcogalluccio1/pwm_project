import { Routes, Route } from "react-router-dom";
import { useAuth } from "./auth/useAuth";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Me from "./pages/me/Me";
import CreateRestaurant from "./pages/seller/CreateRestaurant";
import RestaurantManagement from "./pages/seller/RestaurantManagement";
import RestaurantMenu from "./pages/seller/RestaurantMenu";
import Restaurants from "./pages/public/Restaurants";
import RestaurantDetails from "./pages/public/RestaurantDetails";
import Meals from "./pages/public/Meals";
import MealDetails from "./pages/public/MealDetails";
import Promotions from "./pages/public/Promotions";
import Checkout from "./pages/customer/Checkout";
import CustomerOrders from "./pages/customer/CustomerOrders";
import RestaurantOrders from "./pages/seller/RestaurantOrders";
import NewMeal from "./pages/seller/NewMeal";
import EditMeal from "./pages/seller/EditMeal";
import MyMeals from "./pages/seller/MyMeals";

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/me" element={<Me />} />
      <Route path="/seller/restaurant/create" element={<CreateRestaurant />} />
      <Route path="/seller/restaurant" element={<RestaurantManagement />} />
      <Route path="/seller/restaurant/menu" element={<RestaurantMenu />} />
      <Route path="/seller/restaurant/menu/new_meal" element={<NewMeal />} />
      <Route path="/seller/meals/:id/edit" element={<EditMeal />} />
      <Route path="/seller/restaurant/menu/my_meals" element={<MyMeals />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurants/:id" element={<RestaurantDetails />} />
      <Route path="/meals" element={<Meals />} />
      <Route path="/meals/:id" element={<MealDetails />} />
      <Route path="/promotions" element={<Promotions />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/customer/orders" element={<CustomerOrders />} />
      <Route path="/seller/orders" element={<RestaurantOrders />} />
      <Route path="*" element={<h1>Error 404: page not found</h1>} />
    </Routes>
  );
}
