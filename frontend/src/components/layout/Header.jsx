import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../api/authApi';
import { fetchUnreadNotifications, markNotificationAsRead } from '../../api/notificationsApi';

const Header = ({ onSidebarToggle }) => {
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser() || { username: 'Admin', role: 'Administrator' };

  useEffect(() => {
    let interval;
    if (user?.username) {
      const loadNotifications = async () => {
        try {
          const res = await fetchUnreadNotifications(user.username);
          if (res?.data) {
            setNotifications(res.data);
          }
        } catch (err) {
          console.error('Failed to fetch notifications', err);
        }
      };
      
      loadNotifications();
      // Poll every 60 seconds
      interval = setInterval(loadNotifications, 60000);
    }
    return () => clearInterval(interval);
  }, [user?.username]);

  const handleNotificationClick = async (notif) => {
    try {
      await markNotificationAsRead(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      setShowNotifications(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 z-10">
      {/* Mobile sidebar toggle */}
      <button
        onClick={onSidebarToggle}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search jobs, candidates..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400 text-gray-900"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white text-[8px] font-bold text-white shadow-sm">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-3 z-20 animate-fade-in origin-top-right">
                <div className="px-4 pb-2 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto text-gray-200 mb-2" size={24} />
                      <p className="text-sm text-gray-400 font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <p className="text-sm text-gray-700 font-medium leading-snug">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1.5 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User Profile & Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer group hover:bg-gray-50 p-1.5 rounded-xl transition-colors border border-transparent hover:border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm ring-2 ring-blue-50">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-gray-800 leading-none">{user.username}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider leading-none">
                {user.role}
              </p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-20 animate-fade-in origin-top-right">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
