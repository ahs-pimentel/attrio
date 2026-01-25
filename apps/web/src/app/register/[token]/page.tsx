'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { invitesApi, ValidateInviteResponse } from '@/lib/api';
import type { ResidentType, RelationshipType, PetType } from '@attrio/contracts';

type Step = 'info' | 'contacts' | 'household' | 'vehicles' | 'password';

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<ValidateInviteResponse['invite'] | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'OWNER' as ResidentType,
    fullName: '',
    rg: '',
    cpf: '',
    moveInDate: '',
    landlordName: '',
    landlordPhone: '',
    landlordEmail: '',
    emergencyContacts: [{ name: '', phone: '', isWhatsApp: true }],
    householdMembers: [] as Array<{ name: string; email: string; document: string; relationship: RelationshipType }>,
    vehicles: [] as Array<{ brand: string; model: string; color: string; plate: string }>,
    pets: [] as Array<{ name: string; type: PetType; breed: string; color: string }>,
    dataConsent: false,
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const response = await invitesApi.validate(token);
        if (response.valid && response.invite) {
          setInviteInfo(response.invite);
          setFormData((prev) => ({
            ...prev,
            fullName: response.invite!.name,
          }));
        } else {
          setError(response.error || 'Convite invalido ou expirado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao validar convite');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateInvite();
    }
  }, [token]);

  const steps: { key: Step; label: string }[] = [
    { key: 'info', label: 'Informacoes Pessoais' },
    { key: 'contacts', label: 'Contatos de Emergencia' },
    { key: 'household', label: 'Membros da Familia' },
    { key: 'vehicles', label: 'Veiculos e Pets' },
    { key: 'password', label: 'Criar Senha' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: '', phone: '', isWhatsApp: true }],
    });
  };

  const removeEmergencyContact = (index: number) => {
    setFormData({
      ...formData,
      emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== index),
    });
  };

  const addHouseholdMember = () => {
    setFormData({
      ...formData,
      householdMembers: [...formData.householdMembers, { name: '', email: '', document: '', relationship: 'SPOUSE' as RelationshipType }],
    });
  };

  const removeHouseholdMember = (index: number) => {
    setFormData({
      ...formData,
      householdMembers: formData.householdMembers.filter((_, i) => i !== index),
    });
  };

  const addVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [...formData.vehicles, { brand: '', model: '', color: '', plate: '' }],
    });
  };

  const removeVehicle = (index: number) => {
    setFormData({
      ...formData,
      vehicles: formData.vehicles.filter((_, i) => i !== index),
    });
  };

  const addPet = () => {
    setFormData({
      ...formData,
      pets: [...formData.pets, { name: '', type: 'DOG' as PetType, breed: '', color: '' }],
    });
  };

  const removePet = (index: number) => {
    setFormData({
      ...formData,
      pets: formData.pets.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas nao coincidem');
      return;
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!formData.dataConsent) {
      setError('Voce deve concordar com os termos de uso');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await invitesApi.completeRegistration({
        inviteToken: token,
        type: formData.type,
        fullName: formData.fullName,
        rg: formData.rg || undefined,
        cpf: formData.cpf || undefined,
        moveInDate: formData.moveInDate || undefined,
        landlordName: formData.type === 'TENANT' ? formData.landlordName : undefined,
        landlordPhone: formData.type === 'TENANT' ? formData.landlordPhone : undefined,
        landlordEmail: formData.type === 'TENANT' ? formData.landlordEmail : undefined,
        emergencyContacts: formData.emergencyContacts.filter((c) => c.name && c.phone),
        householdMembers: formData.householdMembers
          .filter((m) => m.name)
          .map((m) => ({
            name: m.name,
            email: m.email || undefined,
            document: m.document || undefined,
            relationship: m.relationship as RelationshipType,
          })),
        vehicles: formData.vehicles.filter((v) => v.plate),
        pets: formData.pets
          .filter((p) => p.name)
          .map((p) => ({
            name: p.name,
            type: p.type as PetType,
            breed: p.breed || undefined,
            color: p.color || undefined,
          })),
        dataConsent: formData.dataConsent,
        password: formData.password,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao completar registro');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Convite Indisponivel</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cadastro Concluido!</h2>
            <p className="text-gray-600 mb-4">
              Seu cadastro foi realizado com sucesso. Voce ja pode acessar o sistema.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cadastro de Morador</h1>
          <p className="text-gray-600">{inviteInfo?.tenantName}</p>
          <p className="text-sm text-gray-500">Unidade: {inviteInfo?.unitIdentifier}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center mt-2 text-sm text-gray-600">
            {steps[currentStepIndex].label}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardContent>
            {/* Step 1: Info */}
            {currentStep === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Morador
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ResidentType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OWNER">Proprietario</option>
                    <option value="TENANT">Inquilino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                    <input
                      type="text"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Mudanca
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.type === 'TENANT' && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">Dados do Proprietario</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                        type="text"
                        value={formData.landlordName}
                        onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="tel"
                          value={formData.landlordPhone}
                          onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.landlordEmail}
                          onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Emergency Contacts */}
            {currentStep === 'contacts' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Adicione pelo menos um contato de emergencia.
                </p>
                {formData.emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Contato {index + 1}</span>
                      {formData.emergencyContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmergencyContact(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...formData.emergencyContacts];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, emergencyContacts: updated });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        placeholder="Telefone"
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...formData.emergencyContacts];
                          updated[index].phone = e.target.value;
                          setFormData({ ...formData, emergencyContacts: updated });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={contact.isWhatsApp}
                        onChange={(e) => {
                          const updated = [...formData.emergencyContacts];
                          updated[index].isWhatsApp = e.target.checked;
                          setFormData({ ...formData, emergencyContacts: updated });
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">Possui WhatsApp</span>
                    </label>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addEmergencyContact} className="w-full">
                  Adicionar Contato
                </Button>
              </div>
            )}

            {/* Step 3: Household Members */}
            {currentStep === 'household' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Adicione os membros da familia que moram na unidade (opcional).
                </p>
                {formData.householdMembers.map((member, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Membro {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeHouseholdMember(index)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...formData.householdMembers];
                        updated[index].name = e.target.value;
                        setFormData({ ...formData, householdMembers: updated });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="email"
                        placeholder="Email (opcional)"
                        value={member.email}
                        onChange={(e) => {
                          const updated = [...formData.householdMembers];
                          updated[index].email = e.target.value;
                          setFormData({ ...formData, householdMembers: updated });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={member.relationship}
                        onChange={(e) => {
                          const updated = [...formData.householdMembers];
                          updated[index].relationship = e.target.value as RelationshipType;
                          setFormData({ ...formData, householdMembers: updated });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SPOUSE">Conjuge</option>
                        <option value="CHILD">Filho(a)</option>
                        <option value="PARENT">Pai/Mae</option>
                        <option value="SIBLING">Irmao(a)</option>
                        <option value="OTHER">Outro</option>
                      </select>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addHouseholdMember} className="w-full">
                  Adicionar Membro
                </Button>
              </div>
            )}

            {/* Step 4: Vehicles & Pets */}
            {currentStep === 'vehicles' && (
              <div className="space-y-6">
                {/* Vehicles */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Veiculos</h4>
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Veiculo {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVehicle(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Marca"
                          value={vehicle.brand}
                          onChange={(e) => {
                            const updated = [...formData.vehicles];
                            updated[index].brand = e.target.value;
                            setFormData({ ...formData, vehicles: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Modelo"
                          value={vehicle.model}
                          onChange={(e) => {
                            const updated = [...formData.vehicles];
                            updated[index].model = e.target.value;
                            setFormData({ ...formData, vehicles: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Cor"
                          value={vehicle.color}
                          onChange={(e) => {
                            const updated = [...formData.vehicles];
                            updated[index].color = e.target.value;
                            setFormData({ ...formData, vehicles: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Placa"
                          value={vehicle.plate}
                          onChange={(e) => {
                            const updated = [...formData.vehicles];
                            updated[index].plate = e.target.value;
                            setFormData({ ...formData, vehicles: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={addVehicle} className="w-full">
                    Adicionar Veiculo
                  </Button>
                </div>

                {/* Pets */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Pets</h4>
                  {formData.pets.map((pet, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Pet {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removePet(index)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Nome"
                          value={pet.name}
                          onChange={(e) => {
                            const updated = [...formData.pets];
                            updated[index].name = e.target.value;
                            setFormData({ ...formData, pets: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={pet.type}
                          onChange={(e) => {
                            const updated = [...formData.pets];
                            updated[index].type = e.target.value as PetType;
                            setFormData({ ...formData, pets: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DOG">Cachorro</option>
                          <option value="CAT">Gato</option>
                          <option value="BIRD">Passaro</option>
                          <option value="FISH">Peixe</option>
                          <option value="OTHER">Outro</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Raca (opcional)"
                          value={pet.breed}
                          onChange={(e) => {
                            const updated = [...formData.pets];
                            updated[index].breed = e.target.value;
                            setFormData({ ...formData, pets: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Cor (opcional)"
                          value={pet.color}
                          onChange={(e) => {
                            const updated = [...formData.pets];
                            updated[index].color = e.target.value;
                            setFormData({ ...formData, pets: updated });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={addPet} className="w-full">
                    Adicionar Pet
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Password */}
            {currentStep === 'password' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimo 8 caracteres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a senha novamente"
                    required
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.dataConsent}
                      onChange={(e) => setFormData({ ...formData, dataConsent: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Concordo com os termos de uso e autorizo o tratamento dos meus dados pessoais
                      conforme a Lei Geral de Protecao de Dados (LGPD).
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {currentStepIndex > 0 ? (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  Voltar
                </Button>
              ) : (
                <div />
              )}
              {currentStepIndex < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Proximo
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} loading={submitting}>
                  Finalizar Cadastro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
