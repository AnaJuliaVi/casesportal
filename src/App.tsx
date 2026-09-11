import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import FormatsListPage from "./pages/FormatsListPage";
import FormatDetailPage from "./pages/FormatDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<FormatsListPage />} />
        <Route path="/format/:id" element={<FormatDetailPage />} />
        <Route path="*" element={<FormatsListPage />} />
      </Route>
    </Routes>
  );
}
