import { useState } from "react";
import { UserPlus, UserMinus, Edit, Trash2, PlusCircle, RefreshCcw, Users } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../../lib/errorHandlers";

interface UserManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  users: {id: string, name: string, title?: string}[];
  isSubmitting: boolean;
  setIsSubmitting: (sub: boolean) => void;
}

export function UserManagementDialog({
  isOpen,
  onOpenChange,
  userEmail,
  users,
  isSubmitting,
  setIsSubmitting
}: UserManagementDialogProps) {
  const [userName, setUserName] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [editingUser, setEditingUser] = useState<{id: string, name: string, title?: string} | null>(null);

  const handleAddUser = async () => {
    if (!userName || !userEmail) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "users", userEmail.toLowerCase(), "staff"), {
        name: userName,
        title: userTitle
      });
      setUserName("");
      setUserTitle("");
      toast.success("Authorized user added to terminal");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userEmail}/staff`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !userEmail) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", userEmail.toLowerCase(), "staff", editingUser.id), {
        name: editingUser.name,
        title: editingUser.title
      });
      setEditingUser(null);
      toast.success("User credentials updated");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userEmail}/staff/${editingUser.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!userEmail) return;
    try {
      await deleteDoc(doc(db, "users", userEmail.toLowerCase(), "staff", id));
      toast.success("User access revoked from terminal");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userEmail}/staff/${id}`);
    }
  };

  const tableHeadClass = "text-[10px] uppercase font-black text-brand-blue/60 tracking-widest text-center h-10";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-1 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh] touch-none">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none rounded-t-xl shrink-0 touch-auto">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <Users className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Personnel Registry</DialogTitle>
                <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] uppercase tracking-[0.12em] mt-1">Terminal Authority Management</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto touch-auto">
          <div className="p-6 space-y-8">
            <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 space-y-4">
              <Label className="text-[10px] uppercase font-black text-brand-blue/80 tracking-widest">Enroll Authorized Personnel</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Full Name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-brand-surface border-brand-blue/20 text-sm h-8"
                />
                <Select value={userTitle} onValueChange={setUserTitle}>
                  <SelectTrigger className={`w-32 h-8 bg-brand-surface border-brand-blue/20 text-xs ${!userTitle ? 'text-muted-foreground' : 'text-brand-dark-grey'}`}>
                    <SelectValue placeholder="Title" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface">
                    <SelectItem value="PIC">PIC</SelectItem>
                    <SelectItem value="RPh">RPh</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddUser} 
                  className="bg-brand-blue text-white hover:bg-brand-blue/90 h-8 px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-brand-dark-grey">System Users</Label>
              <div className="border border-brand-grey/20 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-brand-light-grey/50">
                    <TableRow>
                      <TableHead className={tableHeadClass}>Name</TableHead>
                      <TableHead className={`${tableHeadClass} text-center`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-brand-blue/5">
                        <TableCell className="font-medium text-brand-dark-grey py-3 text-center">
                          {editingUser?.id === u.id ? (
                            <div className="flex gap-2 items-center">
                              <Input 
                                value={editingUser?.name || ""}
                                onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                                className="h-8 bg-brand-surface border-brand-blue/30 flex-1"
                                autoFocus
                              />
                              <Select 
                                value={editingUser?.title || ""} 
                                onValueChange={(v) => setEditingUser(prev => prev ? {...prev, title: v} : null)}
                              >
                                <SelectTrigger className={`w-28 h-8 bg-brand-surface border-brand-blue/30 ${!editingUser?.title ? 'text-muted-foreground' : 'text-brand-dark-grey'}`}>
                                  <SelectValue placeholder="Title" />
                                </SelectTrigger>
                                <SelectContent className="bg-brand-surface">
                                  <SelectItem value="PIC">PIC</SelectItem>
                                  <SelectItem value="RPh">RPh</SelectItem>
                                  <SelectItem value="Tech">Tech</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <span>{u.name} {u.title && <span className="text-brand-dark-grey/60">({u.title})</span>}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex justify-center gap-1">
                            {editingUser?.id === u.id ? (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-brand-blue"
                                onClick={handleUpdateUser}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-brand-dark-grey/60 hover:text-brand-blue"
                                onClick={() => setEditingUser(u)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-brand-dark-grey/60 hover:text-red-500"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 touch-auto">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 rounded-xl"
          >
            Close User Controls
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
