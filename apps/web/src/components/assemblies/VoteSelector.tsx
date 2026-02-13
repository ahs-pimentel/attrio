'use client';

// Tipo de voto - usando string literal para compatibilidade
type VoteChoice = 'YES' | 'NO' | 'ABSTENTION';

interface VoteSelectorProps {
  onVote: (choice: VoteChoice) => void;
  disabled?: boolean;
  loading?: boolean;
  selectedChoice?: VoteChoice | null;
}

export type { VoteChoice };

/**
 * VoteSelector - Componente para selecionar opcao de voto
 */
export function VoteSelector({
  onVote,
  disabled = false,
  loading = false,
  selectedChoice = null,
}: VoteSelectorProps) {
  const voteOptions: Array<{
    choice: VoteChoice;
    label: string;
    color: string;
    bgColor: string;
    hoverColor: string;
    icon: React.ReactNode;
  }> = [
    {
      choice: 'YES',
      label: 'Sim',
      color: 'text-green-700',
      bgColor: 'bg-green-100 border-green-300',
      hoverColor: 'hover:bg-green-200',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
          />
        </svg>
      ),
    },
    {
      choice: 'NO',
      label: 'Nao',
      color: 'text-red-700',
      bgColor: 'bg-red-100 border-red-300',
      hoverColor: 'hover:bg-red-200',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54"
          />
        </svg>
      ),
    },
    {
      choice: 'ABSTENTION',
      label: 'Abstencao',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 border-gray-300',
      hoverColor: 'hover:bg-gray-200',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {voteOptions.map((option) => (
        <button
          key={option.choice}
          type="button"
          onClick={() => onVote(option.choice)}
          disabled={disabled || loading}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
            ${option.bgColor} ${option.color}
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : option.hoverColor + ' cursor-pointer'}
            ${selectedChoice === option.choice ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
          `}
        >
          {option.icon}
          <span className="mt-2 font-semibold">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * VoteChoiceBadge - Badge para exibir escolha de voto
 */
interface VoteChoiceBadgeProps {
  choice: VoteChoice;
  size?: 'sm' | 'md';
}

export function VoteChoiceBadge({ choice, size = 'sm' }: VoteChoiceBadgeProps) {
  const config: Record<VoteChoice, { label: string; className: string }> = {
    YES: {
      label: 'Sim',
      className: 'bg-green-100 text-green-800',
    },
    NO: {
      label: 'Nao',
      className: 'bg-red-100 text-red-800',
    },
    ABSTENTION: {
      label: 'Abstencao',
      className: 'bg-gray-100 text-gray-800',
    },
  };

  const { label, className } = config[choice];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${className} ${sizeClasses}`}
    >
      {label}
    </span>
  );
}
