'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { authApi } from '@/lib/api/auth';
import { residentsApi, ResidentResponse } from '@/lib/api/residents';
import { unitsApi, UnitResponse } from '@/lib/api/units';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { PetType, RelationshipType, ResidentType } from '@attrio/contracts';

const petTypeLabels: Record<string, string> = {
  DOG: 'Cachorro', CAT: 'Gato', BIRD: 'Passaro', FISH: 'Peixe', OTHER: 'Outro',
};
const relationshipLabels: Record<string, string> = {
  SPOUSE: 'Conjuge', CHILD: 'Filho(a)', PARENT: 'Pai/Mae', SIBLING: 'Irmao(a)', OTHER: 'Outro',
};
const residentTypeLabels: Record<string, string> = {
  OWNER: 'Proprietario', TENANT: 'Inquilino',
};

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuthContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resident data
  const [resident, setResident] = useState<ResidentResponse | null>(null);
  const [residentLoading, setResidentLoading] = useState(true);

  // Units for registration
  const [units, setUnits] = useState<UnitResponse[]>([]);

  // Modal states
  const [modalType, setModalType] = useState<'register' | 'contact' | 'member' | 'employee' | 'vehicle' | 'pet' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    unitId: '', type: 'OWNER' as ResidentType, fullName: '', email: '', phone: '', cpf: '', rg: '',
  });

  // Sub-entity forms
  const [contactForm, setContactForm] = useState({ name: '', phone: '', isWhatsApp: false });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', document: '', relationship: 'SPOUSE' as RelationshipType });
  const [employeeForm, setEmployeeForm] = useState({ name: '', document: '' });
  const [vehicleForm, setVehicleForm] = useState({ brand: '', model: '', color: '', plate: '' });
  const [petForm, setPetForm] = useState({ name: '', type: 'DOG' as PetType, breed: '', color: '' });

  useEffect(() => {
    if (profile) setEmail(profile.email || '');
  }, [profile]);

  useEffect(() => {
    if (user) setName((user.user_metadata?.name as string) || '');
  }, [user]);

  useEffect(() => {
    if (!profile?.userId) return;
    import('@/lib/api/users').then(({ usersApi }) => {
      if (profile.userId) {
        usersApi.getById(profile.userId).then((u) => {
          setName(u.name);
          setEmail(u.email);
        }).catch(() => {});
      }
    });
  }, [profile?.userId]);

  const loadResident = useCallback(async () => {
    try {
      const data = await residentsApi.getMe();
      setResident(data);
    } catch {
      setResident(null);
    } finally {
      setResidentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.userId) {
      loadResident();
    } else {
      setResidentLoading(false);
    }
  }, [profile?.userId, loadResident]);

  // Load units when opening registration modal
  const openRegisterModal = async () => {
    setModalType('register');
    setRegisterForm({ ...registerForm, fullName: name, email });
    try {
      const unitsList = await unitsApi.list();
      setUnits(unitsList);
    } catch {
      setUnits([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await authApi.updateProfile({ name: name.trim(), email: email.trim() });
      await refreshProfile();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      SAAS_ADMIN: 'Administrador', SYNDIC: 'Sindico', DOORMAN: 'Porteiro', RESIDENT: 'Morador',
    };
    return role ? (labels[role] || role) : '-';
  };

  // Self-registration handler
  const handleRegister = async () => {
    setModalLoading(true);
    setError(null);
    try {
      await residentsApi.createMe({
        unitId: registerForm.unitId,
        type: registerForm.type,
        fullName: registerForm.fullName,
        email: registerForm.email || undefined,
        phone: registerForm.phone || undefined,
        cpf: registerForm.cpf || undefined,
        rg: registerForm.rg || undefined,
      });
      await loadResident();
      setModalType(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar morador');
    } finally {
      setModalLoading(false);
    }
  };

  // Generic remove handler
  const handleRemove = async (type: string, itemId: string) => {
    if (!resident) return;
    try {
      switch (type) {
        case 'contact': await residentsApi.removeContact(resident.id, itemId); break;
        case 'member': await residentsApi.removeMember(resident.id, itemId); break;
        case 'employee': await residentsApi.removeEmployee(resident.id, itemId); break;
        case 'vehicle': await residentsApi.removeVehicle(resident.id, itemId); break;
        case 'pet': await residentsApi.removePet(resident.id, itemId); break;
      }
      await loadResident();
    } catch {
      setError('Erro ao remover item');
    }
  };

  // Add handlers
  const handleAddContact = async () => {
    if (!resident) return;
    setModalLoading(true);
    try {
      await residentsApi.addContact(resident.id, contactForm);
      await loadResident();
      setModalType(null);
      setContactForm({ name: '', phone: '', isWhatsApp: false });
    } catch { setError('Erro ao adicionar contato'); }
    finally { setModalLoading(false); }
  };

  const handleAddMember = async () => {
    if (!resident) return;
    setModalLoading(true);
    try {
      await residentsApi.addMember(resident.id, {
        name: memberForm.name, email: memberForm.email || undefined,
        document: memberForm.document || undefined, relationship: memberForm.relationship,
      });
      await loadResident();
      setModalType(null);
      setMemberForm({ name: '', email: '', document: '', relationship: 'SPOUSE' as RelationshipType });
    } catch { setError('Erro ao adicionar membro'); }
    finally { setModalLoading(false); }
  };

  const handleAddEmployee = async () => {
    if (!resident) return;
    setModalLoading(true);
    try {
      await residentsApi.addEmployee(resident.id, { name: employeeForm.name, document: employeeForm.document || undefined });
      await loadResident();
      setModalType(null);
      setEmployeeForm({ name: '', document: '' });
    } catch { setError('Erro ao adicionar funcionario'); }
    finally { setModalLoading(false); }
  };

  const handleAddVehicle = async () => {
    if (!resident) return;
    setModalLoading(true);
    try {
      await residentsApi.addVehicle(resident.id, vehicleForm);
      await loadResident();
      setModalType(null);
      setVehicleForm({ brand: '', model: '', color: '', plate: '' });
    } catch { setError('Erro ao adicionar veiculo'); }
    finally { setModalLoading(false); }
  };

  const handleAddPet = async () => {
    if (!resident) return;
    setModalLoading(true);
    try {
      await residentsApi.addPet(resident.id, {
        name: petForm.name, type: petForm.type, breed: petForm.breed || undefined, color: petForm.color || undefined,
      });
      await loadResident();
      setModalType(null);
      setPetForm({ name: '', type: 'DOG' as PetType, breed: '', color: '' });
    } catch { setError('Erro ao adicionar pet'); }
    finally { setModalLoading(false); }
  };

  // Section renderer helper
  const renderSection = (
    title: string,
    items: { id: string; [key: string]: unknown }[] | undefined,
    type: string,
    addType: 'contact' | 'member' | 'employee' | 'vehicle' | 'pet',
    emptyMessage: string,
    renderItem: (item: Record<string, unknown>) => React.ReactNode,
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button size="sm" onClick={() => setModalType(addType)}>Adicionar</Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!items || items.length === 0) ? (
          <p className="text-gray-500 text-sm py-4 text-center">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                {renderItem(item as Record<string, unknown>)}
                <button onClick={() => handleRemove(type, item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium ml-4 shrink-0">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informacoes pessoais</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Informacoes da conta */}
        <Card>
          <CardHeader><CardTitle>Informacoes da Conta</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?')}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{name || '-'}</p>
                <p className="text-sm text-gray-500">{email || '-'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {getRoleLabel(profile?.role)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edicao */}
        <Card>
          <CardHeader><CardTitle>Editar Dados</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Perfil atualizado com sucesso!</div>}
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={loading}>Salvar alteracoes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resident data sections */}
        {residentLoading ? (
          <Card><CardContent><div className="py-8 text-center text-gray-500">Carregando dados do morador...</div></CardContent></Card>
        ) : resident ? (
          <>
            {renderSection('Contatos de Emergencia', resident.emergencyContacts as { id: string; [key: string]: unknown }[] | undefined, 'contact', 'contact', 'Nenhum contato de emergencia cadastrado',
              (item) => (
                <div>
                  <p className="font-medium text-gray-900">{item.name as string}</p>
                  <p className="text-sm text-gray-500">
                    {item.phone as string}
                    {!!item.isWhatsApp && <span className="ml-2 text-green-600 text-xs font-medium">WhatsApp</span>}
                  </p>
                </div>
              )
            )}

            {renderSection('Membros do Domicilio', resident.householdMembers as { id: string; [key: string]: unknown }[] | undefined, 'member', 'member', 'Nenhum membro cadastrado',
              (item) => (
                <div>
                  <p className="font-medium text-gray-900">{item.name as string}</p>
                  <p className="text-sm text-gray-500">
                    {relationshipLabels[item.relationship as string] || item.relationship as string}
                    {!!item.email && ` - ${item.email as string}`}
                  </p>
                </div>
              )
            )}

            {renderSection('Funcionarios da Unidade', resident.employees as { id: string; [key: string]: unknown }[] | undefined, 'employee', 'employee', 'Nenhum funcionario cadastrado',
              (item) => (
                <div>
                  <p className="font-medium text-gray-900">{item.name as string}</p>
                  {!!item.document && <p className="text-sm text-gray-500">{item.document as string}</p>}
                </div>
              )
            )}

            {renderSection('Veiculos', resident.vehicles as { id: string; [key: string]: unknown }[] | undefined, 'vehicle', 'vehicle', 'Nenhum veiculo cadastrado',
              (item) => (
                <div>
                  <p className="font-medium text-gray-900">{item.brand as string} {item.model as string}</p>
                  <p className="text-sm text-gray-500">{item.color as string} - Placa: {item.plate as string}</p>
                </div>
              )
            )}

            {renderSection('Pets', resident.pets as { id: string; [key: string]: unknown }[] | undefined, 'pet', 'pet', 'Nenhum pet cadastrado',
              (item) => (
                <div>
                  <p className="font-medium text-gray-900">{item.name as string}</p>
                  <p className="text-sm text-gray-500">
                    {petTypeLabels[item.type as string] || item.type as string}
                    {!!item.breed && ` - ${item.breed as string}`}
                    {!!item.color && ` (${item.color as string})`}
                  </p>
                </div>
              )
            )}
          </>
        ) : (
          <Card>
            <CardContent>
              <div className="py-8 text-center space-y-4">
                <p className="text-gray-500">Voce ainda nao possui um cadastro de morador.</p>
                <p className="text-gray-400 text-sm">Complete seu cadastro para gerenciar contatos de emergencia, membros do domicilio, veiculos e pets.</p>
                <Button onClick={openRegisterModal}>Completar Cadastro de Morador</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Auto-cadastro de morador */}
      <Modal isOpen={modalType === 'register'} onClose={() => setModalType(null)} title="Cadastro de Morador" size="lg">
        <div className="space-y-4">
          <Select
            label="Unidade"
            value={registerForm.unitId}
            onChange={(e) => setRegisterForm({ ...registerForm, unitId: e.target.value })}
            placeholder="Selecione a unidade"
            options={units.map((u) => ({ value: u.id, label: u.identifier || `${u.block} - ${u.number}` }))}
            required
          />
          <Select
            label="Tipo"
            value={registerForm.type}
            onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value as ResidentType })}
            options={Object.entries(residentTypeLabels).map(([value, label]) => ({ value, label }))}
          />
          <Input
            label="Nome completo"
            value={registerForm.fullName}
            onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            />
            <Input
              label="Telefone"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CPF"
              value={registerForm.cpf}
              onChange={(e) => setRegisterForm({ ...registerForm, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
            <Input
              label="RG"
              value={registerForm.rg}
              onChange={(e) => setRegisterForm({ ...registerForm, rg: e.target.value })}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button
            onClick={handleRegister}
            loading={modalLoading}
            disabled={!registerForm.unitId || !registerForm.fullName}
          >
            Cadastrar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Contato de Emergencia */}
      <Modal isOpen={modalType === 'contact'} onClose={() => setModalType(null)} title="Novo Contato de Emergencia">
        <div className="space-y-4">
          <Input label="Nome" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
          <Input label="Telefone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="(11) 99999-9999" required />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={contactForm.isWhatsApp} onChange={(e) => setContactForm({ ...contactForm, isWhatsApp: e.target.checked })} className="rounded border-gray-300" />
            WhatsApp
          </label>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button onClick={handleAddContact} loading={modalLoading} disabled={!contactForm.name || !contactForm.phone}>Adicionar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Membro do Domicilio */}
      <Modal isOpen={modalType === 'member'} onClose={() => setModalType(null)} title="Novo Membro do Domicilio">
        <div className="space-y-4">
          <Input label="Nome" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required />
          <Select label="Parentesco" value={memberForm.relationship} onChange={(e) => setMemberForm({ ...memberForm, relationship: e.target.value as RelationshipType })} options={Object.entries(relationshipLabels).map(([value, label]) => ({ value, label }))} />
          <Input label="Email" type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
          <Input label="Documento (RG/CPF)" value={memberForm.document} onChange={(e) => setMemberForm({ ...memberForm, document: e.target.value })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button onClick={handleAddMember} loading={modalLoading} disabled={!memberForm.name}>Adicionar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Funcionario */}
      <Modal isOpen={modalType === 'employee'} onClose={() => setModalType(null)} title="Novo Funcionario">
        <div className="space-y-4">
          <Input label="Nome" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} required />
          <Input label="Documento (RG/CPF)" value={employeeForm.document} onChange={(e) => setEmployeeForm({ ...employeeForm, document: e.target.value })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button onClick={handleAddEmployee} loading={modalLoading} disabled={!employeeForm.name}>Adicionar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Veiculo */}
      <Modal isOpen={modalType === 'vehicle'} onClose={() => setModalType(null)} title="Novo Veiculo">
        <div className="space-y-4">
          <Input label="Marca" value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} placeholder="Ex: Volkswagen" required />
          <Input label="Modelo" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Ex: Gol" required />
          <Input label="Cor" value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="Ex: Prata" required />
          <Input label="Placa" value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })} placeholder="Ex: ABC1D23" required />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button onClick={handleAddVehicle} loading={modalLoading} disabled={!vehicleForm.brand || !vehicleForm.model || !vehicleForm.color || !vehicleForm.plate}>Adicionar</Button>
        </ModalFooter>
      </Modal>

      {/* Modal: Pet */}
      <Modal isOpen={modalType === 'pet'} onClose={() => setModalType(null)} title="Novo Pet">
        <div className="space-y-4">
          <Input label="Nome" value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} required />
          <Select label="Tipo" value={petForm.type} onChange={(e) => setPetForm({ ...petForm, type: e.target.value as PetType })} options={Object.entries(petTypeLabels).map(([value, label]) => ({ value, label }))} />
          <Input label="Raca" value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} />
          <Input label="Cor" value={petForm.color} onChange={(e) => setPetForm({ ...petForm, color: e.target.value })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button onClick={handleAddPet} loading={modalLoading} disabled={!petForm.name}>Adicionar</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
