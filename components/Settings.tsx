import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ProfileIcon } from './icons/ProfileIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { UsersIcon } from './icons/UsersIcon';
import { KeyIcon } from './icons/KeyIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useToast } from './Toast';
import { Modal } from './Modal';
import { PlusIcon } from './icons/PlusIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { DownloadIcon } from './icons/DownloadIcon';

// --- Sub Components ---

const ProfileSettings: React.FC<{ 
    user: User; 
    onSave: (updates: Partial<User>) => void; 
}> = ({ user, onSave }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        bio: 'Senior Project Manager' 
    });

    useEffect(() => {
        setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }, [user]);

    const handleSave = () => {
        onSave({ name: formData.name, email: formData.email });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Profile</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your public profile and preferences.</p>
            </div>

            <div className="flex items-center gap-6">
                <img src={user.avatarUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white dark:border-brand-primary shadow-lg" />
                <div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                        <UploadIcon className="w-4 h-4" /> Change Avatar
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size 800K</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted" 
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio / Title</label>
                    <textarea 
                        rows={3} 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted" 
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end border-t dark:border-gray-700">
                <button onClick={handleSave} className="px-6 py-2 bg-brand-primary dark:bg-brand-muted text-white rounded-lg font-medium transition shadow-sm">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

const OrganizationSettings: React.FC<{ 
    canManageTeam: boolean; 
    canDeleteOrg: boolean; 
    onSave: () => void; 
}> = ({ canManageTeam, canDeleteOrg, onSave }) => (
    <div className="space-y-6 animate-fadeIn">
        <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organization Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your company details and workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
                <input type="text" defaultValue="Studio HINTA" disabled={!canManageTeam} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted disabled:opacity-60" />
            </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input type="url" defaultValue="https://hinta.se" disabled={!canManageTeam} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted disabled:opacity-60" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                <input type="email" defaultValue="support@hinta.se" disabled={!canManageTeam} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-brand-muted focus:border-brand-muted disabled:opacity-60" />
            </div>
        </div>

        {canManageTeam && (
            <div className="pt-4 flex justify-end border-t dark:border-gray-700">
                <button onClick={onSave} className="px-6 py-2 bg-brand-primary dark:bg-brand-muted text-white rounded-lg font-medium transition shadow-sm">
                    Save Organization
                </button>
            </div>
        )}

        {/* Danger Zone */}
            {canDeleteOrg && (
            <div className="mt-12 p-6 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl">
                <h3 className="text-red-700 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">Deleting the organization is irreversible. All projects, images, and data will be permanently removed.</p>
                <button onClick={() => window.confirm("Are you absolutely sure?")} className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition">
                    Delete Organization
                </button>
            </div>
            )}
    </div>
);

const TeamSettings: React.FC<{
    team: User[];
    currentUser: User;
    canManageTeam: boolean;
    onUpdateRole: (userId: string, role: UserRole) => void;
    onRemoveUser: (userId: string) => void;
    onInvite: (email: string, role: UserRole) => void;
}> = ({ team, currentUser, canManageTeam, onUpdateRole, onRemoveUser, onInvite }) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.OrgMember);

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onInvite(inviteEmail, inviteRole);
        setIsInviteModalOpen(false);
        setInviteEmail('');
    };

    // UI Helpers for roles
    const getRoleLabel = (role: UserRole) => {
        switch(role) {
            case UserRole.SuperAdmin: return 'Studio HINTA Super Admin';
            case UserRole.OrgOwner: return 'Owner';
            case UserRole.OrgAdmin: return 'Admin';
            case UserRole.OrgMember: return 'Member';
            default: return role;
        }
    }

    const getRoleBadgeColor = (role: UserRole) => {
            switch(role) {
            case UserRole.SuperAdmin: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case UserRole.OrgOwner: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case UserRole.OrgAdmin: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Members</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage access and roles for your workspace.</p>
                </div>
                {canManageTeam && (
                    <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-primary dark:bg-brand-muted text-white rounded-lg font-medium transition shadow-sm text-sm">
                        <PlusIcon className="w-4 h-4" /> Invite Member
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Organization Role</th>
                            <th className="px-6 py-3 font-medium">Last Active</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {team.map(member => (
                            <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{member.name} {member.id === currentUser.id && <span className="text-xs text-gray-500">(You)</span>}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {canManageTeam && member.id !== currentUser.id && member.role !== UserRole.OrgOwner ? (
                                            <select 
                                            value={member.role} 
                                            onChange={(e) => onUpdateRole(member.id, e.target.value as UserRole)}
                                            className="bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-brand-muted"
                                        >
                                            <option value={UserRole.OrgAdmin}>Admin</option>
                                            <option value={UserRole.OrgMember}>Member</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                                            {(member.role === UserRole.OrgOwner || member.role === UserRole.SuperAdmin) && <ShieldCheckIcon className="w-3 h-3" />}
                                            {getRoleLabel(member.role)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{member.lastActive}</td>
                                <td className="px-6 py-4 text-right">
                                    {canManageTeam && member.role !== UserRole.OrgOwner && member.id !== currentUser.id && (
                                        <button onClick={() => onRemoveUser(member.id)} className="text-gray-400 hover:text-red-600 transition p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

                {isInviteModalOpen && (
                <Modal onClose={() => setIsInviteModalOpen(false)}>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Invite Team Member</h2>
                    <form onSubmit={handleInviteSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg">
                                    <option value={UserRole.OrgAdmin}>Admin</option>
                                    <option value={UserRole.OrgMember}>Member</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                    {inviteRole === UserRole.OrgAdmin ? 
                                        "Admins can invite other users, create projects, and manage team settings (excluding billing)." :
                                        "Members can only access projects they have been explicitly assigned to."
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-brand-primary dark:bg-brand-muted text-white rounded-lg hover:bg-opacity-90">Send Invitation</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const BillingSettings: React.FC<{ canManageBilling: boolean; onSave: () => void }> = ({ canManageBilling, onSave }) => {
    if (!canManageBilling) {
        return (
            <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCardIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Restricted Access</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Only the Organization Owner can manage billing and subscription details.</p>
            </div>
        )
    }

    const packages = [
        {
            name: 'SMALL',
            price: '59.000 kr',
            color: 'bg-brand-muted',
            features: ['1x Superb Units Bostadsväljare', '1x Översiktsbild', '4x Fasadbild']
        },
        {
            name: 'MEDIUM',
            price: '89.000 kr',
            color: 'bg-brand-primary',
            features: ['1x Superb Units Bostadsväljare', '1x Översiktsbild', '4x Fasadbild', 'Solstudie Small', '4x Interiör stillbild']
        },
        {
            name: 'LARGE',
            price: '119.000 kr',
            color: 'bg-brand-blue', // fallback or extra color
            className: 'bg-[#535c68]',
            features: ['1x Superb Units Bostadsväljare', '1x 360-bostadsväljare', '1x Översiktsbild', '4x Fasadbild', '1x Exteriör Herobild', 'Solstudie Medium', '4 rok Interiör virtuell rundvandring', '6x interiöra stillbilder']
        }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
                <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Production Packages & Billing</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">View your packages, manage invoice details, and subscription status.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Annual Subscription</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Your subscription ensures continued hosting and access to the unit selector.
                        </p>
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Active • <strong>Year 1 Included</strong> in production cost</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Renewal Price (Year 2+):</span> 990 kr/month (Billed annually: 11,880 kr)
                            </div>
                        </div>
                    </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 text-sm max-w-xs">
                            <p className="font-semibold text-gray-800 dark:text-white mb-2">Maintenance Option</p>
                            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                                Want to close the Unit Selector but keep the digital tour? Downgrade to "Maintenance Mode" for a <span className="font-bold text-brand-muted dark:text-brand-accent">50% discount</span> on the monthly fee.
                            </p>
                            <button className="mt-3 text-xs font-semibold text-gray-500 underline hover:text-gray-800 dark:hover:text-white">Contact support to downgrade</button>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Production Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.name} className={`${pkg.color} ${pkg.className || ''} rounded-xl p-6 text-white shadow-lg flex flex-col h-full relative overflow-hidden group`}>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg tracking-wide">{pkg.name}</h4>
                                </div>
                                <div className="text-2xl font-bold mb-4">{pkg.price}</div>
                                <ul className="space-y-2 text-sm opacity-90 mb-6">
                                    {pkg.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-white opacity-70 flex-shrink-0"></span>
                                            <span className="leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {pkg.name === 'MEDIUM' && (
                                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                    Current Plan
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Billing Details Form */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Billing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name (for Invoice)</label>
                            <input type="text" defaultValue="HINTA AB" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"/>
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Email</label>
                            <input type="email" defaultValue="invoice@hinta.se" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"/>
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Org Number / VAT ID</label>
                            <input type="text" defaultValue="556000-0000" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"/>
                    </div>
                    <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Address</label>
                            <textarea rows={2} defaultValue="Nordic Way 42, 111 22 Stockholm" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"/>
                    </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                    <button onClick={onSave} className="px-6 py-2 bg-brand-primary dark:bg-brand-muted text-white rounded-lg font-medium transition shadow-sm">
                        Save Billing Details
                    </button>
                    </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Invoice History</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Invoice #</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 text-right">Download</th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-6 py-4">INV-2023-001</td>
                            <td className="px-6 py-4">Oct 26, 2023</td>
                            <td className="px-6 py-4">89.000 kr</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Paid</span></td>
                            <td className="px-6 py-4 text-right"><button className="text-blue-600 hover:underline">PDF</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DataSettings: React.FC<{ addToast: any }> = ({ addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = {
            realviz_projects: JSON.parse(localStorage.getItem('realviz_projects') || '[]'),
            realviz_views: JSON.parse(localStorage.getItem('realviz_views') || '[]'),
            realviz_units: JSON.parse(localStorage.getItem('realviz_units') || '[]'),
            realviz_hotspots: JSON.parse(localStorage.getItem('realviz_hotspots') || '[]'),
            realviz_users: JSON.parse(localStorage.getItem('realviz_users') || '[]'),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hinta_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Data exported successfully");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                if (data.realviz_projects) localStorage.setItem('realviz_projects', JSON.stringify(data.realviz_projects));
                if (data.realviz_views) localStorage.setItem('realviz_views', JSON.stringify(data.realviz_views));
                if (data.realviz_units) localStorage.setItem('realviz_units', JSON.stringify(data.realviz_units));
                if (data.realviz_hotspots) localStorage.setItem('realviz_hotspots', JSON.stringify(data.realviz_hotspots));
                if (data.realviz_users) localStorage.setItem('realviz_users', JSON.stringify(data.realviz_users));

                addToast("Data imported successfully. Reloading...", 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                addToast("Failed to import data. Invalid JSON file.", 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; 
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all data? This will restore default settings and cannot be undone.")) {
            localStorage.removeItem('realviz_projects');
            localStorage.removeItem('realviz_views');
            localStorage.removeItem('realviz_units');
            localStorage.removeItem('realviz_hotspots');
            localStorage.removeItem('realviz_users');
            localStorage.removeItem('realviz_current_user');
            addToast("Data reset. Reloading...", 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Management</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Import and export your project data to create backups or load custom demos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="bg-green-50 dark:bg-green-900/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <DownloadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-grow">
                        Download a JSON file containing all your current projects, units, views, and settings. Keep this file as a backup.
                    </p>
                    <button onClick={handleExport} className="w-full py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                        Download Backup
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <UploadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 flex-grow">
                        Upload a previously exported JSON file to overwrite current data. <br/><strong>Warning: Current data will be replaced.</strong>
                    </p>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-4 bg-brand-primary dark:bg-brand-muted text-white font-medium rounded-lg hover:bg-opacity-90 transition shadow-sm">
                        Upload & Restore
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleImport} 
                    />
                </div>
            </div>

            {/* Factory Reset */}
            <div className="mt-8 pt-8 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Factory Reset</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                    Clear all local data and restore the application to its initial default state.
                </p>
                <button onClick={handleReset} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium text-sm">
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};

// --- Main Settings Component ---

interface SettingsProps {
    users?: User[];
    currentUser: User;
    onUpdateCurrentUser: (user: User) => void;
}

type SettingsTab = 'profile' | 'organization' | 'team' | 'billing' | 'security' | 'data';

export const Settings: React.FC<SettingsProps> = ({ users: propUsers, currentUser, onUpdateCurrentUser }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [team, setTeam] = useState<User[]>(propUsers || [currentUser]);
    const { addToast } = useToast();

    const isSuperAdmin = currentUser.role === UserRole.SuperAdmin;
    const isOwner = currentUser.role === UserRole.OrgOwner;
    const isAdmin = currentUser.role === UserRole.OrgAdmin;

    const canManageTeam = isSuperAdmin || isOwner || isAdmin;
    const canManageBilling = isSuperAdmin || isOwner;
    const canDeleteOrg = isSuperAdmin || isOwner;

    const handleUpdateUser = (updates: Partial<User>) => {
        const updatedUser = { ...currentUser, ...updates };
        onUpdateCurrentUser(updatedUser);
        setTeam(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        addToast("Profile saved successfully");
    };

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setTeam(prev => prev.map(u => u.id === userId ? {...u, role: newRole} : u));
        addToast("User role updated");
    };

    const handleRemoveUser = (userId: string) => {
        if(window.confirm("Remove this user from the organization?")) {
                setTeam(prev => prev.filter(u => u.id !== userId));
                addToast("User removed", 'info');
        }
    };

    const handleInvite = (email: string, role: UserRole) => {
        addToast(`Invitation sent to ${email}`);
    };

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
             <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Settings</h1>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
                    {[
                        { id: 'profile', label: 'Profile', icon: ProfileIcon },
                        { id: 'organization', label: 'Organization', icon: BuildingIcon },
                        { id: 'team', label: 'Team & Roles', icon: UsersIcon },
                        { id: 'billing', label: 'Billing & Plans', icon: CreditCardIcon },
                        { id: 'security', label: 'Security', icon: KeyIcon },
                        { id: 'data', label: 'Data Management', icon: DatabaseIcon },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as SettingsTab)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === item.id 
                                ? 'bg-brand-accent/20 dark:bg-brand-primary text-gray-900 dark:text-white border-l-4 border-brand-primary dark:border-brand-accent' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-brand-primary dark:text-brand-accent' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    {activeTab === 'profile' && (
                        <ProfileSettings 
                            user={currentUser} 
                            onSave={handleUpdateUser} 
                        />
                    )}
                    {activeTab === 'organization' && (
                        <OrganizationSettings 
                            canManageTeam={canManageTeam} 
                            canDeleteOrg={canDeleteOrg} 
                            onSave={() => addToast("Organization details updated")} 
                        />
                    )}
                    {activeTab === 'team' && (
                        <TeamSettings 
                            team={team} 
                            currentUser={currentUser} 
                            canManageTeam={canManageTeam} 
                            onUpdateRole={handleRoleChange} 
                            onRemoveUser={handleRemoveUser}
                            onInvite={handleInvite}
                        />
                    )}
                    {activeTab === 'billing' && (
                        <BillingSettings 
                            canManageBilling={canManageBilling} 
                            onSave={() => addToast("Billing details updated")} 
                        />
                    )}
                    {activeTab === 'data' && (
                        <DataSettings addToast={addToast} />
                    )}
                    {activeTab === 'security' && (
                        <div className="text-center py-12 text-gray-500">
                            <KeyIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
                            <p>Password change and 2FA settings would go here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};