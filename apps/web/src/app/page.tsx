'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default function LandingPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm border-b border-attrio-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img src="/images/logo.png" alt="Attrio" className="h-14 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#pricing"
                className="hidden sm:inline text-attrio-navy hover:text-attrio-blue font-medium transition-colors"
              >
                Planos
              </a>
              <Link
                href="/login"
                className="text-attrio-navy hover:text-attrio-blue font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="bg-gradient-to-r from-attrio-navy to-attrio-blue text-white px-6 py-2 rounded-lg font-semibold hover:shadow-attrio-lg transition-all"
              >
                Comecar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-attrio-navy mb-6 leading-tight">
                Gestao de Condominios
                <span className="text-attrio-blue"> Simplificada</span>
              </h1>
              <p className="text-xl text-attrio-gray-600 mb-8">
                A plataforma completa para administrar seu condominio com eficiencia, transparencia e seguranca. Assembleias digitais, votacoes seguras e muito mais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-attrio-navy to-attrio-blue text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-attrio-lg transition-all text-center"
                >
                  Comecar Gratuitamente
                </Link>
                <a
                  href="#features"
                  className="border-2 border-attrio-navy text-attrio-navy px-8 py-4 rounded-lg font-semibold text-lg hover:bg-attrio-navy hover:text-white transition-all text-center"
                >
                  Conhecer Recursos
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-attrio-navy to-attrio-blue rounded-2xl p-8 shadow-attrio-lg">
                <img
                  src="/images/logo.png"
                  alt="Dashboard Preview"
                  className="w-full brightness-0 invert opacity-20"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-attrio-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-attrio-navy mb-4">
              Tudo que voce precisa em um so lugar
            </h2>
            <p className="text-xl text-attrio-gray-600">
              Recursos completos para uma gestao eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-attrio hover:shadow-attrio-lg transition-all border border-attrio-gray-100"
              >
                <div className="bg-gradient-to-br from-attrio-navy to-attrio-blue w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-attrio-navy mb-3">
                  {feature.title}
                </h3>
                <p className="text-attrio-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-attrio-navy mb-4">
              Planos para cada condominio
            </h2>
            <p className="text-xl text-attrio-gray-600">
              Comece gratis e escale conforme sua necessidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 transition-all ${
                  plan.popular
                    ? 'border-attrio-blue shadow-attrio-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-attrio'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-attrio-navy to-attrio-blue text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-attrio-navy mt-1">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  {plan.price === 0 ? (
                    <p className="text-4xl font-bold text-attrio-navy">Gratis</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-bold text-attrio-navy">
                        {formatPrice(plan.price)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">por mes</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 font-medium mb-6">
                  Ate <strong>{plan.maxUnits}</strong> unidades
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-attrio-green mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-attrio-navy to-attrio-blue text-white hover:shadow-attrio-lg'
                      : 'border-2 border-attrio-navy text-attrio-navy hover:bg-attrio-navy hover:text-white'
                  }`}
                >
                  {plan.price === 0 ? 'Comecar Gratis' : 'Assinar Agora'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-attrio-navy to-attrio-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para comecar?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se aos condominios que ja confiam na Attrio
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-attrio-navy px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-attrio-lg transition-all"
          >
            Criar Conta Gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-attrio-navy py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img
                src="/images/logo.png"
                alt="Attrio"
                className="h-12 w-auto brightness-0 invert"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div className="text-white/70 text-sm">
              &copy; 2026 Attrio. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '\uD83D\uDCC5',
    title: 'Assembleias Digitais',
    description: 'Organize e conduza assembleias online com votacoes seguras e controle de presenca.',
  },
  {
    icon: '\uD83C\uDFE2',
    title: 'Gestao de Unidades',
    description: 'Cadastre e gerencie todas as unidades do condominio de forma organizada.',
  },
  {
    icon: '\uD83D\uDC65',
    title: 'Controle de Moradores',
    description: 'Mantenha um cadastro atualizado de todos os moradores e seus dados.',
  },
  {
    icon: '\uD83D\uDDF3\uFE0F',
    title: 'Votacao Segura',
    description: 'Sistema de votacao com OTP e controle de procuracao para maxima seguranca.',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Relatorios Detalhados',
    description: 'Gere relatorios completos de assembleias, votacoes e participacoes.',
  },
  {
    icon: '\uD83D\uDD12',
    title: 'Seguranca Garantida',
    description: 'Protecao de dados e conformidade com LGPD para sua tranquilidade.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: 0,
    maxUnits: 30,
    popular: false,
    features: [
      'Ate 30 unidades',
      'Comunicados',
      'Ocorrencias',
      'Reservas',
      'Assembleias (1/mes)',
    ],
  },
  {
    name: 'Basico',
    price: 9900,
    maxUnits: 60,
    popular: false,
    features: [
      'Ate 60 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias (3/mes)',
      'Relatorios completos',
    ],
  },
  {
    name: 'Profissional',
    price: 19900,
    maxUnits: 150,
    popular: true,
    features: [
      'Ate 150 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias ilimitadas',
      'Relatorios completos',
      'Suporte prioritario',
    ],
  },
  {
    name: 'Enterprise',
    price: 39900,
    maxUnits: 500,
    popular: false,
    features: [
      'Ate 500 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias ilimitadas',
      'Relatorios completos',
      'Suporte dedicado',
    ],
  },
];
