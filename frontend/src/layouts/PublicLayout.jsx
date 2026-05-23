import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;
