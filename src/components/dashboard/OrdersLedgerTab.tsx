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
  ChevronDown,
  ChevronUp,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Filter,
  Download,
  Search,
  Plus,
  IndianRupee,
  TrendingUp,
  Package,
  Calendar,
  Send,
  X,
  Phone,
  MapPin,
  FileText,
  QrCode,
  CreditCard,
} from 'lucide-react';

interface OrdersLedgerTabProps {
  businessId: string;
  category: BusinessCategory;
  businessName?: string;
}

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

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();

      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up Supabase Realtime subscription for live incoming orders
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
            const newRecord = payload.new as OrderBookingLead;
            setOrders((prev) => [newRecord, ...prev]);
            setRealtimeNotice(`New ${newRecord.type} received from ${newRecord.customer_number}!`);
            setTimeout(() => setRealtimeNotice(null), 5000);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as OrderBookingLead;
            setOrders((prev) =>
              prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [businessId]);

  // Update status via server API
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
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

      if (res.ok) {
        setOrders((prev) =>
          prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // 1-Tap Mark as Paid via UPI & WhatsApp confirmation
  const handlePaymentStatusChange = async (orderId: string, paymentStatus: 'paid' | 'pending') => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          payment_status: paymentStatus,
          notifyCustomer: true,
          businessName,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((item) => {
            if (item.id === orderId) {
              const updatedDetails = {
                ...(item.details || {}),
                payment_status: paymentStatus,
                paid_at: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
              };
              return { ...item, details: updatedDetails };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    } finally {
      setUpdatingId(null);
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
        fulfillment: manualForm.delivery_address ? 'delivery' : 'store',
        delivery_address: manualForm.delivery_address || 'In-store / Walk-in',
        notes: manualForm.notes || 'Recorded manually via dashboard',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          type: manualForm.type,
          customer_number: manualForm.customer_number,
          details: detailsPayload,
          status: 'confirmed',
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => [data.order, ...prev]);
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
      }
    } catch (err: any) {
      alert(`Error creating order: ${err.message}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Analytics Calculations
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => {
      const amt = Number(o.details?.total || o.details?.price || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const activeCount = orders.filter((o) => o.status === 'new' || o.status === 'confirmed').length;
    const completedCount = orders.filter((o) => o.status === 'completed').length;
    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    return { totalRevenue, activeCount, completedCount, aov };
  }, [orders]);

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const phoneMatch = o.customer_number?.toLowerCase().includes(query);
      const itemsMatch = JSON.stringify(o.details || {}).toLowerCase().includes(query);
      return phoneMatch || itemsMatch;
    });
  }, [orders, activeFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = ['Order ID', 'Type', 'Customer Phone', 'Items / Services', 'Total (₹)', 'Address', 'Status', 'Date Time'];
    const rows = filteredOrders.map((o) => {
      const itemsStr =
        o.details?.items?.map((it: any) => `${it.name} (x${it.quantity})`).join('; ') ||
        o.details?.service ||
        o.details?.course ||
        'N/A';
      const totalStr = o.details?.total || o.details?.price || 0;
      const addressStr = `"${(o.details?.delivery_address || o.details?.address || 'N/A').replace(/"/g, '""')}"`;
      const dateStr = new Date(o.created_at).toLocaleString();

      return [o.id, o.type, o.customer_number, `"${itemsStr}"`, totalStr, addressStr, o.status, `"${dateStr}"`];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BizBot_Orders_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <Clock className="w-3 h-3 mr-1 text-amber-600" /> New
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-blue-50 text-blue-700 border border-blue-300">
            <UserCheck className="w-3 h-3 mr-1 text-blue-600" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase font-bold bg-red-50 text-red-700 border border-red-300">
            <XCircle className="w-3 h-3 mr-1 text-red-600" /> Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime Toast Notice */}
      {realtimeNotice && (
        <div className="p-3 bg-teal-light border border-teal text-teal text-xs font-semibold rounded-md shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-marigold fill-marigold" />
            <span>{realtimeNotice}</span>
          </div>
          <button onClick={() => setRealtimeNotice(null)} className="text-teal hover:underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-paper border border-warm-border p-4 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider flex items-center justify-between">
            <span>TOTAL REVENUE</span>
            <IndianRupee className="w-3.5 h-3.5 text-teal" />
          </span>
          <div className="text-2xl font-mono font-bold text-teal">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-ink-muted">From confirmed & completed sales</span>
        </div>

        {/* Active Orders */}
        <div className="bg-paper border border-warm-border p-4 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider flex items-center justify-between">
            <span>ACTIVE ORDERS</span>
            <Package className="w-3.5 h-3.5 text-amber-600" />
          </span>
          <div className="text-2xl font-mono font-bold text-ink">{stats.activeCount}</div>
          <span className="text-[10px] text-amber-700 font-medium">Pending fulfillment</span>
        </div>

        {/* Average Order Value */}
        <div className="bg-paper border border-warm-border p-4 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider flex items-center justify-between">
            <span>AVG ORDER VALUE</span>
            <TrendingUp className="w-3.5 h-3.5 text-sage" />
          </span>
          <div className="text-2xl font-mono font-bold text-ink">₹{stats.aov}</div>
          <span className="text-[10px] text-ink-muted">Per customer transaction</span>
        </div>

        {/* Completed */}
        <div className="bg-paper border border-warm-border p-4 rounded-lg shadow-sm space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider flex items-center justify-between">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-700">{stats.completedCount}</div>
          <span className="text-[10px] text-ink-muted">Successfully fulfilled</span>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        {/* Passbook Stub Header & Toolbar */}
        <div className="bg-warm-stub px-4 sm:px-6 py-4 border-b border-warm-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-paper rounded border border-warm-border">
              {category === 'bakery' ? (
                <ShoppingBag className="w-5 h-5 text-teal" />
              ) : category === 'cafe' ? (
                <Coffee className="w-5 h-5 text-teal" />
              ) : category === 'salon' ? (
                <Scissors className="w-5 h-5 text-teal" />
              ) : category === 'gym' ? (
                <Dumbbell className="w-5 h-5 text-teal" />
              ) : (
                <GraduationCap className="w-5 h-5 text-teal" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink flex items-center space-x-2">
                <span>
                  {category === 'bakery'
                    ? 'Bakery Orders Ledger'
                    : category === 'cafe'
                    ? 'Cafe Orders & Reservations'
                    : category === 'salon'
                    ? 'Salon Appointments & Bookings'
                    : category === 'gym'
                    ? 'Gym Memberships & Trial Passes'
                    : 'Tuition Admissions & Student Leads'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 bg-teal-light text-teal rounded-full font-semibold">
                  {filteredOrders.length}
                </span>
              </h2>
              <p className="text-xs text-ink-muted">Live structured commerce transactions captured by your AI agent</p>
            </div>
          </div>

          {/* Action CTAs: Manual Order & Export CSV */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-teal text-white text-xs font-serif font-bold shadow-sm hover:bg-teal-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-marigold" />
              <span>+ Record Order</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-paper border border-warm-border text-ink text-xs font-mono font-medium hover:bg-warm-card shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-ink-light" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="p-4 bg-warm-card/40 border-b border-warm-border flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-light absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone, items, address..."
              className="w-full pl-9 pr-3 py-1.5 bg-paper border border-warm-border rounded text-xs focus:border-teal"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {['all', 'new', 'confirmed', 'completed', 'cancelled'].map((tab) => {
              const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                    activeFilter === tab
                      ? 'bg-teal text-paper font-bold shadow-sm'
                      : 'bg-paper text-ink-light hover:text-ink border border-warm-border'
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
            <div className="w-12 h-12 rounded-full bg-warm-card border border-warm-border flex items-center justify-center mx-auto text-ink-light">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-ink">No orders found</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'They will appear here automatically as structured ledger entries once customers interact with your WhatsApp AI agent.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-border">
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
                <div key={order.id} className="transition-colors hover:bg-warm-card/30">
                  {/* Ledger Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded bg-warm-stub border border-warm-border flex items-center justify-center font-mono font-bold text-xs text-teal">
                        {order.type === 'booking' ? 'BK' : order.type === 'lead' ? 'LD' : 'OR'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-bold text-ink">{order.customer_number}</span>
                          {getStatusBadge(order.status)}
                          {details.payment_status === 'paid' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>UPI Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Payment Pending</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                          {items.length > 0
                            ? items.map((it: any) => `${it.name} (${it.quantity})`).join(', ')
                            : details.service || details.course || details.notes || 'Order received'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      {totalAmount !== undefined && (
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold text-teal">₹{totalAmount}</span>
                          <span className="block text-[10px] text-ink-light">Total Amount</span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="font-mono text-xs text-ink-light">{dateFormatted}</span>
                      </div>

                      <div className="p-1 rounded bg-warm-card text-ink-light">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Ledger Item Details Drawer */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 bg-warm-card border-t border-dashed border-warm-border space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* Items Breakdown */}
                        <div className="p-3.5 bg-paper rounded border border-warm-border space-y-2">
                          <span className="text-[10px] font-mono text-ink-light uppercase block font-semibold">
                            ITEMS / SERVICES
                          </span>
                          {items.length > 0 ? (
                            <ul className="space-y-1">
                              {items.map((it: any, idx: number) => (
                                <li key={idx} className="flex justify-between font-mono">
                                  <span>
                                    {it.name} <strong className="text-teal">x{it.quantity}</strong>
                                  </span>
                                  {it.price && <span>₹{it.price * it.quantity}</span>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="font-mono text-ink">
                              {details.service || details.course || details.notes || 'Details logged via chat'}
                            </p>
                          )}
                        </div>

                        {/* Delivery / Address */}
                        <div className="p-3.5 bg-paper rounded border border-warm-border space-y-2">
                          <span className="text-[10px] font-mono text-ink-light uppercase block font-semibold">
                            FULFILLMENT & ADDRESS
                          </span>
                          <div className="space-y-1">
                            <p className="font-mono font-medium text-ink flex items-start space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                              <span>{details.delivery_address || details.address || 'In-store pickup / walk-in'}</span>
                            </p>
                            {details.notes && (
                              <p className="text-[11px] text-ink-muted italic">Note: {details.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* UPI Payment Verification */}
                        <div className="p-3.5 bg-paper rounded border border-warm-border space-y-2">
                          <span className="text-[10px] font-mono text-ink-light uppercase block font-semibold">
                            UPI PAYMENT STATUS
                          </span>
                          {details.payment_status === 'paid' ? (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 space-y-1">
                              <div className="flex items-center space-x-1.5 font-bold text-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Payment Verified</span>
                              </div>
                              <p className="text-[10px] text-emerald-700 font-mono">
                                {details.paid_at ? new Date(details.paid_at).toLocaleString() : 'Marked Paid'}
                              </p>
                              <button
                                type="button"
                                onClick={() => handlePaymentStatusChange(order.id, 'pending')}
                                className="text-[10px] text-red-600 hover:underline pt-1 block"
                              >
                                Mark as Unpaid
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                                <p className="text-[10px] font-medium">Awaiting customer payment via UPI</p>
                              </div>
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                                className="w-full py-1.5 px-2 rounded bg-emerald-600 text-white font-serif font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Paid via UPI</span>
                              </button>
                              <span className="text-[9px] text-ink-muted block text-center">
                                Sends receipt notification to WhatsApp
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Controls */}
                        <div className="p-3.5 bg-paper rounded border border-warm-border space-y-2">
                          <span className="text-[10px] font-mono text-ink-light uppercase block font-semibold">
                            ORDER FULFILLMENT
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['new', 'confirmed', 'completed', 'cancelled'] as OrderStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                disabled={updatingId === order.id || order.status === st}
                                className={`px-2 py-1.5 rounded text-[11px] font-mono uppercase font-bold transition-all ${
                                  order.status === st
                                    ? 'bg-teal text-white shadow-sm'
                                    : 'bg-warm-card border border-warm-border text-ink hover:bg-warm-stub'
                                } disabled:opacity-50`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <label className="flex items-center space-x-2 pt-1 text-[11px] text-ink-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifyCustomerOnStatus}
                              onChange={(e) => setNotifyCustomerOnStatus(e.target.checked)}
                              className="rounded text-teal focus:ring-0"
                            />
                            <span>Send WhatsApp update</span>
                          </label>
                        </div>
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
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-paper border-2 border-warm-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-warm-stub px-6 py-4 border-b border-warm-border flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-ink flex items-center space-x-2">
                <Plus className="w-4 h-4 text-teal" />
                <span>Record Walk-in / Phone Order</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded text-ink-light hover:text-ink hover:bg-warm-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">
                  Customer Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={manualForm.customer_number}
                  onChange={(e) => setManualForm({ ...manualForm, customer_number: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-warm-border rounded font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">Item / Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Velvet Pastry"
                    value={manualForm.itemName}
                    onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
                    className="w-full px-3 py-2 bg-paper border border-warm-border rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm({ ...manualForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-paper border border-warm-border rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">Price per unit (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-paper border border-warm-border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">Total (₹)</label>
                  <div className="px-3 py-2 bg-warm-card border border-warm-border rounded font-mono font-bold text-teal">
                    ₹{manualForm.price * manualForm.quantity}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">
                  Delivery Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 301, Palm Street or In-store"
                  value={manualForm.delivery_address}
                  onChange={(e) => setManualForm({ ...manualForm, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-ink-light uppercase mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="Special instructions..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div className="pt-3 border-t border-warm-border flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded bg-warm-card text-ink font-mono text-xs hover:bg-warm-stub"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-4 py-2 rounded bg-teal text-white font-serif font-bold text-xs hover:bg-teal-hover shadow-sm disabled:opacity-50"
                >
                  {creatingOrder ? 'Recording...' : 'Record Order to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
