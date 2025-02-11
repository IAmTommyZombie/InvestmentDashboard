import { NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Building } from "lucide-react";

const Navigation = () => {
  const baseStyles =
    "flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors";
  const activeStyles = "bg-gray-100 text-blue-600 font-medium";
  const inactiveStyles = "hover:text-gray-900";

  return (
    <nav className="space-y-1">
      <NavLink
        to="/overview"
        className={({ isActive }) =>
          `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Overview</span>
      </NavLink>
      <NavLink
        to="/portfolio"
        className={({ isActive }) =>
          `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`
        }
      >
        <Briefcase className="w-5 h-5" />
        <span>Portfolio</span>
      </NavLink>
      <NavLink
        to="/austin"
        className={({ isActive }) =>
          `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`
        }
      >
        <Building className="w-5 h-5" />
        <span>Austin</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;
