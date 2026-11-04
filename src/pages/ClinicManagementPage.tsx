import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  KeyRound,
  Palette,
  Plus,
  ShieldCheck,
  Check,
  X,
  Copy,
  Trash2,
  Sparkles,
  Eye,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getClinicUnits,
  createClinicUnit,
  getClinicMembers,
  updateClinicMember,
  generateInvitationCode,
  getClinicInvitations,
  revokeInvitation,
  updateClinicTheme
} from '../services/clinicService';
import { PRESET_PALETTES } from '../utils/themePresets';
import { ClinicMember, ClinicUnit, InvitationCode, PresetPaletteId, UserRole } from '../types';

export const ClinicManagementPage: React.FC = () => {
  const { activeClinic, activeMember, user, refreshClinicData } = useAuth();
  const { paletteId, primaryColor, accentColor, previewTheme, resetPreview, setClinicTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'units' | 'staff' | 'invitations' | 'theme'>('units');
  const [loading, setLoading] = useState(true);

  // Units State
  const [units, setUnits] = useState<ClinicUnit[]>([]);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [unitAddress, setUnitAddress] = useState('');
  const [unitPhone, setUnitPhone] = useState('');
  const [unitRooms, setUnitRooms] = useState(4);

  // Staff State
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [editingMember, setEditingMember] = useState<ClinicMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('health_professional');
  const [editSupervisorName, setEditSupervisorName] = useState('');

  // Invitations State
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<UserRole>('health_professional');
  const [inviteProfession, setInviteProfession] = useState('Fisioterapeuta');
  const [inviteMaxUses, setInviteMaxUses] = useState(5);
  const [inviteDays, setInviteDays] = useState(7);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Theme Customizer State
  const [selectedPalette, setSelectedPalette] = useState<PresetPaletteId>(paletteId);
  const [customPrimary, setCustomPrimary] = useState(primaryColor);
  const [customAccent, setCustomAccent] = useState(accentColor);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState('');

  const loadAll = async () => {
    if (!activeClinic) return;
    setLoading(true);
    try {
      const [u, m, inv] = await Promise.all([
        getClinicUnits(activeClinic.id),
        getClinicMembers(activeClinic.id),
        getClinicInvitations(activeClinic.id),
      ]);
      setUnits(u);
      setMembers(m);
      setInvitations(inv);
    } catch (err) {
      console.error('Error loading clinic management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [activeClinic]);

  // UNIT HANDLERS
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !user || !activeMember) return;
    try {
      await createClinicUnit(
        activeClinic.id,
        {
          name: unitName,
          address: unitAddress,
          phone: unitPhone,
          active: true,
          roomsCount: Number(unitRooms),
        },
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );
      setUnitModalOpen(false);
      setUnitName('');
      setUnitAddress('');
      setUnitPhone('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar unidade.');
    }
  };

  // STAFF ROLE HANDLERS
  const handleSaveMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !editingMember || !user || !activeMember) return;
    try {
      await updateClinicMember(
        activeClinic.id,
        editingMember.id,
        {
          role: editRole,
          supervisorName: editRole === 'student' ? editSupervisorName : undefined,
          canViewClinicalData: editRole !== 'receptionist',
        },
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );
      setEditingMember(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar função de membro.');
    }
  };

  // INVITATION CODE HANDLERS
  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClinic || !user || !activeMember) return;
    try {
      await generateInvitationCode(
        activeClinic.id,
        activeClinic.name,
        inviteRole,
        inviteProfession,
        'all',
        Number(inviteMaxUses),
        Number(inviteDays),
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );
      setInviteModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar código de vínculo.');
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!activeClinic || !user || !activeMember) return;
    if (!confirm('Deseja realmente revogar este código de vínculo?')) return;
    try {
      await revokeInvitation(activeClinic.id, invId, {
        uid: user.uid,
        displayName: user.displayName,
        role: activeMember.role,
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Erro ao revogar convite.');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // THEME HANDLERS
  const handleSelectPalette = (pId: PresetPaletteId) => {
    setSelectedPalette(pId);
    const p = PRESET_PALETTES[pId];
    if (pId !== 'custom') {
      previewTheme(pId, p.primaryLight, p.accentLight);
    } else {
      previewTheme('custom', customPrimary, customAccent);
    }
  };

  const handleSaveTheme = async () => {
    if (!activeClinic || !user || !activeMember) return;
    try {
      await updateClinicTheme(
        activeClinic.id,
        selectedPalette,
        selectedPalette === 'custom' ? customPrimary : undefined,
        selectedPalette === 'custom' ? customAccent : undefined,
        {
          uid: user.uid,
          displayName: user.displayName,
          role: activeMember.role,
        }
      );
      setClinicTheme(
        selectedPalette,
        selectedPalette === 'custom' ? customPrimary : undefined,
        selectedPalette === 'custom' ? customAccent : undefined
      );
      setThemeSuccessMsg('Identidade visual da clínica salva no Firestore com sucesso!');
      setTimeout(() => setThemeSuccessMsg(''), 4000);
      await refreshClinicData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar identidade visual.');
    }
  };

  const handleRestoreDefaultPalette = () => {
    setSelectedPalette('azul-saude');
    resetPreview();
    setClinicTheme('azul-saude');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-sky-600" />
          <span>Gestão da Clínica & Identidade Visual</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Administração de unidades físicas, vinculação de funcionários, códigos de acesso e personalização de tema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'units'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Unidades Físicas ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe & Vínculos ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'invitations'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Códigos de Vínculo</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2.5 border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === 'theme'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Identidade Visual & Paletas</span>
        </button>
      </div>

      {/* TAB 1: UNIDADES FÍSICAS */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uma clínica pode possuir múltiplas unidades físicas com agendas e consultórios separados.
            </p>
            <button
              onClick={() => setUnitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Unidade</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map(u => (
              <div
                key={u.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Ativa
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1">
                    <div><strong>Endereço:</strong> {u.address}</div>
                    <div><strong>Telefone:</strong> {u.phone}</div>
                    <div><strong>Capacidade:</strong> {u.roomsCount || 4} consultórios</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>ID: {u.id.substring(0, 8)}...</span>
                  <span className="text-emerald-600 font-semibold">Integrada ao Firestore</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPE & VÍNCULOS */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Controle de acesso por função (RBAC). O desligamento de um funcionário desta clínica não exclui sua conta pessoal.
          </p>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Profissional</th>
                  <th className="py-3 px-4">Função / Perfil</th>
                  <th className="py-3 px-4">Registro Profissional</th>
                  <th className="py-3 px-4">Unidades Autorizadas</th>
                  <th className="py-3 px-4">Prontuário</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{m.displayName}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800">
                        {m.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {m.professionalRegister || m.profession || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      {m.assignedUnitIds === 'all' ? 'Todas as Unidades' : `${m.assignedUnitIds.length} unidades`}
                    </td>

                    <td className="py-3.5 px-4">
                      {m.canViewClinicalData ? (
                        <span className="text-emerald-600 text-[11px] font-medium">Autorizado</span>
                      ) : (
                        <span className="text-rose-600 text-[11px] font-bold">Bloqueado (Recepção)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingMember(m);
                          setEditRole(m.role);
                          setEditSupervisorName(m.supervisorName || '');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Editar Permissões
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CÓDIGOS DE VÍNCULO */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Convites & Códigos de Vínculo</h2>
              <p className="text-xs text-slate-500">
                Gere códigos com validade e limite de usos para novos funcionários vincularem suas contas pessoais.
              </p>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Código de Vínculo</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Função Atribuída</th>
                  <th className="py-3 px-4">Profissão</th>
                  <th className="py-3 px-4">Usos</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      <div className="flex items-center space-x-1.5">
                        <span>{inv.code}</span>
                        <button
                          onClick={() => copyToClipboard(inv.code)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Copiar código"
                        >
                          {copiedCode === inv.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold">
                      {inv.role}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.profession || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.usedCount} de {inv.maxUses}
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.isRevoked ? (
                        <span className="text-rose-600 font-semibold text-[10px]">Revogado</span>
                      ) : new Date(inv.expiresAt) < new Date() ? (
                        <span className="text-slate-400 font-semibold text-[10px]">Expirado</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[10px]">Ativo</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!inv.isRevoked && (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IDENTIDADE VISUAL & PALETAS */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-sky-600" />
                <span>Biblioteca de Paletas Oficiais CliniOn</span>
              </h2>
              <p className="text-xs text-slate-500">
                A paleta configurada pela clínica define a identidade visual aplicada a todos os seus usuários.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDefaultPalette}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Azul Saúde</span>
              </button>

              <button
                onClick={handleSaveTheme}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Identidade no Firestore</span>
              </button>
            </div>
          </div>

          {themeSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{themeSuccessMsg}</span>
            </div>
          )}

          {/* 7 Preset Palettes Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PRESET_PALETTES).map(([key, p]) => {
              const isSelected = selectedPalette === key;

              return (
                <div
                  key={key}
                  onClick={() => handleSelectPalette(key as PresetPaletteId)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-600 dark:border-sky-400 bg-sky-50/20 dark:bg-sky-950/20 shadow-md ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Color swatches */}
                  <div className="flex items-center space-x-2 my-3">
                    <div
                      className="w-8 h-8 rounded-xl shadow-xs"
                      style={{ backgroundColor: p.primaryLight }}
                      title={`Cor Principal Claro: ${p.primaryLight}`}
                    />
                    <div
                      className="w-8 h-8 rounded-xl shadow-xs"
                      style={{ backgroundColor: p.accentLight }}
                      title={`Cor Destaque Claro: ${p.accentLight}`}
                    />
                    <div
                      className="w-8 h-8 rounded-xl shadow-xs border border-slate-700"
                      style={{ backgroundColor: p.primaryDark }}
                      title={`Cor Principal Escuro: ${p.primaryDark}`}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Custom color picker */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Personalização Avançada (Hexadecimal)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cor Principal da Clínica
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={e => {
                      setCustomPrimary(e.target.value);
                      setSelectedPalette('custom');
                      previewTheme('custom', e.target.value, customAccent);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={e => {
                      setCustomPrimary(e.target.value);
                      setSelectedPalette('custom');
                      previewTheme('custom', e.target.value, customAccent);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cor de Destaque / Acentos
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={e => {
                      setCustomAccent(e.target.value);
                      setSelectedPalette('custom');
                      previewTheme('custom', customPrimary, e.target.value);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={e => {
                      setCustomAccent(e.target.value);
                      setSelectedPalette('custom');
                      previewTheme('custom', customPrimary, e.target.value);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA UNIDADE */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Cadastrar Nova Unidade</h2>
              <button onClick={() => setUnitModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateUnit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nome da Unidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Unidade Jardins"
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Endereço Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Rua, número, bairro..."
                  value={unitAddress}
                  onChange={e => setUnitAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 3200-0000"
                    value={unitPhone}
                    onChange={e => setUnitPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Consultórios</label>
                  <input
                    type="number"
                    min="1"
                    value={unitRooms}
                    onChange={e => setUnitRooms(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERAR CÓDIGO DE VÍNCULO */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Gerar Código de Vínculo</h2>
              <button onClick={() => setInviteModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleGenerateInvitation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Função / Perfil (RBAC) *</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                >
                  <option value="health_professional">Profissional de Saúde</option>
                  <option value="student">Aluno / Estagiário</option>
                  <option value="receptionist">Recepcionista (Sem prontuário)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Especialidade / Profissão</label>
                <select
                  value={inviteProfession}
                  onChange={e => setInviteProfession(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Fisioterapeuta">Fisioterapeuta (CREFITO)</option>
                  <option value="Psicólogo">Psicólogo (CRP)</option>
                  <option value="Médico">Médico (CRM)</option>
                  <option value="Nutricionista">Nutricionista (CRN)</option>
                  <option value="Enfermeiro">Enfermeiro (COREN)</option>
                  <option value="Estudante/Estagiário">Estudante / Estagiário</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Limite de Usos</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={inviteMaxUses}
                    onChange={e => setInviteMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Validade (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={inviteDays}
                    onChange={e => setInviteDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
                >
                  Criar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FUNÇÃO DE MEMBRO */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Permissões: {editingMember.displayName}
              </h2>
              <button onClick={() => setEditingMember(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveMemberRole} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Função / Perfil (RBAC)</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                >
                  <option value="admin">Administrador</option>
                  <option value="health_professional">Profissional de Saúde</option>
                  <option value="student">Aluno / Estagiário</option>
                  <option value="receptionist">Recepcionista</option>
                </select>
              </div>

              {editRole === 'student' && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Supervisor Responsável</label>
                  <input
                    type="text"
                    placeholder="Nome do profissional supervisor"
                    value={editSupervisorName}
                    onChange={e => setEditSupervisorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs rounded-xl hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white"
                >
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
