import { Route, Routes } from "react-router-dom";
import { AgeGate } from "@/components/AgeGate";
import { HomePage } from "@/pages/HomePage";
import { AdminPage } from "@/pages/AdminPage";
import { ProductPage } from "@/pages/ProductPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PushAutoPrompt } from "@/components/PushAutoPrompt";
import { Shell } from "@/components/ui";

export default function App() {
  return (
    <Shell>
      <AgeGate />
      <PushAutoPrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Shell>
  );
}
