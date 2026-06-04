import { useToastStore } from './toastStore';

export function useAdminActions(api: any, fetchAdminData: () => void, userFullName?: string) {
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/status`, {
        status,
      });

      if (res.data?.success) {
        useToastStore.getState().showToast(`Order status updated successfully to ${status}!`, 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to update order.';
      useToastStore.getState().showToast(msg, 'error');
    }
  };

  const processWithdrawal = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/affiliates/admin/withdrawals/${requestId}`, {
        status,
        notes: `Processed and cleared by operations manager: ${userFullName || 'Admin'}`,
      });

      if (res.data?.success) {
        useToastStore.getState().showToast(`Withdrawal payout request marked as ${status}!`, 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to settle payout request.';
      useToastStore.getState().showToast(msg, 'error');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this order? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await api.delete(`/orders/admin/${orderId}`);
      if (res.data?.success) {
        useToastStore.getState().showToast('Order permanently deleted successfully.', 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to delete order.';
      useToastStore.getState().showToast(msg, 'error');
    }
  };

  return { updateOrderStatus, processWithdrawal, deleteOrder };
}
