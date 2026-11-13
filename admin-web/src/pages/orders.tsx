import React from 'react';
import { OrdersAndWorkOrdersView } from '../components/OrdersView';

interface OrdersPageProps {
  orders: any[];
  initialQuery?: string;
  initialTab?: string;
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ orders, initialQuery, initialTab, onRefresh, notify }) => (
  <OrdersAndWorkOrdersView
    orders={orders}
    initialQuery={initialQuery}
    initialTab={initialTab}
    onRefresh={onRefresh}
    notify={notify}
  />
);

export default OrdersPage;
