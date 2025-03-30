import React from 'react';
import { Link } from 'react-router-dom';
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
  FiGlobe ,
  FiCloud 
} from 'react-icons/fi';

const Home = () => {
  const navItems = [
    { path: '/create-customer', icon: <FiUserPlus />, text: 'יצירת לקוח', color: '#3b82f6' },
    { path: '/add-product', icon: <FiPlus />, text: 'הוספת מוצר', color: '#10b981' },
    { path: '/add-inventory', icon: <FiBox />, text: 'הוספת מלאי', color: '#f59e0b' },
    { path: '/multi-order', icon: <FiShoppingCart />, text: 'הזמנת רכישה', color: '#8b5cf6' },
    { path: '/pickup-selection', icon: <FiShoppingBag />, text: 'הזמנת לקיטה', color: '#ef4444' },
    { path: '/confirm-pickup-order', icon: <FiTruck />, text: 'לקיטה', color: '#f59e0b' },
    { path: '/view-orders', icon: <FiList />, text: 'צפייה בהזמנות', color: '#3b82f6' },
    { path: '/view', icon: <FiDatabase />, text: 'צפייה במלאי', color: '#10b981' },
    { path: '/view-customers', icon: <FiUsers />, text: 'צפייה בלקוחות', color: '#f59e0b' },
    // פריטי ניווט להזמנות אונליין
    { path: '/online-order', icon: <FiGlobe />, text: 'הזמנה אונליין', color: '#9b59b6' },
    { path: '/view-online-orders', icon: <FiCloud />, text: 'צפייה בהזמנות אונליין', color: '#9b59b6' },
  ];

  return (
    <div className="home-container">
      <div className="header">
        <h1 className="main-title">מצות אבהתנא</h1>
        <div className="subtitle">מערכת לניהול מלאי</div>
      </div>
      
      <div className="cards-container">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className="card"
            style={{ '--card-color': item.color }}
          >
            <div className="card-icon">{item.icon}</div>
            <div className="card-title">{item.text}</div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .home-container {
          padding: 1rem;
          direction: rtl;
          background-color: #f3f4f6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          text-align: center;
          padding: 1rem 0;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 8px;
          color: white;
          box-shadow: 0 2px 10px rgba(124, 58, 237, 0.2);
        }

        .main-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          padding: 0.25rem;
        }

        .subtitle {
          font-size: 0.875rem;
          font-weight: 400;
          opacity: 0.9;
          margin-top: 0.25rem;
        }

        .cards-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0 0.5rem;
        }

        .card {
          display: flex;
          align-items: center;
          background-color: white;
          border-radius: 8px;
          padding: 0.75rem;
          text-decoration: none;
          color: #1e293b;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: var(--card-color);
          border-radius: 0 8px 8px 0;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .card:active {
          transform: scale(0.98);
        }

        .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: var(--card-color);
          margin-left: 0.75rem;
          width: 32px;
          height: 32px;
          background-color: rgba(var(--card-color-rgb), 0.1);
          border-radius: 6px;
          transition: transform 0.2s ease;
        }

        .card:hover .card-icon {
          transform: scale(1.1);
        }

        .card-title {
          font-size: 0.95rem;
          font-weight: 500;
          flex-grow: 1;
        }

        /* Tablet */
        @media (min-width: 640px) {
          .home-container {
            padding: 1.5rem;
          }

          .header {
            padding: 1.25rem 0;
            margin-bottom: 1.5rem;
            border-radius: 10px;
          }

          .main-title {
            font-size: 1.75rem;
          }

          .subtitle {
            font-size: 1rem;
          }

          .cards-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
            padding: 0;
          }

          .card {
            padding: 1rem;
            border-radius: 10px;
          }

          .card-icon {
            font-size: 1.5rem;
            width: 36px;
            height: 36px;
          }

          .card-title {
            font-size: 1rem;
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .home-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .header {
            padding: 1.5rem 0;
            border-radius: 12px;
          }

          .main-title {
            font-size: 2rem;
          }

          .subtitle {
            font-size: 1.1rem;
          }

          .cards-container {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }

          .card {
            padding: 1.25rem;
          }

          .card-icon {
            width: 40px;
            height: 40px;
          }

          .card-title {
            font-size: 1.05rem;
          }
        }

        /* Fix for color variable RGB extraction */
        :root {
          --blue-rgb: 59, 130, 246;
          --green-rgb: 16, 185, 129;
          --orange-rgb: 245, 158, 11;
          --purple-rgb: 139, 92, 246;
          --red-rgb: 239, 68, 68;
          --purple2-rgb: 155, 89, 182;
        }

        .card[style*="--card-color: #3b82f6"] {
          --card-color-rgb: var(--blue-rgb);
        }

        .card[style*="--card-color: #10b981"] {
          --card-color-rgb: var(--green-rgb);
        }

        .card[style*="--card-color: #f59e0b"] {
          --card-color-rgb: var(--orange-rgb);
        }

        .card[style*="--card-color: #8b5cf6"] {
          --card-color-rgb: var(--purple-rgb);
        }

        .card[style*="--card-color: #ef4444"] {
          --card-color-rgb: var(--red-rgb);
        }

        .card[style*="--card-color: #9b59b6"] {
          --card-color-rgb: var(--purple2-rgb);
        }
      `}</style>
    </div>
  );
};

export default Home;
