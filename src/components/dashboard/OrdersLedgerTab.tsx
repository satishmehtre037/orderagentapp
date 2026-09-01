'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { OrderBookingLead, OrderStatus, BusinessCategory } from '../../types';
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
  Phone,
  MapPin,
  FileText,
  CreditCard,
  BellRing,
  RefreshCw,
} from 'lucide-react';
import { getCategoryReminderMessage, resolveCategoryFromNameOrType } from '../../lib/constants/categoryPresets';
import { useToast } from '../ui/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  StatusBadge,
  Modal,
  Input,
  Label,
  LedgerRowSkeleton,
} from '../ui';

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
  hospital: {
    title: 'Hospital OPD & Inpatient Management',
    subtitle: 'OPD tokens, inpatient admissions, surgeries & discharge summaries captured by AI',
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
    recordLabel: 'Record Visit',
  },
  ca_firm: {
    title: 'Tax Filings, Compliance & Consultations',
    subtitle: 'GST, ITR filings, notice replies & client engagements captured by AI',
    icon: Building2,
    recordLabel: 'Record Filing',
  },
  custom: {
    title: 'Customer Orders & Inquiries',
    subtitle: 'All customer leads, orders & appointments captured by AI',
    icon: ShoppingBag,
    recordLabel: 'Record Entry',
  },
};

