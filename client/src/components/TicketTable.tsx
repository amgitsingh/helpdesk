import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { type Ticket, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  [TicketStatus.new]: {
    label: "New",
    className:
      "inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-200 dark:ring-blue-800/60",
  },
  [TicketStatus.processing]: {
    label: "Processing",
    className:
      "inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-200 dark:ring-amber-800/60",
  },
  [TicketStatus.open]: {
    label: "Open",
    className:
      "inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm",
  },
  [TicketStatus.resolved]: {
    label: "Resolved",
    className:
      "inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800/60",
  },
  [TicketStatus.closed]: {
    label: "Closed",
    className:
      "inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border",
  },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General Question",
  [TicketCategory.technical_question]: "Technical Question",
  [TicketCategory.refund_request]: "Refund Request",
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="ml-1.5 h-3.5 w-3.5" />;
  if (sorted === "desc") return <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />;
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.subject}
      </Link>
    ),
  },
  {
    id: "senderName",
    accessorKey: "senderName",
    header: "Sender",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.senderName}{" "}
        <span className="text-xs">
          &lt;{row.original.senderEmail}&gt;
        </span>
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<TicketStatus>();
      return (
        <span className={STATUS_CONFIG[status].className}>
          {STATUS_CONFIG[status].label}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => {
      const category = getValue<TicketCategory | null>();
      return (
        <span className="text-muted-foreground">
          {category ? CATEGORY_LABELS[category] : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
  },
];

type Props = {
  tickets: Ticket[];
  isPending: boolean;
  isError: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

export function TicketTable({ tickets, isPending, isError, sorting, onSortingChange }: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-1/3 h-5" />
            <Skeleton className="w-1/4 h-5" />
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-20 h-5" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load tickets.</p>;
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                <button
                  className="inline-flex items-center cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  <SortIcon sorted={header.column.getIsSorted()} />
                </button>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
              No tickets found.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
