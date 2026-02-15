'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { QrCodeData } from '@/lib/api';
import { otpApi } from '@/lib/api';

interface OtpData {
  otp: string;
  expiresAt: string;
  remainingSeconds: number;
}

interface QRCodeGeneratorProps {
  assemblyId: string;
  assemblyTitle: string;
  qrCodeData: QrCodeData | null;
  onGenerate: () => Promise<QrCodeData>;
}

/**
 * QRCodeGenerator - Componente para gerar e exibir QR Code de check-in
 */
export function QRCodeGenerator({
  assemblyId,
  assemblyTitle,
  qrCodeData,
  onGenerate,
}: QRCodeGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localQrData, setLocalQrData] = useState<QrCodeData | null>(qrCodeData);
  const [otpData, setOtpData] = useState<OtpData | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setLocalQrData(qrCodeData);
  }, [qrCodeData]);

  // Countdown timer para OTP
  useEffect(() => {
    if (!otpData) {
      setCountdown(0);
      return;
    }

    const expiresAt = new Date(otpData.expiresAt).getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setOtpData(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [otpData]);

  const generateOtp = useCallback(async () => {
    try {
      setOtpLoading(true);
      const data = await otpApi.generateCheckinOtp(assemblyId);
      setOtpData(data);
    } catch (err) {
      console.error('Erro ao gerar OTP:', err);
    } finally {
      setOtpLoading(false);
    }
  }, [assemblyId]);

  // Buscar OTP existente ao montar (caso ja tenha sido gerado)
  useEffect(() => {
    if (localQrData) {
      otpApi.getCheckinOtp(assemblyId).then(data => {
        if (data) setOtpData(data);
      }).catch(() => {});
    }
  }, [assemblyId, localQrData]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await onGenerate();
      setLocalQrData(data);
      // Auto-gerar OTP junto com o QR Code
      await generateOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    if (!localQrData?.checkinUrl) return;
    try {
      await navigator.clipboard.writeText(localQrData.checkinUrl);
      alert('Link copiado para a area de transferencia!');
    } catch {
      const input = document.createElement('input');
      input.value = localQrData.checkinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('Link copiado!');
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code de Check-in</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!localQrData ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Gere um QR Code para permitir que participantes facam check-in na assembleia usando seus dispositivos moveis.
            </p>
            <Button onClick={handleGenerate} loading={loading}>
              Iniciar Check-in
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* OTP Display */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-center text-white">
              <p className="text-sm font-medium text-blue-100 mb-2">
                Codigo de Check-in (OTP)
              </p>
              {otpData ? (
                <>
                  <p className="text-5xl font-mono font-bold tracking-[0.3em] mb-3">
                    {otpData.otp}
                  </p>
                  <p className={`text-sm ${countdown <= 60 ? 'text-red-200' : 'text-blue-200'}`}>
                    Expira em {formatCountdown(countdown)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateOtp}
                    loading={otpLoading}
                    className="mt-3 text-white border-white/30 hover:bg-white/10"
                  >
                    Gerar Novo Codigo
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg text-blue-200 mb-3">Nenhum codigo ativo</p>
                  <Button
                    onClick={generateOtp}
                    loading={otpLoading}
                    className="bg-white text-blue-700 hover:bg-blue-50"
                  >
                    Gerar Codigo OTP
                  </Button>
                </>
              )}
            </div>

            <p className="text-center text-sm text-gray-500">
              Exiba este codigo para os participantes digitarem na tela de check-in
            </p>

            {/* QR Code */}
            <div className="flex justify-center print:p-8">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 print:border-4 print:border-black">
                <QRCodeSVG
                  value={localQrData.checkinUrl}
                  size={256}
                  level="H"
                  includeMargin
                  className="print:w-64 print:h-64"
                />
              </div>
            </div>

            {/* Informacoes */}
            <div className="text-center print:mt-4">
              <h3 className="font-semibold text-lg text-gray-900 print:text-2xl">
                {assemblyTitle}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Escaneie o QR Code para fazer check-in
              </p>
            </div>

            {/* Link */}
            <div className="bg-gray-50 rounded-lg p-4 print:hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de Check-in
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localQrData.checkinUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600"
                />
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                  Copiar
                </Button>
              </div>
            </div>

            {/* Acoes */}
            <div className="flex justify-center gap-3 print:hidden">
              <Button variant="secondary" onClick={handlePrint}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                  />
                </svg>
                Imprimir
              </Button>
              <Button variant="ghost" onClick={handleGenerate} loading={loading}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Gerar Novo QR
              </Button>
            </div>

            {/* Instrucoes */}
            <div className="bg-blue-50 rounded-lg p-4 print:hidden">
              <h4 className="font-medium text-blue-900 mb-2">Instrucoes</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Compartilhe o link ou QR Code com os participantes</li>
                <li>2. Informe o codigo OTP exibido acima para digitarem na tela de check-in</li>
                <li>3. O codigo OTP expira a cada 10 minutos - gere um novo quando necessario</li>
                <li>4. Os participantes informam a unidade e o codigo para confirmar presenca</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * QRCodeMini - Versao compacta do QR Code
 */
interface QRCodeMiniProps {
  url: string;
  size?: number;
}

export function QRCodeMini({ url, size = 128 }: QRCodeMiniProps) {
  return (
    <div className="inline-block bg-white p-2 rounded-lg border border-gray-200">
      <QRCodeSVG value={url} size={size} level="M" />
    </div>
  );
}
