
import { useState } from "react";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/employee/Dashboard";
import Register from "./pages/auth/Register";
import { useSelector } from "react-redux";
import AdminDashboard from "./pages/admin/AdminDashboard";


function App() {
    const [page, setPage] = useState("login");
    const user = useSelector((state) => state.auth.user);
    if (page === "login") {
      return (
        <div>
          <Login onLogin={() => setPage("dashboard")} />
          <button onClick={() => setPage("register")}>
            Create an Account
          </button>
        </div>
      );
    }
  
    if (page === "register") {
      return <Register onRegister={() => setPage("login")} />;
    }
  
    
if (page === "dashboard") {
    return user?.role === "ADMIN" ? (
      <AdminDashboard onLogout={() => setPage("login")} />
    ) : (
      <Dashboard onLogout={() => setPage("login")} />
    );
  }
  
    return null;
  }
  
  export default App;
  
