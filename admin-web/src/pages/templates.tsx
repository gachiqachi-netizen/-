import React from 'react';
import { TemplatesWorkbenchView } from '../components/TemplatesView';

interface TemplatesPageProps {
  templates: any[];
  beads: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const TemplatesPage: React.FC<TemplatesPageProps> = ({ templates, beads, onRefresh, notify }) => (
  <TemplatesWorkbenchView templates={templates} beads={beads} onRefresh={onRefresh} notify={notify} />
);

export default TemplatesPage;
