import { useState } from 'react';
import { useToastStore } from './toastStore';

export function useAffiliate(api: any, origin: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState('BKASH');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchAffiliateProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/affiliates/me');
      if (res.data?.success) {
        setProfile(res.data.data);
        if (res.data.data?.referralCode) {
          setGeneratedLink(`${origin}/?ref=${res.data.data.referralCode}`);
        }
      }
    } catch (e: any) {
      console.error('Error fetching affiliate profile:', e);
      useToastStore.getState().showToast('Could not fetch active affiliate performance wallet details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (
    onSuccess?: () => void
  ) => {
    const amt = Number(withdrawAmount);
    if (amt < 500) {
      useToastStore.getState().showToast('Minimum withdrawal payout threshold is 500 BDT.', 'error');
      return;
    }

    if (amt > Number(profile?.walletBalance || 0)) {
      useToastStore.getState().showToast('Withdrawal amount exceeds your active wallet balance.', 'error');
      return;
    }

    if (!withdrawDetails) {
      useToastStore.getState().showToast('Please specify withdrawal payment account details.', 'error');
      return;
    }

    try {
      setWithdrawLoading(true);
      const res = await api.post('/affiliates/withdrawals', {
        amount: amt,
        method: withdrawMethod,
        paymentDetails: withdrawDetails,
      });

      if (res.data?.success) {
        useToastStore.getState().showToast(res.data.message || 'Withdrawal request submitted successfully!', 'success');
        setWithdrawDetails('');
        setWithdrawAmount('500');
        await fetchAffiliateProfile();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Could not register payout request.';
      useToastStore.getState().showToast(msg, 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    useToastStore.getState().showToast('Referral link copied to clipboard successfully!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return {
    profile, setProfile,
    loading, setLoading,
    withdrawAmount, setWithdrawAmount,
    withdrawMethod, setWithdrawMethod,
    withdrawDetails, setWithdrawDetails,
    withdrawLoading, setWithdrawLoading,
    generatedLink, setGeneratedLink,
    linkCopied, setLinkCopied,
    fetchAffiliateProfile,
    handleWithdrawSubmit,
    copyToClipboard,
  };
}
