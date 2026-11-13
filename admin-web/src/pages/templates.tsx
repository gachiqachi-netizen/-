import React from 'react';
import { TemplatesWorkbench } from './templates/TemplatesWorkbench';

interface TemplatesPageProps {
  templates: any[];
  beads: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const TemplatesPage: React.FC<TemplatesPageProps> = (props) => <TemplatesWorkbench {...props} />;

export default TemplatesPage;
