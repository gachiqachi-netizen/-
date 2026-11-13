import React from 'react';
import { ProductsView } from '../components/OverviewAndProducts';

interface ProductsPageProps {
  beads: any[];
  kbMaterials: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ beads, kbMaterials, onRefresh, notify }) => (
  <ProductsView beads={beads} kbMaterials={kbMaterials} onRefresh={onRefresh} notify={notify} />
);

export default ProductsPage;
