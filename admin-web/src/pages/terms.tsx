import React from 'react';
import { TermsAndScopeView } from '../components/OperationsViews';

interface TermsPageProps {
  terms: any[];
  beads: any[];
  templates: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ terms, beads, templates, onRefresh, notify }) => (
  <TermsAndScopeView terms={terms} beads={beads} templates={templates} onRefresh={onRefresh} notify={notify} />
);

export default TermsPage;
