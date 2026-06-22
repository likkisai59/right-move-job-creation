import React from 'react';
import PageContainer from '../../components/layout/PageContainer';

const AccountsPage = () => {
    return (
        <PageContainer
            title="Accounts Management"
            subtitle="Manage your accounting details, invoices, and transactions here."
        >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Accounts Summary</h2>
                <p className="text-sm text-gray-500 mt-2">Welcome to the Accounts module.</p>
            </div>
            <h1 className="text-center text-2xl font-bold text-gray-800">In Progress.................</h1>
        </PageContainer>
    );
};

export default AccountsPage;
