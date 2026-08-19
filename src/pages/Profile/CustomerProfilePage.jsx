import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import VerifyEmailModal from './VerifyEmailModal';
import OrderCard from './OrderCard';
import { 
  User, Package, Lock, Star, AlertCircle, CheckCircle, 
  RefreshCw, X, Mail 
} from 'lucide-react';

/* ============================================================================
 * 1. Modals
 * ============================================================================ */

// نافذة تقييم المنتج/الطلب
const ReviewModal = ({ isOpen, onClose, onSubmit, targetItem }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ 
      orderId: targetItem?.orderId, 
      productId: targetItem?.productId || targetItem?.id, 
      rating, 
      comment 
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-right">تقييم المنتج</h3>
        {targetItem?.productName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-right mb-4">
            المنتج: <span className="font-semibold text-gray-700 dark:text-gray-200">{targetItem.productName}</span>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التقييم</label>
            <div className="flex justify-center gap-2 dir-ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} 
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التعليق</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right"
              placeholder="اكتب انطباعك عن المنتج..."
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              إرسال التقييم
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// نافذة تغيير كلمة المرور
const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const success = await onSubmit(passwords);
    setIsSubmitting(false);
    if (success) {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-right">تغيير كلمة المرور</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              تحديث كلمة المرور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. Main Profile Component
 * ============================================================================ */

const Profile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // بيانات حساب المستخدم
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    governorate: '',
    address: '',
  });

  // حالات الطلبات
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);

  // حالات الواجهة والتحديثات
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  // Modals States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  
  // Verify Email Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const messageTimerRef = useRef(null);

  const showMessage = (type, text) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage({ type, text });
    messageTimerRef.current = setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  // جلب بيانات الحساب
  useEffect(() => {
    const controller = new AbortController();

    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get('/Auth/profile', {
          signal: controller.signal,
        });
        if (response.data) {
          const profileData = {
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            governorate: response.data.governorate || '',
            address: response.data.address || '',
          };
          setUser(profileData);
          setAuthUser((prev) => ({ ...prev, ...profileData }));
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          if (authUser) {
            setUser({
              fullName: authUser.fullName || '',
              email: authUser.email || '',
              phone: authUser.phone || '',
              governorate: authUser.governorate || '',
              address: authUser.address || '',
            });
          }
        }
      }
    };

    fetchUserProfile();
    return () => controller.abort();
  }, [setAuthUser]);

  // جلب قائمة الطلبات
  const fetchCustomerOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const response = await axiosInstance.get('/Orders/my-orders');
      setOrders(response.data || []);
    } catch (err) {
      showMessage('error', 'فشل في جلب قائمة الطلبات');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchCustomerOrders();
    }
  }, [activeTab, fetchCustomerOrders]);

  // تحديث بيانات الحساب
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const emailChanged = user.email.trim().toLowerCase() !== (authUser.email || '').trim().toLowerCase();

    const payload = {
      fullName: user.fullName ? user.fullName.trim() : '',
      phone: user.phone ? user.phone.trim() : '',
      governorate: user.governorate ? user.governorate.trim() : '',
      address: user.address ? user.address.trim() : '',
      email: user.email ? user.email.trim() : '',
    };

    try {
      const response = await axiosInstance.put('/Auth/update-profile', payload);

      if (emailChanged) {
        setPendingEmail(user.email.trim());
        setIsVerifyModalOpen(true);
        showMessage('success', 'تم حفظ البيانات، يرجى إدخال كود التحقق لتأكيد البريد جديد.');
      } else {
        const updatedUser = { ...authUser, ...payload };
        setAuthUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showMessage('success', 'تم تحديث البيانات بنجاح');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'حدث خطأ أثناء تحديث البيانات';
      showMessage('error', errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  // التأكيد بعد إدخال كود البريد الجديد
  const handleEmailVerified = (newEmail, newToken) => {
    const updatedUser = { ...authUser, ...user, email: newEmail };
    setUser(updatedUser);
    setAuthUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    setIsVerifyModalOpen(false);
    showMessage('success', 'تم تأكيد البريد الإلكتروني وتحديث بياناتك بنجاح!');
  };

  // تغيير كلمة المرور
  const handleChangePassword = async (passwordData) => {
    try {
      await axiosInstance.post('/Auth/change-password', {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showMessage('success', 'تم تغيير كلمة المرور بنجاح');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'فشل في تغيير كلمة المرور';
      showMessage('error', errorMsg);
      return false;
    }
  };

  // إلغاء طلب
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('هل أنت متاكد من رغبتك في إلغاء هذا الطلب؟')) return;

    setCancelingOrderId(orderId);
    try {
      await axiosInstance.post(`/Orders/${orderId}/cancel`);
      
      setOrders((prevOrders) =>
        prevOrders.map((o) => {
          const currentId = o.id ?? o.orderNumber;
          if (String(currentId) === String(orderId)) {
            return { ...o, status: 'Cancelled', statusText: 'Cancelled' };
          }
          return o;
        })
      );
      
      showMessage('success', 'تم إلغاء الطلب بنجاح');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'فشل في إلغاء الطلب';
      showMessage('error', errorMsg);
    } finally {
      setCancelingOrderId(null);
    }
  };

  // إرسال تقييم للمنتج
  const handleReviewSubmit = async ({ orderId, productId, rating, comment }) => {
    try {
      await axiosInstance.post('/Reviews', { orderId, productId, rating, comment });
      showMessage('success', 'شكرًا لك! تم إرسال تقييمك بنجاح');
      
      // تحديث حالة المنتج داخل الطلب محلياً لمنع التقييم المكرر
      setOrders(prev => prev.map(order => {
        const items = order.items || order.orderItems || [];
        const updatedItems = items.map(item => {
          if ((item.productId || item.id) === productId) {
            return { ...item, hasReviewed: true, canReview: false };
          }
          return item;
        });
        return { ...order, items: updatedItems, orderItems: updatedItems };
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'فشل في إرسال التقييم';
      showMessage('error', errorMsg);
    }
  };

  // طباعة الفاتورة
  const handlePrintInvoice = (orderData, userData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (orderData.items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName || item.name || 'منتج'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;">${item.unitPrice || item.price || 0} ج.م</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة طلب #${orderData.orderNumber || orderData.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; width: 100%; }
            .details td { padding: 4px 0; }
            table.items { width: 100%; border-collapse: collapse; margin-top: 20px; }
            table.items th { background: #f5f5f5; padding: 10px; text-align: right; }
            .total { text-align: left; margin-top: 20px; font-weight: bold; font-size: 1.1em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>فاتورة الشراء</h2>
            <p>رقم الطلب: #${orderData.orderNumber || orderData.id}</p>
          </div>
          <table class="details">
            <tr><td><strong>العميل:</strong> ${userData.fullName || 'غير محدد'}</td></tr>
            <tr><td><strong>البريد:</strong> ${userData.email || 'غير محدد'}</td></tr>
            <tr><td><strong>العنوان:</strong> ${orderData.shippingAddress || userData.address || 'غير محدد'}</td></tr>
          </table>
          <table class="items">
            <thead>
              <tr>
                <th>المنتج</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <p>تكلفة الشحن: ${orderData.shippingCost || 0} ج.م</p>
            <p>الإجمالي الكلي: ${orderData.totalAmount || orderData.total || 0} ج.م</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 dir-rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Banner العلوي */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-2xl">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.fullName || 'الحساب الشخصي'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            تغيير كلمة المرور
          </button>
        </div>

        {/* رسائل التنبيه والـ Flash Messages */}
        {message && (
          <div
            className={`p-4 rounded-xl shadow-sm flex items-center gap-3 transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* التبويبات Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            البيانات الشخصية
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            طلباتي
          </button>
        </div>

        {/* محتوى التبويبات */}
        {activeTab === 'profile' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم بالكامل
                  </label>
                  <input
                    type="text"
                    value={user.fullName}
                    onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="أدخل الاسم الثلاثي"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all pl-10"
                      placeholder="name@example.com"
                      required
                    />
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المحافظة
                  </label>
                  <input
                    type="text"
                    value={user.governorate}
                    onChange={(e) => setUser({ ...user, governorate: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="مثال: الإسكندرية"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان بالتفصيل
                </label>
                <textarea
                  value={user.address}
                  onChange={(e) => setUser({ ...user, address: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="اسم الشارع، رقم المبنى، رقم الشقة..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isUpdating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">لا يوجد طلبات حالياً</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">لم تقم بإجراء أي طلبات شراء حتى الآن.</p>
              </div>
            ) : (
              orders.map((order) => {
                const oId = order.id ?? order.orderNumber;
                return (
                  <OrderCard
                    key={oId}
                    order={order}
                    isExpanded={expandedOrderId === oId}
                    onToggle={() => setExpandedOrderId(prev => prev === oId ? null : oId)}
                    onCancel={handleCancelOrder}
                    cancelingOrderId={cancelingOrderId}
                    onOpenReview={(item) => {
                      setSelectedReviewItem({ ...item, orderId: oId });
                      setIsReviewModalOpen(true);
                    }}
                    userInfo={user}
                    onPrintInvoice={handlePrintInvoice}
                  />
                );
              })
            )}
          </div>
        )}

        {/* Modals */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handleChangePassword}
        />

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onSubmit={handleReviewSubmit}
          targetItem={selectedReviewItem}
        />

        <VerifyEmailModal
          isOpen={isVerifyModalOpen}
          newEmail={pendingEmail}
          onClose={() => setIsVerifyModalOpen(false)}
          onVerified={handleEmailVerified}
        />

      </div>
    </div>
  );
};

export default Profile;