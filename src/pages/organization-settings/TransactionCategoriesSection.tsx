import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  user_id: string;
}

export function TransactionCategoriesSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['transaction-categories'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Category[];
    },
    enabled: !!user?.id,
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert({
          name,
          type: activeTab,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      setNewCategory('');
      toast({
        title: "Category added",
        description: `New ${activeTab} category has been added successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('transaction_categories')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transaction_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-categories'] });
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a name for the category.",
        variant: "destructive",
      });
      return;
    }
    
    addCategoryMutation.mutate(newCategory);
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setEditValue(category.name);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const saveEdit = () => {
    if (!editingCategory) return;
    
    if (!editValue.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a name for the category.",
        variant: "destructive",
      });
      return;
    }
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editValue,
    });
  };

  const filteredCategories = categories.filter(
    (category) => category.type === activeTab
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Categories</CardTitle>
        <CardDescription>
          Manage categories for your income and expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'income' | 'expense')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="space-y-4">
            <div className="flex items-center space-x-2 mt-4">
              <Input
                placeholder="New income category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="expense" className="space-y-4">
            <div className="flex items-center space-x-2 mt-4">
              <Input
                placeholder="New expense category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-2">
          <Label>Current {activeTab} categories</Label>
          {isLoading ? (
            <p>Loading categories...</p>
          ) : filteredCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {activeTab} categories found. Add some above.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  {editingCategory?.id === category.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                      />
                      <Button onClick={saveEdit} size="icon" variant="ghost">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button onClick={cancelEditing} size="icon" variant="ghost">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{category.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button
                          onClick={() => startEditing(category)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Categories help you organize your transactions
        </p>
      </CardFooter>
    </Card>
  );
}
