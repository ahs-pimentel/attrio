'use client';

import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';

/**
 * Table - Container principal da tabela
 */
interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', children, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={`min-w-full divide-y divide-gray-200 ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);

Table.displayName = 'Table';

/**
 * TableHeader - Cabecalho da tabela
 */
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <thead ref={ref} className={`bg-gray-50 ${className}`} {...props}>
    {children}
  </thead>
));

TableHeader.displayName = 'TableHeader';

/**
 * TableBody - Corpo da tabela
 */
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`bg-white divide-y divide-gray-200 ${className}`}
    {...props}
  >
    {children}
  </tbody>
));

TableBody.displayName = 'TableBody';

/**
 * TableRow - Linha da tabela
 */
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', hoverable = true, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={`${hoverable ? 'hover:bg-gray-50' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = 'TableRow';

/**
 * TableHead - Celula do cabecalho
 */
export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <th
    ref={ref}
    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    {...props}
  >
    {children}
  </th>
));

TableHead.displayName = 'TableHead';

/**
 * TableCell - Celula do corpo
 */
export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className = '', children, ...props }, ref) => (
  <td
    ref={ref}
    className={`px-4 py-3 text-sm text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </td>
));

TableCell.displayName = 'TableCell';

/**
 * TableEmpty - Componente para exibir quando a tabela esta vazia
 */
interface TableEmptyProps {
  message?: string;
  colSpan: number;
}

export function TableEmpty({ message = 'Nenhum registro encontrado', colSpan }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}

/**
 * TableLoading - Componente de loading para tabela
 */
interface TableLoadingProps {
  colSpan: number;
}

export function TableLoading({ colSpan }: TableLoadingProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </td>
    </tr>
  );
}
