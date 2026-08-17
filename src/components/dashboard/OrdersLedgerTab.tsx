import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { OrderBookingLead, OrderStatus, BusinessCategory } from '../../types';
import { LedgerRowSkeleton } from './SkeletonLoaders';
import {
  ShoppingBag,
  Coffee,
  Scissors,
  Dumbbell,
  GraduationCap,
  Cake,
  Stethoscope,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Plus,
  IndianRupee,
  TrendingUp,
  Package,
  Calendar,
  X,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  BellRing,
  RefreshCw,
} from 'lucide-react';

import { getCategoryReminderMessage } from '../../lib/constants/categoryPresets';

interface OrdersLedgerTabProps {
  businessId: string;
  category: BusinessCategory;
  businessName?: string;
}

const CATEGORY_HEADER_CONFIG: Record<
  BusinessCategory,
  { title: string; subtitle: string; icon: React.ElementType; recordLabel: string }
> = {
  bakery: {
    title: 'Bakery Orders & Deliveries',
    subtitle: 'Fresh bakery orders, cake weights & delivery addresses captured by AI',
    icon: Cake,
    recordLabel: 'Record Order',
  },
  cafe: {
    title: 'Cafe Orders & Reservations',
    subtitle: 'Food orders, table reservations & takeaways captured by AI',
    icon: Coffee,
    recordLabel: 'Record Order',
  },
  salon: {
    title: 'Salon Appointments & Services',
    subtitle: 'Stylist bookings, haircuts, spa & grooming appointments captured by AI',
    icon: Scissors,
    recordLabel: 'Record Appointment',
  },
  clinic: {
    title: 'Clinic OPD & Doctor Appointments',
    subtitle: 'Patient consultations, doctor appointments & health checkups captured by AI',
    icon: Stethoscope,
    recordLabel: 'Record Appointment',
  },
  gym: {
    title: 'Gym Memberships & Passes',
    subtitle: 'Member passes, trial inquiries & renewal plans captured by AI',
    icon: Dumbbell,
    recordLabel: 'Record Pass / Lead',
  },
  tuition: {
    title: 'Tuition Inquiries & Admissions',
    subtitle: 'Student admissions, batch timings & demo class leads captured by AI',
    icon: GraduationCap,
    recordLabel: 'Record Inquiry',
  },
  retail: {
    title: 'Boutique & Retail Shopping Orders',
    subtitle: 'Apparel orders, product inquiries & home delivery requests captured by AI',
    icon: ShoppingBag,
    recordLabel: 'Record Order',
  },
  real_estate: {
    title: 'Property Inquiries & Site Visits',
    subtitle: 'Buyer leads, property visits & brochure requests captured by AI',
    icon: Building2,
    recordLabel: 'Record Site Visit',
  },
  custom: {
    title: 'Client Inquiries & Bookings',
    subtitle: 'Custom business requests, leads & appointments captured by AI',
    icon: Sparkles,
    recordLabel: 'Record Entry',
  },
};

