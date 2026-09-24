import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, CheckCircle2, ShieldAlert, Check, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { notificationsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface NotificationItem {
  _id: string;
  userId: string;
  childId?: string;
  type: 'OVERDUE' | 'UPCOMING' | 'COMPLETED' | 'DOCTOR_REMINDER';
  priority: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'upcoming' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationsAPI.getAll();
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.childId) {
      navigate(`/child/${notif.childId}`);
    }
  };

  const urgentCount = notifications.filter(
    n => n.priority === 'urgent' || n.type === 'OVERDUE' || n.type === 'DOCTOR_REMINDER'
  ).length;

  const upcomingCount = notifications.filter(
    n => n.type === 'UPCOMING' || n.priority === 'warning'
  ).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'urgent') return n.priority === 'urgent' || n.type === 'OVERDUE' || n.type === 'DOCTOR_REMINDER';
    if (filter === 'upcoming') return n.type === 'UPCOMING' || n.priority === 'warning';
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'DOCTOR_REMINDER') {
      return <ShieldAlert className="w-4 h-4 text-purple-500" />;
    }
    if (type === 'OVERDUE' || priority === 'urgent') {
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
    if (type === 'UPCOMING' || priority === 'warning') {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[420px] p-0 border-border bg-card shadow-xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm font-display">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === 'urgent'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Urgent ({urgentCount})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === 'upcoming'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'p-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors cursor-pointer text-left relative group',
                  !notif.isRead && 'bg-primary/5 dark:bg-primary/[0.03]'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                    notif.type === 'DOCTOR_REMINDER'
                      ? 'bg-purple-500/10 border border-purple-500/20'
                      : notif.type === 'OVERDUE'
                      ? 'bg-rose-500/10 border border-rose-500/20'
                      : notif.type === 'UPCOMING'
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-emerald-500/10 border border-emerald-500/20'
                  )}
                >
                  {getNotificationIcon(notif.type, notif.priority)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={cn(
                        'text-xs font-semibold truncate',
                        notif.isRead ? 'text-foreground' : 'text-primary font-bold'
                      )}
                    >
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={e => handleMarkAsRead(notif._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-opacity"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">All caught up!</p>
              <p className="text-[11px] text-muted-foreground/80">
                No notifications match your current filter.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-border bg-muted/20 text-center">
          <span className="text-[11px] text-muted-foreground">
            NIS 2025 Automated Immunization Alerts
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
