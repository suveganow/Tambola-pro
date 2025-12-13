import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface GameHistoryItem {
  id: string;
  date: string;
  ticketPrice: number;
  pattern: string | null;
  prize: number;
  status: "WON" | "LOST";
}

interface HistoryTableProps {
  data: GameHistoryItem[];
}

export function HistoryTable({ data }: HistoryTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Game ID</TableHead>
            <TableHead>XP Cost</TableHead>
            <TableHead>Pattern</TableHead>
            <TableHead>XP Won</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.date}</TableCell>
              <TableCell className="font-medium">{item.id}</TableCell>
              <TableCell>{item.ticketPrice} XP</TableCell>
              <TableCell>{item.pattern || "-"}</TableCell>
              <TableCell>{item.prize} XP</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={item.status === "WON" ? "default" : "secondary"}
                  className={
                    item.status === "WON"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
