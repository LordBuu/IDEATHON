import React, { useState } from 'react';
import {
  Building2,
  Stethoscope,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Users,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createClinic, redeemInvitationCode } from '../services/clinicService';
import { Profession } from '../types';

export const AuthPage: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    user,
    refreshClinicData,
    loginAsAdminDemo,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register_clinic' | 'join_clinic' | 'signup_user'>('login');
  const [email, setEmail] = useState('admin@clinora.com');
  const [password, setPassword] = useState('clinora123');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState<Profession>('Fisioterapeuta');
  const [register, setRegister] = useState('');
  const [institution, setInstitution] = useState('');
  const [supervisorName, setSupervisorName] = useState('');

  // Clinic creation state
  const [clinicName, setClinicName] = useState('');
  const [clinicSpecialties, setClinicSpecialties] = useState('Fisioterapia, Psicologia, Medicina, Nutrição');
  const [initialUnitName, setInitialUnitName] = useState('Unidade Paulista (Sede)');

  // Join clinic state
  const [inviteCode, setInviteCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginAsAdminDemo();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar como Administrador de Demonstração.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await signUpWithEmail(email, password, name, profession, register, institution, supervisorName);
      setSuccessMsg('Conta criada com sucesso! Conecte-se ou vincule-se a uma clínica.');
      setMode('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      let currentUser = user;
      if (!currentUser) {
        await signUpWithEmail(email, password, name, profession, register);
      }

      currentUser = {
        uid: user?.uid || 'temp_owner_' + Date.now(),
        email: email || user?.email || '',
        displayName: name || user?.displayName || 'Dr. Administrador',
        profession,
        professionalRegister: register,
      };

      await createClinic(
        clinicName,
        clinicSpecialties,
        currentUser,
        'azul-saude',
        initialUnitName
      );

      await refreshClinicData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar clínica.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Por favor, faça login ou cadastre-se primeiro para vincular o código.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await redeemInvitationCode(inviteCode, user);
      await refreshClinicData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao resgatar código de vínculo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md shadow-sky-500/20 mb-3">
            C
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Clini<span className="text-sky-600 dark:text-sky-400">On</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Plataforma SaaS Profissional de Gestão em Saúde & Prontuário Eletrônico
          </p>
        </div>

        {/* PROMINENT 1-CLICK DEMO ACCESS BUTTON */}
        <div className="mb-6 p-4 rounded-2xl border-2 border-sky-500/40 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 text-slate-900 dark:text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-xs text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Acesso Imediato de Demonstração (Administrador)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                Entra direto como <strong>Dr. Carlos Silva (CREFITO)</strong> na <em>CliniOn Centro de Saúde Integrada</em> com unidades, agenda, pacientes e prontuários já cadastrados.
              </p>
            </div>
            <button
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Entrando...' : 'Entrar como Administrador'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode('register_clinic'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'register_clinic' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Criar Clínica
          </button>
          <button
            onClick={() => { setMode('join_clinic'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'join_clinic' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Vincular Código
          </button>
          <button
            onClick={() => { setMode('signup_user'); setErrorMsg(''); }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signup_user' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Nova Conta
          </button>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {mode === 'login' && (
          <div className="space-y-4">
            
            {/* Direct Google Login */}
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Entrar com Conta Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Ou com credenciais de acesso</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail do Usuário
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@clinora.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors mt-2"
              >
                {loading ? 'Conectando...' : 'Entrar na Plataforma'}
              </button>

              {/* Helper badge */}
              <div className="pt-2 text-center text-[11px] text-slate-400">
                Credencial de Administrador pronta: <span className="font-mono text-slate-600 dark:text-slate-300">admin@clinora.com / clinora123</span>
              </div>
            </form>
          </div>
        )}

        {/* FORM 2: CRIAR CLÍNICA */}
        {mode === 'register_clinic' && (
          <form onSubmit={handleCreateClinic} className="space-y-3">
            <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-200">
              Crie um novo ambiente corporativo para sua clínica. Você será configurado como Administrador.
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Nome da Clínica / Estabelecimento *</label>
              <input
                type="text"
                required
                placeholder="Ex: Clínica Integrada Vida & Movimento"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Especialidades Atendidas</label>
              <input
                type="text"
                value={clinicSpecialties}
                onChange={e => setClinicSpecialties(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Nome da Primeira Unidade Física</label>
              <input
                type="text"
                value={initialUnitName}
                onChange={e => setInitialUnitName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {!user && (
              <>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">Dados do Administrador</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Seu Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Carlos Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Senha *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Profissão</label>
                    <select
                      value={profession}
                      onChange={e => setProfession(e.target.value as Profession)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="Fisioterapeuta">Fisioterapeuta</option>
                      <option value="Psicólogo">Psicólogo</option>
                      <option value="Médico">Médico</option>
                      <option value="Nutricionista">Nutricionista</option>
                      <option value="Enfermeiro">Enfermeiro</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Registro (CREFITO, CRM, etc.)</label>
                    <input
                      type="text"
                      placeholder="Ex: CREFITO-3/12345"
                      value={register}
                      onChange={e => setRegister(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors mt-2"
            >
              {loading ? 'Criando Clínica...' : 'Cadastrar Clínica & Acessar'}
            </button>
          </form>
        )}

        {/* FORM 3: VINCULAR CÓDIGO */}
        {mode === 'join_clinic' && (
          <form onSubmit={handleJoinClinic} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              Insira o código de vínculo fornecido pelo administrador da sua clínica (ex: <strong>CLN-DEMO9</strong>). 
              Sua conta pessoal será associada mantendo seu histórico e outros vínculos preservados.
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Código de Vínculo *</label>
              <input
                type="text"
                required
                placeholder="Ex: CLN-DEMO9"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold tracking-wider uppercase bg-slate-50 dark:bg-slate-800 text-center text-sky-600 dark:text-sky-400"
              />
            </div>

            {!user && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Atenção: É necessário estar conectado para ativar o vínculo. Utilize a aba "Entrar" primeiro.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !user}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              {loading ? 'Validando...' : 'Ativar Vínculo na Clínica'}
            </button>
          </form>
        )}

        {/* FORM 4: NOVA CONTA INDIVIDUAL */}
        {mode === 'signup_user' && (
          <form onSubmit={handleRegisterUser} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Dra. Mariana Souza"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="email@clinica.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Senha *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Profissão *</label>
                <select
                  value={profession}
                  onChange={e => setProfession(e.target.value as Profession)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Fisioterapeuta">Fisioterapeuta (CREFITO)</option>
                  <option value="Psicólogo">Psicólogo (CRP)</option>
                  <option value="Médico">Médico (CRM)</option>
                  <option value="Nutricionista">Nutricionista (CRN)</option>
                  <option value="Enfermeiro">Enfermeiro (COREN)</option>
                  <option value="Estudante/Estagiário">Aluno / Estagiário</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {profession === 'Estudante/Estagiário' ? 'RGM / Reg. Acadêmico' : 'Registro do Conselho'}
                </label>
                <input
                  type="text"
                  placeholder={profession === 'Estudante/Estagiário' ? 'RGM-2024-XXXX' : 'Ex: CRM-SP 123456'}
                  value={register}
                  onChange={e => setRegister(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {profession === 'Estudante/Estagiário' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                <div>
                  <label className="block text-xs font-semibold mb-1">Instituição de Ensino</label>
                  <input
                    type="text"
                    placeholder="Universidade..."
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Supervisor Responsável</label>
                  <input
                    type="text"
                    placeholder="Nome do supervisor"
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-colors mt-2"
            >
              {loading ? 'Cadastrando...' : 'Criar Conta Profissional'}
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
