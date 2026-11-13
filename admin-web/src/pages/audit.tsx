import React from 'react';
import { BannersAndAuditView } from '../components/OperationsViews';

interface AuditPageProps {
  banners: any[];
  auditLogs: any[];
}

const AuditPage: React.FC<AuditPageProps> = ({ banners, auditLogs }) => (
  <BannersAndAuditView banners={banners} auditLogs={auditLogs} />
);

export default AuditPage;