export const OrdersLedgerTab: React.FC<OrdersLedgerTabProps> = ({
  businessId,
  category = 'bakery',
  businessName = 'My Business',
}) => {
  const [orders, setOrders] = useState<OrderBookingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notifyCustomerOnStatus, setNotifyCustomerOnStatus] = useState(true);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const [manualForm, setManualForm] = useState({
    customer_number: '',
    itemName: '',
    quantity: 1,
    price: 500,
    delivery_address: '',
  });

  const { showToast } = useToast();
  const effectiveCategory = resolveCategoryFromNameOrType(category, businessName);

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
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);

    // 1. Fast, silent background polling every 3 seconds for instant zero-lag updates
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 3000);

    // 2. Instant refetch when the merchant switches back to the Dashboard tab/window
    const handleFocus = () => {
      fetchOrders(true);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    });

    // 3. Supabase Realtime WebSocket listener
    let channel: any = null;
    if (businessId) {
      channel = supabaseClient
        .channel(`orders_realtime_${businessId}`)
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
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === newOrder.id);
                return exists ? prev : [newOrder, ...prev];
              });
              setRealtimeNotice(`🔔 New entry recorded from ${newOrder.customer_number}`);
              setTimeout(() => setRealtimeNotice(null), 5000);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as OrderBookingLead;
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            } else if (payload.eventType === 'DELETE') {
              setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [businessId]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          notifyCustomer: notifyCustomerOnStatus,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        showToast({
          title: `Status: ${newStatus.toUpperCase()}`,
          message: notifyCustomerOnStatus
            ? 'Updated and dispatched WhatsApp confirmation to customer.'
            : 'Updated status locally.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: 'paid' | 'pending') => {
    try {
      setUpdatingId(orderId);
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      const currentDetails = targetOrder.details || {};
      const updatedDetails = {
        ...currentDetails,
        payment_status: newPaymentStatus,
        paid_at: newPaymentStatus === 'paid' ? new Date().toISOString() : null,
      };

      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: targetOrder.status,
          details: updatedDetails,
          notifyCustomer: true,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, details: updatedDetails } : o))
        );
        showToast({
          title: newPaymentStatus === 'paid' ? 'Payment Verified (Paid)' : 'Payment Marked Pending',
          message: newPaymentStatus === 'paid'
            ? 'Order marked as Paid via UPI. WhatsApp receipt dispatched.'
            : 'Payment status updated.',
          type: 'whatsapp',
        });
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReEngagementNudge = async (customerNumber: string, lastItemOrService?: string) => {
    try {
      setSendingReminder(customerNumber);
      const customMessage = getCategoryReminderMessage(
        effectiveCategory,
        businessName,
        lastItemOrService || 'your favorite items'
      );

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          to: customerNumber,
          message: customMessage,
          source: 'reengagement_nudge',
        }),
      });

      if (res.ok) {
        showToast({
          title: 'WhatsApp Nudge Dispatched!',
          message: `Special reminder sent to ${customerNumber}.`,
          type: 'whatsapp',
        });
      }
    } catch (err) {
      console.error('Failed to send nudge:', err);
    } finally {
      setSendingReminder(null);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customer_number || !manualForm.itemName) return;

    try {
      setCreatingOrder(true);
      const rawPhone = manualForm.customer_number.replace(/\D/g, '');
      const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

      const orderPayload = {
        business_id: businessId,
        customer_number: formattedPhone,
        type: 'order',
        status: 'new',
        details: {
          items: [
            {
              name: manualForm.itemName,
              quantity: manualForm.quantity,
              price: manualForm.price,
            },
          ],
          total: manualForm.price * manualForm.quantity,
          delivery_address: manualForm.delivery_address || 'In-Store Pickup',
          payment_status: 'pending',
          source: 'manual_dashboard_entry',
        },
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        setIsManualModalOpen(false);
        setManualForm({
          customer_number: '',
          itemName: '',
          quantity: 1,
          price: 500,
          delivery_address: '',
        });
        showToast({
          title: 'Order Recorded!',
          message: 'Entry created and customer notified via WhatsApp.',
          type: 'whatsapp',
        });
        fetchOrders(true);
      }
    } catch (err: any) {
      console.error('Manual order creation error:', err);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast({ title: 'Empty Ledger', message: 'No transactions found to export.', type: 'info' });
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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Realtime Alert Toast */}
      {realtimeNotice && (
        <div className="fixed bottom-6 right-6 bg-surface text-fg px-4 py-3 rounded-lg shadow-xl border border-line flex items-center gap-2.5 z-50 animate-bounce text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>{realtimeNotice}</span>
        </div>
      )}

      {/* Aggregate Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={effectiveCategory === 'ca_firm' ? 'Total Fee Invoiced' : 'Total Revenue'}
          value={`₹${stats.totalRev.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="text-success" />}
          hint={`From ${orders.length} total entries`}
        />
        <StatCard
          label="Active / In Progress"
          value={stats.activeCount}
          deltaTone="neutral"
          icon={<Package className="text-warning" />}
          hint="Pending fulfillment"
        />
        <StatCard
          label={effectiveCategory === 'ca_firm' ? 'Avg Client Fee' : 'Avg Order Value'}
          value={`₹${stats.aov}`}
          icon={<TrendingUp className="text-accent" />}
          hint="Per customer transaction"
        />
        <StatCard
          label="Completed"
          value={stats.completedCount}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Successfully delivered"
        />
      </div>

      {/* Main Ledger Card */}
      <Card>
        {/* Header Toolbar */}
        <CardHeader className="flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-subtle border border-line rounded-lg text-fg shrink-0">
              {React.createElement(
                (CATEGORY_HEADER_CONFIG[effectiveCategory] || CATEGORY_HEADER_CONFIG.bakery).icon,
                { className: 'w-5 h-5' }
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>{(CATEGORY_HEADER_CONFIG[effectiveCategory] || CATEGORY_HEADER_CONFIG.bakery).title}</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-surface-subtle border border-line text-fg-muted rounded-full">
                  {filteredOrders.length}
                </span>
              </CardTitle>
              <CardDescription>
                {(CATEGORY_HEADER_CONFIG[effectiveCategory] || CATEGORY_HEADER_CONFIG.bakery).subtitle}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOrders(false)}
              disabled={isRefreshing || loading}
              title="Refresh Orders"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {(CATEGORY_HEADER_CONFIG[effectiveCategory] || CATEGORY_HEADER_CONFIG.bakery).recordLabel}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>

        {/* Filter Toolbar & Search */}
        <div className="p-3.5 bg-surface-subtle border-y border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone, item, address..."
              className="w-full pl-8"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['all', 'new', 'confirmed', 'completed', 'cancelled'].map((tab) => {
              const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                    activeFilter === tab
                      ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                      : 'text-fg-muted hover:text-fg hover:bg-surface'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Rows Content */}
        {loading ? (
          <div className="p-6 space-y-3">
            <LedgerRowSkeleton />
            <LedgerRowSkeleton />
            <LedgerRowSkeleton />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-subtle border border-line flex items-center justify-center mx-auto text-fg-muted">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-fg">No transactions found</h3>
            <p className="text-xs text-fg-muted max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'Entries will appear here automatically in real-time as customers interact with your WhatsApp AI agent.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
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
                <div key={order.id} className="transition-colors hover:bg-surface-hover">
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-surface-subtle border border-line flex items-center justify-center text-fg-muted font-bold text-xs shrink-0">
                        #{order.id.slice(-4).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-fg font-mono">
                            {order.customer_number}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="text-xs text-fg-muted mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{dateFormatted}</span>
                          <span>•</span>
                          <span className="text-fg font-medium">
                            {items.length > 0
                              ? items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')
                              : details.service || details.notes || 'Inquiry / Custom Request'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {totalAmount && (
                        <div className="text-right">
                          <span className="text-sm font-bold text-fg font-mono">
                            ₹{Number(totalAmount).toLocaleString('en-IN')}
                          </span>
                          <div className="text-[10px] text-fg-muted">
                            {details.payment_status === 'paid' ? (
                              <span className="text-success font-semibold">✓ Paid</span>
                            ) : (
                              <span className="text-warning">Pending UPI</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-fg-muted">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 bg-surface-subtle border-t border-line space-y-4 text-xs animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Address & Notes */}
                        <div className="p-3 bg-surface rounded-md border border-line space-y-1">
                          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">
                            Fulfillment & Address
                          </span>
                          <p className="font-medium text-fg flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-fg-muted shrink-0" />
                            <span>{details.delivery_address || details.address || 'Store Pickup / Counter'}</span>
                          </p>
                          {details.notes && (
                            <p className="text-[11px] text-fg-muted italic">"{details.notes}"</p>
                          )}
                        </div>

                        {/* Payment Verification */}
                        <div className="p-3 bg-surface rounded-md border border-line space-y-2">
                          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">
                            Payment Verification
                          </span>
                          {details.payment_status === 'paid' ? (
                            <div className="p-2 bg-success-subtle border border-success-border rounded text-success space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verified Paid via UPI</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePaymentStatusChange(order.id, 'pending')}
                                className="text-[10px] text-danger hover:underline font-medium block"
                              >
                                Mark as Unpaid
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="xs"
                              fullWidth
                              disabled={updatingId === order.id}
                              onClick={() => handlePaymentStatusChange(order.id, 'paid')}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Mark Paid via UPI
                            </Button>
                          )}
                        </div>

                        {/* Status Fulfillment */}
                        <div className="p-3 bg-surface rounded-md border border-line space-y-2">
                          <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider block">
                            Status Fulfillment
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['new', 'confirmed', 'completed', 'cancelled'] as OrderStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(order.id, st)}
                                disabled={updatingId === order.id || order.status === st}
                                className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${
                                  order.status === st
                                    ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                                    : 'bg-surface-subtle border border-line text-fg hover:bg-surface-hover'
                                } disabled:opacity-50`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
                        <a
                          href={`/api/invoice/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line text-fg hover:bg-surface-hover text-xs font-medium transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-fg-muted" />
                          <span>View Official PDF Bill</span>
                        </a>

                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={sendingReminder === order.customer_number}
                          onClick={() => handleSendReEngagementNudge(order.customer_number, items[0]?.name || details.service)}
                          leftIcon={<BellRing className="w-3.5 h-3.5 text-accent" />}
                        >
                          {sendingReminder === order.customer_number ? 'Sending...' : 'Send WhatsApp Re-Engagement Nudge'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Manual Order Creation Modal */}
      <Modal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={`Record ${(CATEGORY_HEADER_CONFIG[effectiveCategory] || CATEGORY_HEADER_CONFIG.bakery).recordLabel.replace('Record ', '')}`}
        description="Manually record customer order or appointment and dispatch WhatsApp confirmation"
        icon={<Plus className="text-accent" />}
        size="md"
        mobile="sheet"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsManualModalOpen(false)} disabled={creatingOrder}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateManualOrder}
              loading={creatingOrder}
            >
              Save & Send WhatsApp
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
          <div>
            <Label className="mb-1 block">Customer WhatsApp Number *</Label>
            <Input
              required
              placeholder="+91 9876543210"
              value={manualForm.customer_number}
              onChange={(e) => setManualForm({ ...manualForm, customer_number: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Item / Service Name *</Label>
              <Input
                required
                placeholder="e.g. Fresh Truffle Cake"
                value={manualForm.itemName}
                onChange={(e) => setManualForm({ ...manualForm, itemName: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={manualForm.quantity}
                onChange={(e) => setManualForm({ ...manualForm, quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Unit Price (INR)</Label>
              <Input
                type="number"
                min={0}
                value={manualForm.price}
                onChange={(e) => setManualForm({ ...manualForm, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Calculated Total</Label>
              <div className="px-3 py-2 bg-surface-subtle border border-line rounded-md font-semibold text-fg font-mono">
                ₹{manualForm.price * manualForm.quantity}
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Delivery Address / Counter (Optional)</Label>
            <Input
              placeholder="e.g. Flat 302, Green Valley or In-Store Pickup"
              value={manualForm.delivery_address}
              onChange={(e) => setManualForm({ ...manualForm, delivery_address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
