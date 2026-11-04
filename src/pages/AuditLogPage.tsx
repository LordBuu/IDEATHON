import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, FileText, Lock, Clock, User, ArrowDownToLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../services/auditService';
import { AuditLog } from '../types';

export const AuditLogPage: React.FC = () => {
  const { activeClinic, activeMember } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = activeMember?.role === 'admin';

  useEffect(() => {
    if (!activeClinic || !isAdmin) {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const fetched = await getAuditLogs(activeClinic.id, 80);
        setLogs(fetched);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [activeClinic, activeMember]);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200">
        <Lock className="w-12 h-12 mx-auto mb-3 text-rose-600" />
        <h2 className="text-lg font-bold">Acesso Restrito ao Administrador</h2>
        <p className="text-xs mt-1">
          Apenas administradores da clínica possuem permissão para auditar logs e acessos sensíveis de dados.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(l => {
    const s = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(s) ||
      l.userName.toLowerCase().includes(s) ||
      l.entity.toLowerCase().includes(s) ||
      (l.details && l.details.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Auditoria de Acessos & Conformidade LGPD</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trilha imutável de rastreabilidade de acessos a prontuários, cadastros e mutações operacionais.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar logs por ação, usuário, prontuário ou termo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Carregando trilha de auditoria...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum registro de auditoria encontrado.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-4">Usuário / Ator</th>
                  <th className="py-3 px-4">Papel (RBAC)</th>
                  <th className="py-3 px-4">Ação Executada</th>
                  <th className="py-3 px-4">Entidade Alvo</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {l.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {l.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-sky-700 dark:text-sky-300">
                      {l.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {l.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {l.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