export const OrdersLedgerTab: React.FC<OrdersLedgerTabProps> = ({
  businessId,
  category,
  businessName = 'Our Business',
}) => {
  const [orders, setOrders] = useState<OrderBookingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [notifyCustomerOnStatus, setNotifyCustomerOnStatus] = useState(true);

  // Manual Order Form State
  const [manualForm, setManualForm] = useState({
    customer_number: '',
    type: category === 'salon' ? 'booking' : category === 'tuition' ? 'lead' : 'order',
    itemName: '',
    quantity: 1,
    price: 100,
    delivery_address: '',
    notes: '',
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders from API
  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      const res = await fetch(`/api/orders?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();

      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto poll every 8 seconds to guarantee fresh state
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 8000);

    const onFocus = () => fetchOrders(true);
    window.addEventListener('focus', onFocus);

    const channel = supabaseClient
      .channel(`realtime-orders-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_bookings_leads',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderBookingLead;
            setOrders((prev) => [newOrder, ...prev]);
            setRealtimeNotice(`New order from ${newOrder.customer_number}!`);
            setTimeout(() => setRealtimeNotice(null), 5000);
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as OrderBookingLead;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as { id: string };
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId]);

  // Handle Order Status Changes
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          notifyCustomer: notifyCustomerOnStatus,
          businessName,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // 1-Tap Toggle Payment Status
  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: 'paid' | 'pending') => {
    try {
      setUpdatingId(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          payment_status: newPaymentStatus,
          notifyCustomer: true,
          businessName,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update payment status');
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            const merged = {
              ...(o.details || {}),
              payment_status: newPaymentStatus,
              paid_at: newPaymentStatus === 'paid' ? new Date().toISOString() : undefined,
            };
            return { ...o, details: merged };
          }
          return o;
        })
      );
    } catch (err) {
      console.error('Payment status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // 1-Tap Send WhatsApp Re-Engagement & Renewal Reminder
  const handleSendReEngagementNudge = async (customerNumber: string, lastItem?: string) => {
    if (!customerNumber) return;
    setSendingReminder(customerNumber);
    try {
      const msg = getCategoryReminderMessage(
        category,
        businessName || 'Our Business',
        lastItem
      );

      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerNumber,
          message: msg,
          lastItem,
        }),
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        alert(`✅ WhatsApp reminder successfully dispatched to ${customerNumber} for ${businessName || 'your business'}!`);
      } else {
        alert(resData.error || 'Failed to dispatch reminder.');
      }
    } catch (err: any) {
      alert(`Error sending reminder: ${err.message}`);
    } finally {
      setSendingReminder(null);
    }
  };

  // Create Manual Order
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customer_number || !manualForm.itemName) {
      alert('Please enter a customer number and item name.');
      return;
    }

    setCreatingOrder(true);
    try {
      const totalAmount = Number(manualForm.price) * Number(manualForm.quantity);
      const detailsPayload = {
        items: [
          {
            name: manualForm.itemName,
            quantity: Number(manualForm.quantity),
            price: Number(manualForm.price),
          },
        ],
        total: totalAmount,
        delivery_address: manualForm.delivery_address || 'Store Walk-in / Counter',
        notes: manualForm.notes || 'Manually recorded via console',
        fulfillment: manualForm.delivery_address ? 'Delivery' : 'Store Pickup',
        payment_status: 'pending',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          customer_number: manualForm.customer_number,
          type: manualForm.type,
          status: 'confirmed',
          details: detailsPayload,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create order');
      }

      if (resData.order) {
        setOrders((prev) => [resData.order, ...prev]);
      }

      setIsManualModalOpen(false);
      setManualForm({
        customer_number: '',
        type: category === 'salon' ? 'booking' : category === 'tuition' ? 'lead' : 'order',
        itemName: '',
        quantity: 1,
        price: 100,
        delivery_address: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Manual order creation error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Export Orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Phone', 'Type', 'Status', 'Payment Status', 'Items / Notes', 'Total (INR)'];
    const rows = orders.map((o) => {
      const details = o.details || {};
      const itemsStr = details.items
        ? details.items.map((i: any) => `${i.name} (x${i.quantity})`).join('; ')
        : details.service || details.notes || 'N/A';
      const total = details.total || details.price || 0;
      const paymentStatus = details.payment_status || (o.status === 'completed' ? 'paid' : 'pending');

      return [
        o.id,
        new Date(o.created_at).toLocaleString('en-IN'),
        `"${o.customer_number}"`,
        o.type,
        o.status,
        paymentStatus,
        `"${itemsStr.replace(/"/g, '""')}"`,
        total,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${businessName.toLowerCase().replace(/\s+/g, '_')}_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = activeFilter === 'all' ? true : order.status === activeFilter;
      const detailsStr = JSON.stringify(order.details || {}).toLowerCase();
      const matchesSearch =
        order.customer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detailsStr.includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => {
      const details = o.details || {};
      const amt = details.total || details.price || 0;
      return sum + (Number(amt) || 0);
    }, 0);

    const activeCount = orders.filter((o) => o.status === 'new' || o.status === 'confirmed').length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;
    const aov = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;

    return { totalRev, activeCount, completedCount, aov };
  }, [orders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>New</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Confirmed</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-600 bg-slate-100">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime Alert Toast */}
      {realtimeNotice && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-bounce text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{realtimeNotice}</span>
        </div>
      )}

      {/* Aggregate Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-2xl font-bold text-slate-900">₹{stats.totalRev.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-emerald-600 font-medium">From {orders.length} total orders</span>
        </div>

        {/* Active In Progress */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Active Orders</span>
            <Package className="w-4 h-4 text-amber-500" />
          </span>
          <div className="text-2xl font-bold text-slate-900">{stats.activeCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Pending fulfillment</span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </span>
          <div className="text-2xl font-bold text-slate-900">₹{stats.aov}</div>
          <span className="text-[11px] text-slate-500">Per customer order</span>
        </div>

        {/* Completed Count */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </span>
          <div className="text-2xl font-bold text-slate-900">{stats.completedCount}</div>
          <span className="text-[11px] text-slate-500">Successfully delivered</span>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 flex-shrink-0">
              {React.createElement(
                (CATEGORY_HEADER_CONFIG[category] || CATEGORY_HEADER_CONFIG.bakery).icon,
                { className: 'w-5 h-5' }
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <span>{(CATEGORY_HEADER_CONFIG[category] || CATEGORY_HEADER_CONFIG.bakery).title}</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {filteredOrders.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {(CATEGORY_HEADER_CONFIG[category] || CATEGORY_HEADER_CONFIG.bakery).subtitle}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchOrders(false)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{(CATEGORY_HEADER_CONFIG[category] || CATEGORY_HEADER_CONFIG.bakery).recordLabel}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone, item, or address..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-200/60 p-1 rounded-lg overflow-x-auto no-scrollbar">
            {['all', 'new', 'confirmed', 'completed', 'cancelled'].map((tab) => {
              const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all flex-shrink-0 whitespace-nowrap ${
                    activeFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            <LedgerRowSkeleton />
            <LedgerRowSkeleton />
            <LedgerRowSkeleton />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No transactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'Entries will appear here automatically in real-time as customers place orders on your WhatsApp AI agent.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const details = order.details || {};
              const items = details.items || [];
              const totalAmount = details.total || details.price;
              const dateFormatted = new Date(order.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={order.id} className="transition-colors hover:bg-slate-50/60">
                  {/* Ledger Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 uppercase">
                        {order.type === 'booking' ? 'BK' : order.type === 'lead' ? 'LD' : 'OR'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-semibold font-mono text-slate-900">{order.customer_number}</span>
                          {getStatusBadge(order.status)}
                          {details.payment_status === 'paid' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>UPI Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Payment Pending</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {items.length > 0
                            ? items.map((it: any) => `${it.name} (${it.quantity})`).join(', ')
                            : details.service || details.course || details.notes || 'Order logged via chat'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      {totalAmount !== undefined && (
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">₹{totalAmount}</span>
                          <span className="block text-[10px] text-slate-400">Total</span>
                        </div>
                      )}

                      <div className="text-right hidden sm:block">
                        <span className="text-xs text-slate-400">{dateFormatted}</span>
                      </div>

                      {/* PDF Invoice Button */}
                      <a
                        href={`/api/invoice/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Download / View Official PDF Invoice"
                        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-medium shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">PDF Bill</span>
                      </a>

                      <div className="p-1 rounded text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Item Details Drawer */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-200/80 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* Items Breakdown */}
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            ITEMS & SERVICES
                          </span>
                          {items.length > 0 ? (
                            <ul className="space-y-1.5">
                              {items.map((it: any, idx: number) => (
                                <li key={idx} className="flex justify-between font-medium text-slate-800">
                                  <span>
                                    {it.name} <span className="text-slate-500">x{it.quantity}</span>
                                  </span>
                                  {it.price && <span>₹{it.price * it.quantity}</span>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-700">
                              {details.service || details.course || details.notes || 'Details logged via chat'}
                            </p>
                          )}
                        </div>

                        {/* Delivery / Address */}
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            FULFILLMENT & ADDRESS
                          </span>
                          <div className="space-y-1 text-slate-700">
                            <p className="font-medium flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{details.delivery_address || details.address || 'Store Pickup / Walk-in'}</span>
                            </p>
                            {details.notes && (
                              <p className="text-[11px] text-slate-500 italic">"{details.notes}"</p>
                            )}
                          </div>
                        </div>

                        {/* Payment Verification Controls */}
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            PAYMENT STATUS
                          </span>

                          {details.payment_status === 'paid' ? (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md space-y-1">
                              <div className="flex items-center space-x-1.5 font-semibold text-xs text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Payment Verified</span>
                              </div>
                              <p className="text-[11px] text-emerald-700">
                                {details.paid_at ? new Date(details.paid_at).toLocaleString('en-IN') : 'Settled via UPI'}
                              </p>
                              <button
                                type="button"
                                onClick={() => handlePaymentStatusChange(order.id, 'pending')}
                                className="text-[11px] text-red-600 hover:underline pt-1 block font-medium"
                              >
                                Mark as Unpaid
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                                <p className="text-[11px] font-medium">Awaiting customer payment via UPI</p>
                              </div>
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                                className="w-full py-1.5 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Paid via UPI</span>
                              </button>
                              <span className="text-[10px] text-slate-400 block text-center">
                                Sends receipt notification to WhatsApp
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Fulfillment Controls */}
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            ORDER FULFILLMENT
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['new', 'confirmed', 'completed', 'cancelled'] as OrderStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                disabled={updatingId === order.id || order.status === st}
                                className={`px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                                  order.status === st
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                                } disabled:opacity-50`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <label className="flex items-center space-x-2 pt-1 text-xs text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifyCustomerOnStatus}
                              onChange={(e) => setNotifyCustomerOnStatus(e.target.checked)}
                              className="rounded text-slate-900 focus:ring-0"
                            />
                            <span>Send WhatsApp update</span>
                          </label>
                        </div>
                      </div>

                      {/* Quick Action Footer: PDF Bill & Smart Re-Engagement Nudge */}
                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={`/api/invoice/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-sm transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Official PDF Bill</span>
                        </a>

                        <button
                          type="button"
                          disabled={sendingReminder === order.customer_number}
                          onClick={() => handleSendReEngagementNudge(order.customer_number, items[0]?.name || details.service)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {sendingReminder === order.customer_number
                              ? 'Sending...'
                              : category === 'real_estate'
                              ? 'Send WhatsApp Site Visit / Property Nudge'
                              : category === 'clinic'
                              ? 'Send WhatsApp Health Checkup Reminder'
                              : category === 'gym'
                              ? 'Send WhatsApp Membership Renewal Nudge'
                              : category === 'salon'
                              ? 'Send WhatsApp Grooming Refresh Nudge'
                              : category === 'tuition'
                              ? 'Send WhatsApp Batch & Admission Update'
                              : category === 'retail'
                              ? 'Send WhatsApp New Collection Nudge'
                              : category === 'cafe'
                              ? 'Send WhatsApp Special Menu Nudge'
                              : category === 'bakery'
                              ? 'Send WhatsApp Fresh Treat Nudge'
                              : 'Send WhatsApp Re-Engagement Nudge'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Order Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>
                  Record {(CATEGORY_HEADER_CONFIG[category] || CATEGORY_HEADER_CONFIG.bakery).recordLabel.replace('Record ', '')}
                </span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={manualForm.customer_number}
                  onChange={(e) => setManualForm({ ...manualForm, customer_number: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {category === 'salon' || category === 'clinic'
                      ? 'Service / Doctor Name *'
                      : category === 'real_estate'
                      ? 'Property / Unit Name *'
                      : category === 'tuition'
                      ? 'Course / Class Name *'
                      : category === 'gym'
                      ? 'Plan / Pass Name *'
                      : 'Item / Product Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      category === 'salon'
                        ? 'e.g. Haircut & Styling'
                        : category === 'clinic'
                        ? 'e.g. General Consultation OPD'
                        : category === 'real_estate'
                        ? 'e.g. 2 BHK Luxury Flat Visit'
                        : category === 'gym'
                        ? 'e.g. Monthly Standard Pass'
                        : category === 'tuition'
                        ? 'e.g. Class 10 Math Admission'
                        : category === 'retail'
                        ? 'e.g. Silk Kurti (M)'
                        : 'e.g. 1kg Truffle Cake'
                    }
                    value={manualForm.itemName}
                    onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unit Price (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Calculated Total
                  </label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900">
                    ₹{manualForm.price * manualForm.quantity}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Delivery Address / Table No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 302, Green Valley or Store Counter"
                  value={manualForm.delivery_address}
                  onChange={(e) => setManualForm({ ...manualForm, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {creatingOrder ? 'Recording...' : 'Record Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
