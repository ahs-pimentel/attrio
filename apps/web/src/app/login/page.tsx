'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Verifique seu email para confirmar o cadastro');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          router.push('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-attrio-navy via-attrio-blue to-attrio-blue-light items-center justify-center p-12">
        <div className="max-w-md text-white">
          <img
            src="/images/logo.png"
            alt="Attrio"
            className="h-20 w-auto mb-8 brightness-0 invert"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h1 className="text-4xl font-bold mb-4">
            Gestão de Condomínios & Assembleias
          </h1>
          <p className="text-lg text-white/90">
            A plataforma completa para administrar seu condomínio de forma eficiente e transparente.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-attrio-green rounded-lg p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Assembleias Digitais</h3>
                <p className="text-sm text-white/80">Organize e gerencie assembleias com votação segura</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-attrio-green rounded-lg p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Gestão Completa</h3>
                <p className="text-sm text-white/80">Controle de unidades, moradores e documentos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-attrio-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-attrio-lg p-8 border border-attrio-gray-100">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-6 text-center">
              <img
                src="/images/logo.png"
                alt="Attrio"
                className="h-12 w-auto mx-auto"
              />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-attrio-navy mb-2">
                {isSignUp ? 'Criar nova conta' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-attrio-gray-500">
                {isSignUp ? 'Preencha os dados para começar' : 'Entre com suas credenciais'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-attrio-navy mb-1">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border border-attrio-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-attrio-blue focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-attrio-navy mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 border border-attrio-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-attrio-blue focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-attrio-navy mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-attrio-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-attrio-blue focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-attrio-navy to-attrio-blue text-white py-3 px-4 rounded-lg font-semibold hover:shadow-attrio-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-attrio-gray-600">
                {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-attrio-blue font-semibold hover:text-attrio-navy transition-colors"
                >
                  {isSignUp ? 'Entrar' : 'Criar conta'}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-attrio-gray-500 hover:text-attrio-navy transition-colors">
              ← Voltar para o início
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
