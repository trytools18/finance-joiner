
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TransactionParty {
  id: string;
  user_id: string;
  name: string;
  type: string;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export function TransactionPartiesSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<TransactionParty | null>(null);

  const { data: parties = [] } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as TransactionParty[];
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (values: Omit<TransactionParty, "id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("No user found");

      if (editingParty) {
        const { error } = await supabase
          .from("transaction_parties")
          .update({
            name: values.name,
            type: values.type,
            company_name: values.company_name,
          })
          .eq("id", editingParty.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("transaction_parties")
          .insert({
            user_id: user.id,
            name: values.name,
            type: values.type,
            company_name: values.company_name,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-parties"] });
      setIsDialogOpen(false);
      setEditingParty(null);
      toast({
        title: "Success",
        description: `Transaction party ${editingParty ? "updated" : "added"} successfully.`,
      });
    },
    onError: (error) => {
      console.error("Error saving transaction party:", error);
      toast({
        title: "Error",
        description: "Failed to save transaction party. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transaction_parties")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-parties"] });
      toast({
        title: "Success",
        description: "Transaction party deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting transaction party:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction party. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    mutation.mutate({
      user_id: user?.id as string,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      company_name: formData.get("company_name") as string,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Transaction Parties</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingParty ? "Edit Party" : "Add New Party"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingParty?.name}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name (Optional)</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={editingParty?.company_name || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={editingParty?.type || "customer"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                {editingParty ? "Save Changes" : "Add Party"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {parties.map((party) => (
          <div
            key={party.id}
            className="flex items-center justify-between p-3 bg-card rounded-lg border"
          >
            <div>
              <p className="font-medium">{party.name}</p>
              {party.company_name && (
                <p className="text-sm text-muted-foreground">
                  {party.company_name}
                </p>
              )}
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                {party.type}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingParty(party);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(party.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
