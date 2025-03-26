import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiPlus,
  FiBox,
  FiShoppingCart,
  FiShoppingBag,
  FiList,
  FiDatabase,
  FiUsers,
  FiUserPlus,
  FiTruck,
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiHome,
  FiGlobe, // ייבוא סמל חדש להזמנה אונליין
} from 'react-icons/fi';

const Navigation = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // בדיקת גודל המסך
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // פונקציית פתיחה/סגירה
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: '/', icon: <FiHome />, text: 'בית' },
    { path: '/create-customer', icon: <FiUserPlus />, text: 'יצירת לקוח' },
    { path: '/add-product', icon: <FiPlus />, text: 'הוספת מוצר' },
    { path: '/add-inventory', icon: <FiBox />, text: 'הוספת מלאי' },
    { path: '/multi-order', icon: <FiShoppingCart />, text: 'הזמנת רכישה' },
    { path: '/pickup-selection', icon: <FiShoppingBag />, text: 'הזמנת לקיטה' },
    { path: '/confirm-pickup-order', icon: <FiTruck />, text: 'לקיטה' },
    { path: '/view-orders', icon: <FiList />, text: 'צפייה בהזמנות' },
    { path: '/view', icon: <FiDatabase />, text: 'צפייה במלאי' },
    { path: '/view-customers', icon: <FiUsers />, text: 'צפייה בלקוחות' },
    // פריט ניווט חדש להזמנה אונליין
    { path: '/online-order', icon: <FiGlobe />, text: 'הזמנה אונליין' },
  ];

  return (
    <div className="layout-container">
      {/* כפתור פתיחת/סגירת תפריט במובייל */}
      <button
        className="toggle-button"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">תפריט</h2>
          <button
            className="collapse-button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            {isSidebarOpen ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        <div className="nav-items">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              <span className="icon">{item.icon}</span>
              {isSidebarOpen && <span className="text">{item.text}</span>}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Overlay למובייל */}
      {isMobile && isSidebarOpen && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}

      <style jsx>{`
        .layout-container {
          position: relative;
          direction: rtl;
        }

        .toggle-button {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1001;
          display: none;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px;
          cursor: pointer;
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          background-color: #fff;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          z-index: 1000;
          overflow-y: auto;
          padding-top: 20px;
          width: ${isSidebarOpen ? '250px' : '60px'};
        }

        .sidebar-header {
          display: block;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 16px 16px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .sidebar-title {
          font-size: 18px;
          margin: 0;
          opacity: ${isSidebarOpen ? 1 : 0};
          transition: opacity 0.3s ease;
        }

        .collapse-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #4a5568;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .collapse-button:hover {
          background-color: #e2e8f0;
        }

        .nav-items {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 0 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 6px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.2s ease;
          white-space: nowrap;
          gap: 12px;
        }

        .nav-link:hover {
          background-color: #e2e8f0;
        }

        .nav-link.active {
          background-color: #3182ce;
          color: white;
        }

        .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          min-width: 24px;
        }

        .text {
          font-weight: 500;
          opacity: ${isSidebarOpen ? 1 : 0};
          transition: opacity 0.2s ease;
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        @media (max-width: 768px) {
          .toggle-button {
            display: block;
          }

          .sidebar {
            transform: ${isSidebarOpen ? 'translateX(0)' : 'translateX(100%)'};
            width: 250px;
          }

          .sidebar.closed {
            width: 0;
          }

          .text {
            opacity: 1;
          }

          .sidebar-title {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Navigation;
