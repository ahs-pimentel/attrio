'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { assembliesApi, attendanceApi, otpApi, agendaItemsApi } from '@/lib/api';
import { AssemblyStatus, AgendaItemStatus } from '@attrio/contracts';

interface AssemblyData {
  id: string;
  title: string;
  status: AssemblyStatus;
  scheduledAt: string;
}

interface OtpData {
  otp: string;
  expiresAt: string;
  remainingSeconds: number;
}

interface AttendanceData {
  totalUnits: number;
  currentlyPresent: number;
  quorumPercentage: number;
}

interface AgendaItemData {
  id: string;
  title: string;
  status: AgendaItemStatus;
}

export default function ProjectorPage() {
  const params = useParams();
  const assemblyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assembly, setAssembly] = useState<AssemblyData | null>(null);
  const [checkinToken, setCheckinToken] = useState<string | null>(null);
  const [checkinOtp, setCheckinOtp] = useState<OtpData | null>(null);
  const [votingOtp, setVotingOtp] = useState<OtpData | null>(null);
  const [votingItem, setVotingItem] = useState<AgendaItemData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [countdown, setCountdown] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Busca dados da assembleia
      const assemblyData = await assembliesApi.getById(assemblyId);
      setAssembly(assemblyData);

      // Busca status de presenca
      const attendanceData = await attendanceApi.getStatus(assemblyId);
      setAttendance(attendanceData);

      // Busca OTP de check-in
      const checkinOtpData = await otpApi.getCheckinOtp(assemblyId);
      setCheckinOtp(checkinOtpData);

      // Busca pautas para verificar se ha votacao em andamento
      const agendaItems = await agendaItemsApi.list(assemblyId);
      const currentVotingItem = agendaItems.find(item => item.status === AgendaItemStatus.VOTING);

      if (currentVotingItem) {
        setVotingItem(currentVotingItem);
        // Busca OTP da votacao
        const votingOtpData = await otpApi.getVotingOtp(assemblyId, currentVotingItem.id);
        setVotingOtp(votingOtpData);
      } else {
        setVotingItem(null);
        setVotingOtp(null);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  }, [assemblyId]);

  // Gera token de check-in se nao existir
  const generateCheckinToken = useCallback(async () => {
    try {
      const data = await attendanceApi.generateToken(assemblyId);
      setCheckinToken(data.checkinToken);
    } catch (err) {
      console.error('Erro ao gerar token:', err);
    }
  }, [assemblyId]);

  // Inicializacao
  useEffect(() => {
    const init = async () => {
      try {
        await fetchData();
        await generateCheckinToken();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    init();

    // Atualiza dados a cada 5 segundos
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, generateCheckinToken]);

  // Countdown timer
  useEffect(() => {
    const activeOtp = votingOtp || checkinOtp;
    if (activeOtp) {
      const expiresAt = new Date(activeOtp.expiresAt).getTime();
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(remaining);
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [checkinOtp, votingOtp]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCheckinUrl = () => {
    if (typeof window !== 'undefined' && checkinToken) {
      return `${window.location.origin}/checkin/${checkinToken}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Erro</h1>
          <p className="text-xl text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Determina qual OTP exibir (votacao tem prioridade)
  const activeOtp = votingOtp || checkinOtp;
  const isVoting = !!votingItem && !!votingOtp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{assembly?.title}</h1>
          <p className="text-xl text-gray-300">
            {assembly?.status === AssemblyStatus.IN_PROGRESS ? 'Assembleia em Andamento' : 'Aguardando Inicio'}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code + Check-in */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-6">Check-in</h2>

            {checkinToken ? (
              <div className="bg-white p-6 rounded-2xl mb-6">
                <QRCodeSVG
                  value={getCheckinUrl()}
                  size={280}
                  level="H"
                  includeMargin
                />
              </div>
            ) : (
              <div className="w-[280px] h-[280px] bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
                <p className="text-gray-400">Gerando QR Code...</p>
              </div>
            )}

            <p className="text-gray-300 text-center">
              Escaneie o QR Code para fazer check-in
            </p>
          </div>

          {/* OTP Display */}
          <div className={`backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center ${
            isVoting ? 'bg-green-600/20' : 'bg-white/10'
          }`}>
            <h2 className="text-2xl font-semibold mb-2">
              {isVoting ? 'Votacao em Andamento' : 'Codigo de Acesso'}
            </h2>

            {isVoting && votingItem && (
              <p className="text-xl text-green-300 mb-4 text-center">
                {votingItem.title}
              </p>
            )}

            {activeOtp ? (
              <>
                <div className="bg-black/30 rounded-2xl px-12 py-8 mb-6">
                  <p className="text-8xl font-mono font-bold tracking-[0.3em] text-center">
                    {activeOtp.otp}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${
                    countdown > 60 ? 'bg-green-500' : countdown > 30 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                  }`}></div>
                  <p className="text-3xl font-mono">
                    {formatCountdown(countdown)}
                  </p>
                </div>

                <p className="text-gray-400 mt-4 text-center">
                  {isVoting ? 'Digite este codigo para votar' : 'Digite este codigo para fazer check-in'}
                </p>
              </>
            ) : (
              <div className="bg-black/30 rounded-2xl px-12 py-8 mb-6">
                <p className="text-4xl text-gray-500 text-center">
                  OTP nao gerado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Stats */}
        {attendance && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-3xl p-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl font-bold text-blue-400">{attendance.currentlyPresent}</p>
                <p className="text-gray-400 mt-2">Presentes</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-green-400">{attendance.quorumPercentage.toFixed(1)}%</p>
                <p className="text-gray-400 mt-2">Quorum</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-gray-400">{attendance.totalUnits}</p>
                <p className="text-gray-400 mt-2">Total de Unidades</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Attrio - Sistema de Gestao de Assembleias</p>
        </div>
      </div>
    </div>
  );
}
