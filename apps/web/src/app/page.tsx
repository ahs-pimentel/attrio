'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/images/logo.png" alt="Attrio" className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-4">
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
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-attrio-navy mb-6 leading-tight">
                Gestão de Condomínios
                <span className="text-attrio-blue"> Simplificada</span>
              </h1>
              <p className="text-xl text-attrio-gray-600 mb-8">
                A plataforma completa para administrar seu condomínio com eficiência, transparência e segurança. Assembleias digitais, votações seguras e muito mais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-attrio-navy to-attrio-blue text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-attrio-lg transition-all text-center"
                >
                  Começar Gratuitamente
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
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-attrio-gray-600">
              Recursos completos para uma gestão eficiente
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-attrio-navy to-attrio-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se aos condomínios que já confiam na Attrio
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
                className="h-10 w-auto brightness-0 invert"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div className="text-white/70 text-sm">
              © 2026 Attrio. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '📅',
    title: 'Assembleias Digitais',
    description: 'Organize e conduza assembleias online com votações seguras e controle de presença.',
  },
  {
    icon: '🏢',
    title: 'Gestão de Unidades',
    description: 'Cadastre e gerencie todas as unidades do condomínio de forma organizada.',
  },
  {
    icon: '👥',
    title: 'Controle de Moradores',
    description: 'Mantenha um cadastro atualizado de todos os moradores e seus dados.',
  },
  {
    icon: '🗳️',
    title: 'Votação Segura',
    description: 'Sistema de votação com OTP e controle de procuração para máxima segurança.',
  },
  {
    icon: '📊',
    title: 'Relatórios Detalhados',
    description: 'Gere relatórios completos de assembleias, votações e participações.',
  },
  {
    icon: '🔒',
    title: 'Segurança Garantida',
    description: 'Proteção de dados e conformidade com LGPD para sua tranquilidade.',
  },
];
