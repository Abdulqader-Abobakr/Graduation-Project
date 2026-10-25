import React from 'react';
import { router } from '@inertiajs/react';
import ProposalFormModal from '../Components/ProposalFormModal';

export default function CreateProposal({
  chatId,
  clientName,
  clientAvatar,
  clientRequest,
  proposalId,
  initialData,
}) {
  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.visit('/freelancer/proposals');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <ProposalFormModal
        isOpen={true}
        onClose={handleClose}
        chatId={chatId}
        proposalId={proposalId}
        clientName={clientName}
        clientAvatar={clientAvatar}
        clientRequest={clientRequest}
        initialData={initialData}
      />
    </div>
  );
}
