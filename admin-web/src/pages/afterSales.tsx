import React from 'react';
import { AfterSalesView } from '../components/OperationsViews';

interface AfterSalesPageProps {
  afterSales: any[];
  orders: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const AfterSalesPage: React.FC<AfterSalesPageProps> = ({ afterSales, orders, onRefresh, notify }) => (
  <AfterSalesView afterSales={afterSales} orders={orders} onRefresh={onRefresh} notify={notify} />
);

export default AfterSalesPage;
