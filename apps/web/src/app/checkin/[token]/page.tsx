'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { attendanceApi } from '@/lib/api';
import { ParticipantApprovalStatus } from '@attrio/contracts';

interface AssemblyInfo {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  tenantName: string;
}

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assembly, setAssembly] = useState<AssemblyInfo | null>(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [formData, setFormData] = useState({
    otp: '',
    unitId: '',
    isProxy: false,
    proxyName: '',
    proxyDocument: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{
    participantId: string;
    unitIdentifier: string;
    checkinTime: string;
    sessionToken: string;
    approvalStatus: ParticipantApprovalStatus;
    isProxy: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        setValidating(true);
        const response = await attendanceApi.validateToken(token);

        if (response.valid && response.assembly) {
          setAssembly(response.assembly);
          setRequiresOtp(response.requiresOtp);
        } else {
          setError('Token de check-in invalido ou expirado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao validar token');
      } finally {
        setValidating(false);
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Valida OTP antes de enviar se necessario
    if (requiresOtp && formData.otp.length !== 6) {
      setError('Informe o codigo OTP de 6 digitos');
      setSubmitting(false);
      return;
    }

    try {
      const response = await attendanceApi.checkin({
        checkinToken: token,
        otp: formData.otp,
        unitIdentifier: formData.unitId,
        proxyName: formData.isProxy ? formData.proxyName : undefined,
        proxyDocument: formData.isProxy ? formData.proxyDocument : undefined,
      });

      if (response.success) {
        setSuccess(true);
        setCheckinResult({
          participantId: response.participantId,
          unitIdentifier: response.unitIdentifier,
          checkinTime: response.checkinTime,
          sessionToken: response.sessionToken,
          approvalStatus: response.approvalStatus,
          isProxy: response.isProxy,
          message: response.message,
        });

        // Redireciona para area do participante apos 3 segundos
        setTimeout(() => {
          router.push(`/assembly/${response.sessionToken}`);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !assembly) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check-in Indisponivel</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && checkinResult) {
    const isPending = checkinResult.approvalStatus === ParticipantApprovalStatus.PENDING;

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isPending ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {isPending ? (
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isPending ? 'Aguardando Aprovacao' : 'Check-in Realizado!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {checkinResult.message || 'Sua presenca foi registrada com sucesso.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Assembleia:</span>
                <span className="font-medium">{assembly?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidade:</span>
                <span className="font-medium">{checkinResult.unitIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horario:</span>
                <span className="font-medium">{formatDateTime(checkinResult.checkinTime)}</span>
              </div>
              {checkinResult.isProxy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium text-amber-600">Procurador</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${
                  isPending ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {isPending ? 'Pendente' : 'Aprovado'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Voce sera redirecionado para a area de votacao...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <CardTitle>Check-in de Assembleia</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assembly && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-1">{assembly.title}</h3>
              <p className="text-sm text-blue-700">{assembly.tenantName}</p>
              <p className="text-sm text-blue-600 mt-1">{formatDateTime(assembly.scheduledAt)}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codigo OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData({ ...formData, otp: value });
                }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                required
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite o codigo de 6 digitos exibido na tela da assembleia
              </p>
              {!requiresOtp && (
                <p className="text-xs text-amber-600 mt-1">
                  Aguarde o sindico iniciar o check-in e exibir o codigo OTP
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificador da Unidade
              </label>
              <input
                type="text"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: A-101"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Informe o identificador da sua unidade (bloco e numero)
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isProxy"
                checked={formData.isProxy}
                onChange={(e) => setFormData({ ...formData, isProxy: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isProxy" className="ml-2 text-sm text-gray-700">
                Estou representando outra pessoa (procuracao)
              </label>
            </div>

            {formData.isProxy && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Representante
                  </label>
                  <input
                    type="text"
                    value={formData.proxyName}
                    onChange={(e) => setFormData({ ...formData, proxyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome completo"
                    required={formData.isProxy}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documento do Representante
                  </label>
                  <input
                    type="text"
                    value={formData.proxyDocument}
                    onChange={(e) => setFormData({ ...formData, proxyDocument: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CPF ou RG"
                    required={formData.isProxy}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" loading={submitting}>
              Confirmar Presenca
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
