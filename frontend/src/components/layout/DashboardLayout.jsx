import Sidebar
  from "./Sidebar.jsx";

import Topbar
  from "./Topbar.jsx";


export default function DashboardLayout({
  activeView,
  setActiveView,
  children,
}) {
  return (
    <div className="dashboard">

      <Sidebar
        activeView={
          activeView
        }
        setActiveView={
          setActiveView
        }
      />

      <main className="main">

        <Topbar />

        {children}

      </main>

    </div>
  );
}