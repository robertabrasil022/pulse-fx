import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegrationLog } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface IntegrationLogsTableProps {
  logs: IntegrationLog[];
}

export function IntegrationLogsTable({ logs }: IntegrationLogsTableProps) {
  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    } else if (statusCode >= 400) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    return <Clock className="h-4 w-4 text-warning" />;
  };

  const getStatusBadge = (statusCode: number) => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const isError = statusCode >= 400;
    
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        isSuccess && "bg-success/10 text-success",
        isError && "bg-destructive/10 text-destructive",
        !isSuccess && !isError && "bg-warning/10 text-warning"
      )}>
        {getStatusIcon(statusCode)}
        {statusCode}
      </span>
    );
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">Integration Logs</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor n8n workflow executions
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-medium">Workflow ID</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium">Message</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No integration logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-primary">
                    {log.workflow_id}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status_code)}
                  </TableCell>
                  <TableCell className="text-sm text-foreground max-w-[300px] truncate">
                    {log.message || '-'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
