import { Users } from 'lucide-react';

export default function Employees() {
  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
          style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}
        >
          <Users size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Employees</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">
        Manage cashier and kitchen staff accounts.
      </p>

      {/* Coming-soon card */}
      <div
        className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-12 text-center"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center border-2 mx-auto mb-4"
          style={{ background: '#F5F0E8', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}
        >
          <Users size={24} strokeWidth={2} style={{ color: '#1A1A1A' }} />
        </div>
        <p className="text-base font-black text-[#1A1A1A] mb-1">Employee management coming soon</p>
        <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
          Staff accounts, roles, and shift scheduling will be available in the next update.
          New employees can be added via the sign-up page for now.
        </p>
      </div>
    </div>
  );
}
