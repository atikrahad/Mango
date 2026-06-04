import { useToastStore } from './toastStore';

export function useAdminActions(api: any, fetchAdminData: () => void, userFullName?: string) {
  const updateOrderStatus = async (orderId: string, status: string, deliveryAgentId?: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/status`, {
        status,
        deliveryAgentId: deliveryAgentId || undefined,
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

  return { updateOrderStatus, processWithdrawal };
}
