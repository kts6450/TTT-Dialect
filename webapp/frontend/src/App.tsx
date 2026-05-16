import { Route, Routes } from "react-router-dom";

import { ConsumerLayout } from "./layouts/ConsumerLayout";
import { SellerLayout } from "./layouts/SellerLayout";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { SellerPage } from "./pages/SellerPage";
import { ShopPage } from "./pages/ShopPage";

export default function App() {
  return (
    <Routes>
      <Route element={<ConsumerLayout />}>
        <Route index element={<ShopPage />} />
        <Route path="listing/:id" element={<ListingDetailPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
      </Route>
      <Route path="seller" element={<SellerLayout />}>
        <Route index element={<SellerPage />} />
      </Route>
    </Routes>
  );
}
